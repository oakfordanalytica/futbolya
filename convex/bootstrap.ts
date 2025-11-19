import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const bootstrapSystem = mutation({
  args: {
    userEmail: v.string(),
    leagueName: v.string(),
    leagueSlug: v.string(),
    leagueCountry: v.optional(v.string()),
  },
  returns: v.object({
    profileId: v.id("profiles"),
    leagueId: v.id("leagues"),
  }),
  handler: async (ctx, args) => {
    // 1. Find the user profile (Must sign up via Clerk first)
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .unique();

    if (!profile) {
      throw new Error("Profile not found. Sign up via Clerk first.");
    }

    // 2. Create the first league
    const leagueId = await ctx.db.insert("leagues", {
      name: args.leagueName,
      slug: args.leagueSlug,
      country: args.leagueCountry ?? "Colombia",
      status: "active",
    });

    // 3. Assign SuperAdmin role to SYSTEM scope
    // We check if assignment exists to avoid duplicates
    const existingRole = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_role", (q) => 
        q.eq("profileId", profile._id).eq("role", "SuperAdmin")
      )
      .first();

    if (!existingRole) {
      await ctx.db.insert("roleAssignments", {
        profileId: profile._id,
        role: "SuperAdmin",
        organizationId: "global", // Hardcoded for system scope
        organizationType: "system",
        assignedAt: Date.now(),
      });
    }

    return { profileId: profile._id, leagueId };
  },
});