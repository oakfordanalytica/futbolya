import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List divisions by league slug
 */
export const listByLeagueSlug = query({
  args: { leagueSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("divisions"),
      _creationTime: v.number(),
      name: v.string(),
      displayName: v.string(),
      description: v.optional(v.string()),
      level: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Find league
    const league = await ctx.db
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", args.leagueSlug))
      .unique();

    if (!league) {
      return [];
    }

    // Get divisions for this league ordered by level
    const divisions = await ctx.db
      .query("divisions")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", league._id))
      .order("asc")
      .collect();

    return divisions;
  },
});

/**
 * Get division by ID
 */
export const getById = query({
  args: { divisionId: v.id("divisions") },
  returns: v.union(
    v.object({
      _id: v.id("divisions"),
      _creationTime: v.number(),
      name: v.string(),
      displayName: v.string(),
      description: v.optional(v.string()),
      level: v.number(),
      leagueId: v.id("leagues"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.divisionId);
  },
});

/**
 * List all divisions for a league by league ID
 */
export const listByLeagueId = query({
  args: { leagueId: v.id("leagues") },
  returns: v.array(
    v.object({
      _id: v.id("divisions"),
      _creationTime: v.number(),
      name: v.string(),
      displayName: v.string(),
      description: v.optional(v.string()),
      level: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const divisions = await ctx.db
      .query("divisions")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .order("asc")
      .collect();

    return divisions;
  },
});