import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time setup: Create the first SuperAdmin and initial league.
 * Run this manually after your first user signs up via Clerk.
 * 
 * Usage in Convex Dashboard:
 * api.setup.bootstrapSystem({
 *   userEmail: "your-email@example.com",
 *   leagueName: "Liga del Valle",
 *   leagueSlug: "liga-del-valle"
 * })
 */
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
    // 1. Find the user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .unique();

    if (!profile) {
      throw new Error(
        "Profile not found. User must sign up via Clerk first, then run this script."
      );
    }

    // 2. Check if user already has SuperAdmin role
    const existingRole = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .filter((q) => q.eq(q.field("role"), "SuperAdmin"))
      .first();

    if (existingRole) {
      throw new Error("User is already a SuperAdmin");
    }

    // 3. Check if league slug is available
    const existingLeague = await ctx.db
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", args.leagueSlug))
      .unique();

    if (existingLeague) {
      throw new Error("League slug already exists");
    }

    // 4. Create the first league
    const leagueId = await ctx.db.insert("leagues", {
      name: args.leagueName,
      slug: args.leagueSlug,
      country: args.leagueCountry ?? "Colombia",
      status: "active",
    });

    // 5. Assign SuperAdmin role
    await ctx.db.insert("roleAssignments", {
      profileId: profile._id,
      role: "SuperAdmin",
      organizationId: leagueId,
      organizationType: "league",
      assignedAt: Date.now(),
    });

    console.log("✅ System bootstrapped successfully!");
    console.log(`SuperAdmin: ${profile.email}`);
    console.log(`League: ${args.leagueName} (${args.leagueSlug})`);

    return { profileId: profile._id, leagueId };
  },
});