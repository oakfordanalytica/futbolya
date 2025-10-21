// convex/partidos.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { extractFutbolYaRole, isAdminOrSuperAdmin } from "../lib/role-utils";

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

/**
 * Lists all scheduled matches.
 * Consider adding filters and pagination later.
 */
export const listAll = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        // TODO: Add role checks if needed (e.g., only admins see all matches?)

        const partidos = await ctx.db.query("partidos")
            .order("desc") // Sort by creation time or match date
            // .index("by_fecha") // If you add an index on 'fecha'
            .collect();

        // Optional: Fetch team names here for a richer list if needed immediately
        // const partidosWithTeams = await Promise.all(partidos.map(async (p) => {
        //     const local = await ctx.db.get(p.equipoLocalId);
        //     const visitor = await ctx.db.get(p.equipoVisitanteId);
        //     return {...p, localName: local?.nombre, visitorName: visitor?.nombre };
        // }));
        // return partidosWithTeams;

        return partidos; // Return basic list for now
    }
});

/**
 * Sets the lineup (starters and substitutes) for a specific team in a specific match.
 * This will replace any existing lineup for that team in that match.
 * Accessible by admin, superadmin, potentially coach/referee later.
 */
export const setMatchLineup = mutation({
  args: {
    partidoId: v.id("partidos"),
    equipoId: v.id("equipos"),
    // Array of objects for starters
    titulares: v.array(v.object({
      jugadorId: v.id("jugadores"),
      numero: v.optional(v.number()),
    })),
    // Array of objects for substitutes
    suplentes: v.array(v.object({
      jugadorId: v.id("jugadores"),
      numero: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    // --- Authorization ---
    const userRole = extractFutbolYaRole(identity);
    // TODO: Refine roles - maybe coach of the specific team or assigned referee?
    if (!isAdminOrSuperAdmin(userRole)) {
      throw new Error("Permission denied to set lineup.");
    }

    // --- Validation ---
    // Ensure partido and equipo exist (optional, but good practice)
    const partido = await ctx.db.get(args.partidoId);
    if (!partido) throw new Error("Match not found.");
    if (partido.equipoLocalId !== args.equipoId && partido.equipoVisitanteId !== args.equipoId) {
        throw new Error("Team is not part of this match.");
    }

    // --- Logic ---
    // 1. Delete existing lineup entries for this team in this match
    const existingEntries = await ctx.db
      .query("jugadoresPorPartido")
      .withIndex("by_partido_equipo", (q) =>
        q.eq("partidoId", args.partidoId).eq("equipoId", args.equipoId)
      )
      .collect();

    await Promise.all(existingEntries.map((entry) => ctx.db.delete(entry._id)));

    // 2. Insert new entries for starters
    await Promise.all(
      args.titulares.map((p) =>
        ctx.db.insert("jugadoresPorPartido", {
          partidoId: args.partidoId,
          equipoId: args.equipoId,
          jugadorId: p.jugadorId,
          rolEnPartido: "titular",
          numeroCamisetaPartido: p.numero,
        })
      )
    );

    // 3. Insert new entries for substitutes
    await Promise.all(
      args.suplentes.map((p) =>
        ctx.db.insert("jugadoresPorPartido", {
          partidoId: args.partidoId,
          equipoId: args.equipoId,
          jugadorId: p.jugadorId,
          rolEnPartido: "suplente",
          numeroCamisetaPartido: p.numero,
        })
      )
    );

    console.log(`Lineup set for team ${args.equipoId} in match ${args.partidoId}`);
    // You could return the count or just success
    return { success: true, starters: args.titulares.length, subs: args.suplentes.length };
  },
});


/**
 * Gets the lineup details (players, roles, numbers) for both teams in a specific match.
 */
export const getMatchLineup = query({
    args: { partidoId: v.id("partidos") },
    handler: async (ctx, args) => {
        const lineupEntries = await ctx.db
            .query("jugadoresPorPartido")
            .withIndex("by_partido_equipo", q => q.eq("partidoId", args.partidoId))
            .collect();

        // Fetch player details (persona) for each entry
        const lineupWithDetails = await Promise.all(
            lineupEntries.map(async (entry) => {
                const jugador = await ctx.db.get(entry.jugadorId);
                const persona = jugador ? await ctx.db.get(jugador.personaId) : null;
                return {
                    ...entry,
                    jugador: jugador ?? null, // Include jugador object
                    persona: persona ?? null, // Include persona object
                };
            })
        );

        // Separate by team and role for easier consumption by the frontend
        const result = {
            local: { titulares: [], suplentes: [] },
            visitante: { titulares: [], suplentes: [] },
        };

        const partido = await ctx.db.get(args.partidoId); // Need match to know which team is local/visitor

        if (!partido) return null; // Match not found

        for (const playerDetail of lineupWithDetails) {
            const teamType = playerDetail.equipoId === partido.equipoLocalId ? "local" : "visitante";
            const roleType = playerDetail.rolEnPartido;

            const targetArrayKey = roleType === "titular" ? "titulares" : "suplentes";

            if (result[teamType] && result[teamType][targetArrayKey]) {
                 result[teamType][targetArrayKey].push(playerDetail as never); 
            }
        }

        return result;
    }
});