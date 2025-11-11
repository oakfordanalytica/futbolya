// convex/auth.ts
import { query } from "./_generated/server";
import { FutbolYaRole } from "../lib/role-utils";

/**
 * Gets the currently authenticated user's identity from Clerk, including their role.
 */
export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const role = (identity.publicMetadata as any)?.futbolYaRole as FutbolYaRole;

    return {
        clerkId: identity.subject,
        email: identity.email,
        role: role,
    };
  },
});