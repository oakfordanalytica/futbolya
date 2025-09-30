// convex/partidos.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const tipoEventoValidator = v.union(
  v.literal("Gol"), v.literal("Tarjeta Amarilla"), v.literal("Tarjeta Roja"),
  v.literal("Sustitución"), v.literal("Falta"), v.literal("Tiro de Esquina"),
  v.literal("Tiro Libre"), v.literal("Inicio Partido"), v.literal("Descanso"),
  v.literal("Segundo Tiempo"), v.literal("Fin Partido"), v.literal("Penal")
);

/**
 * Schedules a new match.
 */
export const schedule = mutation({
  args: {
    fecha: v.string(), // ISO 8601 string
    grupoId: v.id("torneoGrupos"),
    equipoLocalId: v.id("equipos"),
    equipoVisitante: v.id("equipos"),
  },
  handler: async (ctx, args) => {
    // TODO: Add auth checks (admin or tournament organizer)
    return await ctx.db.insert("partidos", {
      fecha: args.fecha,
      grupoId: args.grupoId,
      equipoLocalId: args.equipoLocalId,
      equipoVisitanteId: args.equipoVisitante, // Corrected from `args.equipoVisitante`
    });
  },
});

/**
 * Updates a match, e.g., to assign a referee or add a final score.
 */
export const updateScore = mutation({
    args: {
        partidoId: v.id("partidos"),
        golesLocal: v.number(),
        golesVisitante: v.number(),
    },
    handler: async (ctx, args) => {
        // TODO: Add auth checks
        return await ctx.db.patch(args.partidoId, {
            golesLocal: args.golesLocal,
            golesVisitante: args.golesVisitante
        });
    }
});

/**
 * Adds an event to a match.
 */
export const addEvent = mutation({
    args: {
        partidoId: v.id("partidos"),
        tipoEvento: tipoEventoValidator,
        minuto: v.number(),
        equipo: v.union(v.literal("local"), v.literal("visitante")),
        jugadorId: v.optional(v.id("jugadores")),
        jugadorSustituidoId: v.optional(v.id("jugadores")),
        descripcion: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: Add auth checks (referee or admin)
        return await ctx.db.insert("partidoEventos", args);
    }
});

/**
 * Gets a single match with all its events.
 */
export const getWithEvents = query({
    args: { id: v.id("partidos") },
    handler: async (ctx, args) => {
        const partido = await ctx.db.get(args.id);
        if (!partido) return null;

        const events = await ctx.db.query("partidoEventos")
            .withIndex("by_partido", q => q.eq("partidoId", args.id))
            .order("asc") // Order by creation time to get a timeline
            .collect();

        // Fetch full team data
        const equipoLocal = await ctx.db.get(partido.equipoLocalId);
        const equipoVisitante = await ctx.db.get(partido.equipoVisitanteId);

        return { ...partido, events, equipoLocal, equipoVisitante };
    }
});