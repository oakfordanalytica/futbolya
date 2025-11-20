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
    activeLeagues: v.number(),
    affiliatedClubs: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Verify SuperAdmin Role
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const superAdminRole = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_role", (q) => 
        q.eq("profileId", profile._id).eq("role", "SuperAdmin")
      )
      .first();

    if (!superAdminRole) {
      throw new Error("Unauthorized: SuperAdmin access required");
    }

    // 2. Fetch Counts
    // Note: For large datasets, we would use a counter table. 
    // For now, collecting is acceptable.
    const leagues = await ctx.db.query("leagues").collect();
    const clubs = await ctx.db.query("clubs").collect();
    const profiles = await ctx.db.query("profiles").collect();
    const players = await ctx.db.query("players").collect();

    return {
      totalLeagues: leagues.length,
      activeLeagues: leagues.filter(l => l.status === "active").length,
      totalClubs: clubs.length,
      affiliatedClubs: clubs.filter(c => c.status === "affiliated").length,
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

    // TODO: Check if user has admin access to this org (Middleware handles basic auth, but role check here is good practice)

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

      // Calculate League Staff (LeagueAdmins)
      const staffAssignments = await ctx.db
        .query("roleAssignments")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", league._id))
        .collect();
      
      // Filter for LeagueAdmin role only (exclude Referees if they are assigned to league org)
      const leagueAdmins = staffAssignments.filter(a => a.role === "LeagueAdmin");

      return {
        totalClubs: clubs.length,
        totalCategories,
        totalPlayers,
        totalStaff: leagueAdmins.length,
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

      // Calculate Club Staff (Admins + Technical Directors)
      const staffAssignments = await ctx.db
        .query("roleAssignments")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", club._id))
        .collect();

      // Filter for relevant roles
      const clubStaff = staffAssignments.filter(a => 
        a.role === "ClubAdmin" || a.role === "TechnicalDirector"
      );

      return {
        totalCategories: categories.length,
        totalPlayers,
        totalStaff: clubStaff.length,
      };
    }
  },
});