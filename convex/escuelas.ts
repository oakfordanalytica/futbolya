// convex/escuelas.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

// =================================================================
// MUTATIONS (Write Operations)
// =================================================================

/**
 * Creates a new school.
 * Only accessible by users with the 'admin' or 'superadmin' role.
 */
export const create = mutation({
  args: {
    nombreEscuela: v.string(),
    nit: v.optional(v.string()),
    direccion: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication & Authorization
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required.");
    }

    const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        throw new Error("You do not have permission to create a school.");
    }

    // Input validation
    if (!args.nombreEscuela.trim()) {
        throw new Error("School name cannot be empty.");
    }

    // Create the school
    const schoolId = await ctx.db.insert("escuelas", {
      nombreEscuela: args.nombreEscuela,
      nit: args.nit,
      direccion: args.direccion,
      telefono: args.telefono,
      email: args.email,
    });

    return schoolId;
  },
});

// We can add `update` and `delete` mutations here following the same pattern.

// =================================================================
// QUERIES (Read Operations)
// =================================================================

/**
 * Gets a single school by its ID.
 * Accessible by any authenticated user.
 */
export const get = query({
  args: {
    id: v.id("escuelas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Or return null if public access is desired in some cases
      throw new Error("Authentication required.");
    }

    const school = await ctx.db.get(args.id);
    return school;
  },
});

/**
 * Lists all available schools.
 * Accessible by any authenticated user.
 */
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required.");
    }

    const schools = await ctx.db.query("escuelas").order("desc").collect();
    return schools;
  },
});