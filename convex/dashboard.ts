import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get SuperAdmin global dashboard stats
 */
export const getSuperAdminStats = query({
  args: {},
  returns: v.object({
    totalLeagues: v.number(),
    totalClubs: v.number(),
    totalUsers: v.number(),
    totalPlayers: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Check if user is SuperAdmin

    const leagues = await ctx.db.query("leagues").collect();
    const clubs = await ctx.db.query("clubs").collect();
    const profiles = await ctx.db.query("profiles").collect();
    const players = await ctx.db.query("players").collect();

    return {
      totalLeagues: leagues.length,
      totalClubs: clubs.length,
      totalUsers: profiles.length,
      totalPlayers: players.length,
    };
  },
});

/**
 * Get organization-level admin dashboard stats
 */
export const getOrgAdminStats = query({
  args: {
    orgSlug: v.string(),
    orgType: v.union(v.literal("league"), v.literal("club")),
  },
  returns: v.object({
    totalClubs: v.optional(v.number()),
    totalCategories: v.number(),
    totalPlayers: v.number(),
    totalStaff: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Check if user has admin access to this org

    if (args.orgType === "league") {
      const league = await ctx.db
        .query("leagues")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();

      if (!league) {
        throw new Error("League not found");
      }

      const clubs = await ctx.db
        .query("clubs")
        .withIndex("by_leagueId", (q) => q.eq("leagueId", league._id))
        .collect();

      let totalCategories = 0;
      let totalPlayers = 0;

      for (const club of clubs) {
        const categories = await ctx.db
          .query("categories")
          .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
          .collect();
        totalCategories += categories.length;

        for (const category of categories) {
          const players = await ctx.db
            .query("players")
            .withIndex("by_currentCategoryId", (q) =>
              q.eq("currentCategoryId", category._id)
            )
            .collect();
          totalPlayers += players.length;
        }
      }

      return {
        totalClubs: clubs.length,
        totalCategories,
        totalPlayers,
        totalStaff: 0, // TODO: Calculate from roleAssignments
      };
    } else {
      // Club stats
      const club = await ctx.db
        .query("clubs")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();

      if (!club) {
        throw new Error("Club not found");
      }

      const categories = await ctx.db
        .query("categories")
        .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
        .collect();

      let totalPlayers = 0;
      for (const category of categories) {
        const players = await ctx.db
          .query("players")
          .withIndex("by_currentCategoryId", (q) =>
            q.eq("currentCategoryId", category._id)
          )
          .collect();
        totalPlayers += players.length;
      }

      return {
        totalCategories: categories.length,
        totalPlayers,
        totalStaff: 0, // TODO: Calculate from roleAssignments
      };
    }
  },
});