// convex/torneos.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new tournament.
 * Only accessible by users with the 'admin' or 'superadmin' role.
 */
export const create = mutation({
  args: {
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    fechaInicio: v.string(),
    fechaFin: v.optional(v.string()),
    categoriaEdadId: v.id("categoriasEdad"),
    ligaId: v.id("ligas"),
    estado: v.union(v.literal("activo"), v.literal("finalizado"), v.literal("suspendido")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      throw new Error("You do not have permission to create a tournament.");
    }

    return await ctx.db.insert("torneos", args);
  },
});

/**
 * Adds a new phase to a tournament.
 */
export const addPhase = mutation({
    args: {
        nombre: v.string(),
        torneoId: v.id("torneos"),
        tipoFase: v.union(v.literal("Grupos"), v.literal("Eliminatoria"), v.literal("Liga")),
        orden: v.number(),
    },
    handler: async (ctx, args) => {
        // TODO: Add auth checks
        return await ctx.db.insert("torneoFases", args);
    }
});

/**
 * Adds a new group to a tournament phase.
 */
export const addGroup = mutation({
    args: {
        nombre: v.string(),
        torneoFaseId: v.id("torneoFases"),
        descripcion: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: Add auth checks
        return await ctx.db.insert("torneoGrupos", args);
    }
});


/**
 * Lists all available tournaments.
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("torneos").order("desc").collect();
  },
});

/**
 * Gets a full tournament with its phases, groups, and teams.
 */
export const getFullTournament = query({
    args: { id: v.id("torneos") },
    handler: async (ctx, args) => {
        const tournament = await ctx.db.get(args.id);
        if (!tournament) return null;

        const phases = await ctx.db.query("torneoFases")
            .withIndex("by_torneo", q => q.eq("torneoId", args.id))
            .collect();

        const phasesWithGroups = await Promise.all(
            phases.map(async (phase) => {
                const groups = await ctx.db.query("torneoGrupos")
                    .withIndex("by_fase", q => q.eq("torneoFaseId", phase._id))
                    .collect();

                const groupsWithTeams = await Promise.all(
                    groups.map(async (group) => {
                        const teamLinks = await ctx.db.query("equiposPorGrupo")
                            .withIndex("by_grupo", q => q.eq("grupoId", group._id))
                            .collect();
                        const teams = await Promise.all(teamLinks.map(link => ctx.db.get(link.equipoId)));
                        return { ...group, teams: teams.filter(Boolean) };
                    })
                );
                return { ...phase, groups: groupsWithTeams };
            })
        );

        return { ...tournament, phases: phasesWithGroups };
    }
});