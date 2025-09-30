// convex/gruposEntrenamiento.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new training group.
 */
export const create = mutation({
    args: {
        entrenadorId: v.id("entrenadores"),
        categoriaEdadId: v.id("categoriasEdad"),
        escuelaId: v.id("escuelas"),
        anio: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Authentication required.");

        const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
        if (!["admin", "superadmin", "entrenador"].includes(userRole)) {
            throw new Error("You do not have permission.");
        }
        return await ctx.db.insert("gruposEntrenamiento", args);
    }
});

/**
 * Lists all training groups for the currently logged-in coach.
 */
export const listMyGroups = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Find the entrenador profile linked to the current user
        const user = await ctx.db.query("users")
            .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return [];

        const entrenador = await ctx.db.query("entrenadores")
            .withIndex("by_persona_id", q => q.eq("personaId", user.personaId))
            .first();

        if (!entrenador) return [];

        return await ctx.db.query("gruposEntrenamiento")
            .withIndex("by_entrenador", q => q.eq("entrenadorId", entrenador._id))
            .collect();
    }
});