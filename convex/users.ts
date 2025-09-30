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
    // For now, every new user also creates a 'persona' record.
    // We'll also default them to the 'jugador' role for now.
    // In a real app, you'd have a more complex registration flow
    // where a user selects their role or is invited.

    // TODO: Replace with a more robust lookup for default document/nation IDs
    const defaultTipoDoc = (await ctx.db.query("tiposDocumento").first())?._id;
    if (!defaultTipoDoc) {
        throw new Error("Default TipoDocumento not found. Please seed the database.");
    }


    const personaId = await ctx.db.insert("personas", {
      nombrePersona: args.firstName,
      apellidoPersona: args.lastName,
      fechaNacimiento: "1900-01-01", // Placeholder
      numeroDocumento: "00000000",   // Placeholder
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