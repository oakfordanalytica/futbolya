// convex/entrenadores.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new coach (entrenador).
 * Internally creates a 'persona' and an 'entrenador' record.
 * Accessible only by 'admin' and 'superadmin' roles.
 */
export const create = mutation({
  args: {
    // Persona details
    nombrePersona: v.string(),
    apellidoPersona: v.string(),
    fechaNacimiento: v.string(),
    numeroDocumento: v.string(),
    tipoDocumentoId: v.id("tiposDocumento"),
    // Entrenador details
    escuelaId: v.optional(v.id("escuelas")),
    comet: v.string(),
    fechaIngresoEscuela: v.string(),
    tipoLicenciaId: v.optional(v.id("tiposLicencia")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");

    const userRole = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;
    if (!["admin", "superadmin"].includes(userRole)) {
      throw new Error("You do not have permission to create a coach.");
    }

    // Step 1: Create the Persona
    const personaId = await ctx.db.insert("personas", {
      nombrePersona: args.nombrePersona,
      apellidoPersona: args.apellidoPersona,
      fechaNacimiento: args.fechaNacimiento,
      numeroDocumento: args.numeroDocumento,
      tipoDocumentoId: args.tipoDocumentoId,
    });

    // Step 2: Create the Entrenador, linking to the new Persona
    const entrenadorId = await ctx.db.insert("entrenadores", {
      personaId: personaId,
      escuelaId: args.escuelaId,
      comet: args.comet,
      fechaIngresoEscuela: args.fechaIngresoEscuela,
      tipoLicenciaId: args.tipoLicenciaId,
    });

    return entrenadorId;
  },
});

/**
 * Lists all coaches with their persona details.
 */
export const listWithPersonas = query({
    handler: async (ctx) => {
        const entrenadores = await ctx.db.query("entrenadores").collect();

        // Join with persona data
        return Promise.all(
            entrenadores.map(async (entrenador) => {
                const persona = await ctx.db.get(entrenador.personaId);
                return { ...entrenador, persona };
            })
        );
    }
});