// convex/ligas.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new league.
 * Only accessible by users with the 'admin' or 'superadmin' role.
 */
export const create = mutation({
  args: {
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    activo: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      throw new Error("You do not have permission to create a league.");
    }

    if (!args.nombre.trim()) throw new Error("League name cannot be empty.");

    return await ctx.db.insert("ligas", {
      nombre: args.nombre,
      descripcion: args.descripcion,
      activo: args.activo,
    });
  },
});

/**
 * Lists all available leagues.
 * Accessible by any authenticated user.
 */
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    return await ctx.db.query("ligas").order("desc").collect();
  },
});