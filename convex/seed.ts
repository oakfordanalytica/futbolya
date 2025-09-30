// convex/seed.ts

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// This is the main action that will orchestrate the seeding process.
// To run this, go to your Convex dashboard, find this action, and click "Run".
export const seedDatabase = internalAction({
  handler: async (ctx) => {
    // Clear existing data to prevent duplicates on re-seeding
    // In a real-world scenario, you might want more sophisticated logic here.
    await ctx.runMutation(internal.seed.clearTables);
    console.log("Cleared existing lookup data...");

    // Seed all the lookup tables in parallel
    await Promise.all([
      ctx.runAction(internal.seed.seedNaciones),
      ctx.runAction(internal.seed.seedTiposDocumento),
      ctx.runAction(internal.seed.seedCategoriasEdad),
      ctx.runAction(internal.seed.seedPosicionesCancha),
      ctx.runAction(internal.seed.seedTiposLicencia),
    ]);

    console.log("Database seeding complete!");
  },
});


// =================================================================
// SEEDING ACTIONS FOR EACH LOOKUP TABLE
// =================================================================

export const seedNaciones = internalAction({
    handler: async (ctx) => {
        const naciones = [
            { nombre: "Colombia" },
            { nombre: "Argentina" },
            { nombre: "Brazil" },
            { nombre: "USA" },
            // Add more countries as needed
        ];
        for (const nacion of naciones) {
            await ctx.runMutation(internal.seed.insertNacion, nacion);
        }
        console.log("Seeded 'naciones' table.");
    }
});

export const seedTiposDocumento = internalAction({
    handler: async (ctx) => {
        const tipos = [
            { nombreDocumento: "Cédula de Ciudadanía", codigoDocumento: "CC" },
            { nombreDocumento: "Tarjeta de Identidad", codigoDocumento: "TI" },
            { nombreDocumento: "Pasaporte", codigoDocumento: "PPN" },
            { nombreDocumento: "Cédula de Extranjería", codigoDocumento: "CE" },
        ];
        for (const tipo of tipos) {
            await ctx.runMutation(internal.seed.insertTipoDocumento, tipo);
        }
        console.log("Seeded 'tiposDocumento' table.");
    }
});

export const seedCategoriasEdad = internalAction({
    handler: async (ctx) => {
        const categorias = [
            { nombre: "Sub-10", edadMaxima: 10 },
            { nombre: "Sub-12", edadMaxima: 12 },
            { nombre: "Sub-15", edadMaxima: 15 },
            { nombre: "Sub-17", edadMaxima: 17 },
            { nombre: "Sub-20", edadMaxima: 20 },
            { nombre: "Senior", edadMaxima: 99 },
        ];
        for (const cat of categorias) {
            await ctx.runMutation(internal.seed.insertCategoriaEdad, cat);
        }
        console.log("Seeded 'categoriasEdad' table.");
    }
});

export const seedPosicionesCancha = internalAction({
    handler: async (ctx) => {
        const posiciones = [
            { nombre: "Portero", codigo: "PT", descripcion: "Goalkeeper" },
            { nombre: "Defensa Central", codigo: "DFC", descripcion: "Center Back" },
            { nombre: "Lateral Derecho", codigo: "LD", descripcion: "Right Fullback" },
            { nombre: "Lateral Izquierdo", codigo: "LI", descripcion: "Left Fullback" },
            { nombre: "Mediocampista Defensivo", codigo: "MCD", descripcion: "Defensive Midfielder" },
            { nombre: "Mediocampista Central", codigo: "MC", descripcion: "Center Midfielder" },
            { nombre: "Extremo Derecho", codigo: "ED", descripcion: "Right Winger" },
            { nombre: "Extremo Izquierdo", codigo: "EI", descripcion: "Left Winger" },
            { nombre: "Delantero Centro", codigo: "DC", descripcion: "Striker" },
        ];
        for (const pos of posiciones) {
            await ctx.runMutation(internal.seed.insertPosicionCancha, pos);
        }
        console.log("Seeded 'posicionesCancha' table.");
    }
});

export const seedTiposLicencia = internalAction({
    handler: async (ctx) => {
        const licencias = [
            { nombre: "Licencia Pro" },
            { nombre: "Licencia A" },
            { nombre: "Licencia B" },
        ];
        for (const lic of licencias) {
            await ctx.runMutation(internal.seed.insertTipoLicencia, lic);
        }
        console.log("Seeded 'tiposLicencia' table.");
    }
});


// =================================================================
// MUTATIONS TO INSERT DATA (Called by the actions)
// =================================================================
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Note: We are using internalMutations because these should only be called
// from our internal server-side actions, not directly from the client.

export const insertNacion = internalMutation({
  args: { nombre: v.string() },
  handler: async ({ db }, args) => { await db.insert("naciones", args); },
});

export const insertTipoDocumento = internalMutation({
  args: { nombreDocumento: v.string(), codigoDocumento: v.string() },
  handler: async ({ db }, args) => { await db.insert("tiposDocumento", args); },
});

export const insertCategoriaEdad = internalMutation({
  args: { nombre: v.string(), edadMaxima: v.number() },
  handler: async ({ db }, args) => { await db.insert("categoriasEdad", args); },
});

export const insertPosicionCancha = internalMutation({
  args: { nombre: v.string(), codigo: v.string(), descripcion: v.string() },
  handler: async ({ db }, args) => { await db.insert("posicionesCancha", args); },
});

export const insertTipoLicencia = internalMutation({
  args: { nombre: v.string() },
  handler: async ({ db }, args) => { await db.insert("tiposLicencia", args); },
});

export const clearTables = internalMutation({
    handler: async ({ db }) => {
        // This is a simple example. For a large app, you'd want to be more careful.
        const tablesToClear: any[] = ["naciones", "tiposDocumento", "categoriasEdad", "posicionesCancha", "tiposLicencia"];
        for (const table of tablesToClear) {
            const records = await db.query(table).collect();
            await Promise.all(records.map(r => db.delete(r._id)));
        }
    }
})