// convex/users.ts

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    userName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      console.log(`User with clerkId ${args.clerkId} already exists. Skipping creation.`);
      return;
    }

    const defaultTipoDoc = (await ctx.db.query("tiposDocumento").first())?._id;
    if (!defaultTipoDoc) {
        throw new Error("Default TipoDocumento not found. Please seed the database.");
    }

    const personaId = await ctx.db.insert("personas", {
      nombrePersona: args.firstName,
      apellidoPersona: args.lastName,
      fechaNacimiento: "1900-01-01",
      numeroDocumento: "00000000",
      tipoDocumentoId: defaultTipoDoc,
    });

    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      personaId: personaId,
      userName: args.userName,
    });

    // // Set the user's role in Clerk's metadata
    // // This is an API call from our backend to Clerk's backend
    // const clerkAPIKey = process.env.CLERK_SECRET_KEY;
    // if (clerkAPIKey) {
    //     await fetch(`https://api.clerk.com/v1/users/${args.clerkId}/metadata`, {
    //         method: "PATCH",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Authorization": `Bearer ${clerkAPIKey}`
    //         },
    //         body: JSON.stringify({
    //             public_metadata: {
    //                 futbolYaRole: "superadmin" // Default role
    //             }
    //         })
    //     });
    // }
  },
});