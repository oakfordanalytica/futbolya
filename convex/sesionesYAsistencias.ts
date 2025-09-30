// convex/sesionesYAsistencias.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Creates a new training session.
 */
export const createSesion = mutation({
    args: {
        grupoEntrenamientoId: v.id("gruposEntrenamiento"),
        fecha: v.string(),
        jornada: v.union(v.literal("mañana"), v.literal("tarde")),
        nombre: v.string(),
        descripcion: v.string(),
        duracion: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Authentication required.");

        // Find the user's persona and entrenador record
        const user = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).first();
        if(!user) throw new Error("User not found");
        const entrenador = await ctx.db.query("entrenadores").withIndex("by_persona_id", q => q.eq("personaId", user.personaId)).first();
        if(!entrenador) throw new Error("Coach profile not found");

        return await ctx.db.insert("sesionesEntrenamiento", {
            ...args,
            entrenadorId: entrenador._id, // Assign session to the logged-in coach
        });
    }
});


/**
 * Records or updates attendance for a list of players for a specific session.
 */
export const recordAttendance = mutation({
    args: {
        sesionEntrenamientoId: v.id("sesionesEntrenamiento"),
        asistencias: v.array(v.object({
            jugadorId: v.id("jugadores"),
            estadoId: v.id("asistenciaEstados"),
            observaciones: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Authentication required.");
        // TODO: Add role checks to ensure only the coach of the group can record attendance.

        for (const asistencia of args.asistencias) {
            // Check for an existing record to update it, otherwise insert a new one.
            const existing = await ctx.db.query("asistencias")
                .withIndex("by_jugador_sesion", q => q
                    .eq("jugadorId", asistencia.jugadorId)
                    .eq("sesionEntrenamientoId", args.sesionEntrenamientoId)
                ).first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    estadoId: asistencia.estadoId,
                    observaciones: asistencia.observaciones
                });
            } else {
                await ctx.db.insert("asistencias", {
                    sesionEntrenamientoId: args.sesionEntrenamientoId,
                    jugadorId: asistencia.jugadorId,
                    estadoId: asistencia.estadoId,
                    observaciones: asistencia.observaciones,
                });
            }
        }
    }
});


/**
 * Gets a training session along with the attendance status for all players in the group.
 */
export const getSesionWithAttendance = query({
    args: {
        sesionId: v.id("sesionesEntrenamiento"),
    },
    handler: async (ctx, args) => {
        const sesion = await ctx.db.get(args.sesionId);
        if (!sesion) return null;

        const grupo = await ctx.db.get(sesion.grupoEntrenamientoId);
        if(!grupo) return null;

        // Find all players associated with the teams in this age category and school
        // This is a simplified approach; a real app might link players directly to training groups
        const equipos = await ctx.db.query("equipos")
            .withIndex("by_escuela", q => q.eq("escuelaId", grupo.escuelaId))
            .filter(q => q.eq(q.field("categoriaEdadId"), grupo.categoriaEdadId))
            .collect();
        
        const playerLinks = (await Promise.all(equipos.map(e => ctx.db.query("jugadoresPorEquipo").withIndex("by_equipo", q => q.eq("equipoId", e._id)).collect()))).flat();
        
        const players = await Promise.all(
            playerLinks.map(async (link) => {
                const jugador = await ctx.db.get(link.jugadorId);
                const persona = jugador ? await ctx.db.get(jugador.personaId) : null;
                const asistencia = await ctx.db.query("asistencias")
                    .withIndex("by_jugador_sesion", q => q.eq("jugadorId", link.jugadorId).eq("sesionEntrenamientoId", args.sesionId))
                    .first();
                const estado = asistencia ? await ctx.db.get(asistencia.estadoId) : null;

                return {
                    jugador,
                    persona,
                    asistencia: {
                        ...asistencia,
                        estado: estado
                    }
                }
            })
        );

        return { ...sesion, players };
    }
});