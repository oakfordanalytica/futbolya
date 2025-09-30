// convex/equipos.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";
import { Id } from "./_generated/dataModel";

/**
 * Creates a new team.
 * Accessible by 'admin', 'superadmin', and 'entrenador' roles.
 */
export const create = mutation({
  args: {
    nombre: v.string(),
    escuelaId: v.id("escuelas"),
    categoriaEdadId: v.optional(v.id("categoriasEdad")),
    entrenadorId: v.optional(v.id("entrenadores")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
    if (!['admin', 'superadmin', 'entrenador'].includes(userRole)) {
      throw new Error("You do not have permission to create a team.");
    }

    if (!args.nombre.trim()) throw new Error("Team name cannot be empty.");

    return await ctx.db.insert("equipos", {
      nombre: args.nombre,
      escuelaId: args.escuelaId,
      categoriaEdadId: args.categoriaEdadId,
      entrenadorId: args.entrenadorId,
    });
  },
});

/**
 * Assigns a player to a team.
 */
export const addPlayer = mutation({
    args: {
        equipoId: v.id("equipos"),
        jugadorId: v.id("jugadores"),
        numeroCamiseta: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Authentication required.");

        // TODO: Add role check (coach of the team or admin)

        // Check if player is already in the team
        const existing = await ctx.db.query("jugadoresPorEquipo")
            .withIndex("by_equipo", q => q.eq("equipoId", args.equipoId))
            .filter(q => q.eq(q.field("jugadorId"), args.jugadorId))
            .first();

        if (existing) {
            throw new Error("Player is already on this team.");
        }

        return await ctx.db.insert("jugadoresPorEquipo", {
            equipoId: args.equipoId,
            jugadorId: args.jugadorId,
            numeroCamiseta: args.numeroCamiseta,
        });
    }
});


/**
 * Lists all teams, optionally filtered by school.
 */
export const list = query({
    args: {
        escuelaId: v.optional(v.id("escuelas"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Authentication required.");

        if (args.escuelaId) {
            return await ctx.db.query("equipos")
                .withIndex("by_escuela", q => q.eq("escuelaId", args.escuelaId as Id<"escuelas">))
                .order("desc")
                .collect();
        }

        return await ctx.db.query("equipos").order("desc").collect();
    }
});

/**
 * Gets a single team and its players.
 * This demonstrates a simple "join" pattern.
 */
export const getWithPlayers = query({
  args: { id: v.id("equipos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    // 1. Fetch the team itself
    const team = await ctx.db.get(args.id);
    if (!team) return null;

    // 2. Fetch the relations from the junction table
    const teamPlayerLinks = await ctx.db.query("jugadoresPorEquipo")
      .withIndex("by_equipo", q => q.eq("equipoId", args.id))
      .collect();

    // 3. Fetch the actual player data for each link
    const players = await Promise.all(
        teamPlayerLinks.map(link => ctx.db.get(link.jugadorId))
    );

    // 4. Fetch the full persona data for each player
    const playersWithPersonas = await Promise.all(
        players.map(async (player) => {
            if (!player) return null;
            const persona = await ctx.db.get(player.personaId);
            return { ...player, persona };
        })
    );

    return { ...team, players: playersWithPersonas.filter(Boolean) };
  },
});