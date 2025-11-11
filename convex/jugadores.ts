// convex/jugadores.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { extractFutbolYaRole, FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new player.
 * This internally creates a 'persona' and a 'jugador' record.
 * Accessible by 'admin' and 'entrenador' roles.
 */
export const create = mutation({
  args: {
    // Persona details
    nombrePersona: v.string(),
    apellidoPersona: v.string(),
    fechaNacimiento: v.string(),
    numeroDocumento: v.string(),
    tipoDocumentoId: v.id("tiposDocumento"),
    nacionId: v.optional(v.id("naciones")),
    genero: v.optional(v.string()),
    // Jugador details
    escuelaId: v.id("escuelas"),
    posicionId: v.id("posicionesCancha"),
    comet: v.string(),
    categoriaEdadId: v.optional(v.id("categoriasEdad")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    const userRole = extractFutbolYaRole(identity);
    if (userRole && !["admin", "superadmin", "entrenador"].includes(userRole)) {
      throw new Error("You do not have permission to create a player.");
    }

    // Step 1: Create the Persona
    const personaId = await ctx.db.insert("personas", {
      nombrePersona: args.nombrePersona,
      apellidoPersona: args.apellidoPersona,
      fechaNacimiento: args.fechaNacimiento,
      numeroDocumento: args.numeroDocumento,
      tipoDocumentoId: args.tipoDocumentoId,
      nacionId: args.nacionId,
      genero: args.genero,
    });

    // Step 2: Create the Jugador, linking to the new Persona
    const jugadorId = await ctx.db.insert("jugadores", {
      personaId: personaId,
      escuelaId: args.escuelaId,
      posicionId: args.posicionId,
      comet: args.comet,
      categoriaEdadId: args.categoriaEdadId,
    });

    return jugadorId;
  },
});


/**
 * Gets a single player with their full persona details.
 */
export const getWithPersona = query({
    args: { id: v.id("jugadores") },
    handler: async (ctx, args) => {
        const jugador = await ctx.db.get(args.id);
        if (!jugador) return null;

        const persona = await ctx.db.get(jugador.personaId);
        if (!persona) return null; // Should not happen in consistent data

        return { ...jugador, persona };
    }
});

/**
 * Lists all players with their persona details.
 * Add filtering/pagination in a real app.
 */
export const listWithPersonas = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
             return []; // Or return [] if preferred
        }
        // Basic auth check done, proceed. Add role checks if necessary.

        const jugadores = await ctx.db.query("jugadores").order("desc").collect();

        // Join with persona data
        const playersWithDetails = await Promise.all(
            jugadores.map(async (jugador) => {
                const persona = await ctx.db.get(jugador.personaId);
                // Optionally fetch school/position names here too if needed for the list view
                // const school = await ctx.db.get(jugador.escuelaId);
                // const position = await ctx.db.get(jugador.posicionId);
                return {
                    ...jugador,
                    persona: persona ?? null, // Handle potential null case
                    // schoolName: school?.nombreEscuela,
                    // positionName: position?.nombre
                 };
            })
        );
        return playersWithDetails;
    }
});