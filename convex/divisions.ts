import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

/**
 * Create a new division
 */
export const create = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    level: v.number(),
  },
  returns: v.id("divisions"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    // Check for duplicate name within league
    const existing = await ctx.db
      .query("divisions")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();

    if (existing) {
      throw new Error("A division with this name already exists in this league");
    }

    return await ctx.db.insert("divisions", {
      leagueId: args.leagueId,
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      level: args.level,
    });
  },
});

/**
 * Update a division
 */
export const update = mutation({
  args: {
    divisionId: v.id("divisions"),
    displayName: v.string(),
    description: v.optional(v.string()),
    level: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const division = await ctx.db.get(args.divisionId);
    if (!division) {
      throw new Error("Division not found");
    }

    await ctx.db.patch(args.divisionId, {
      displayName: args.displayName,
      description: args.description,
      level: args.level,
    });

    return null;
  },
});

/**
 * Delete a division
 */
export const deleteDivision = mutation({
  args: { divisionId: v.id("divisions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const division = await ctx.db.get(args.divisionId);
    if (!division) {
      throw new Error("Division not found");
    }

    await ctx.db.delete(args.divisionId);
    return null;
  },
});

/**
 * List teams in a division with their club and category info
 */
export const listByDivisionId = query({
  args: { divisionId: v.id("divisions") },
  returns: v.array(
    v.object({
      _id: v.id("divisionEntries"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      categoryName: v.string(),
      clubId: v.id("clubs"),
      clubName: v.string(),
      clubLogoUrl: v.optional(v.string()),
      registeredAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("divisionEntries")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", args.divisionId))
      .collect();

    const enrichedEntries: Array<{
      _id: Id<"divisionEntries">;
      _creationTime: number;
      categoryId: Id<"categories">;
      categoryName: string;
      clubId: Id<"clubs">;
      clubName: string;
      clubLogoUrl: string | undefined;
      registeredAt: number;
    }> = [];

    for (const entry of entries) {
      const category = await ctx.db.get(entry.categoryId);
      if (!category) continue;

      const club = await ctx.db.get(category.clubId);
      if (!club) continue;

      enrichedEntries.push({
        _id: entry._id,
        _creationTime: entry._creationTime,
        categoryId: entry.categoryId,
        categoryName: category.name,
        clubId: category.clubId,
        clubName: club.name,
        clubLogoUrl: club.logoUrl,
        registeredAt: entry.registeredAt,
      });
    }

    return enrichedEntries;
  },
});

/**
 * Get division statistics
 */
export const getStatistics = query({
  args: { divisionId: v.id("divisions") },
  returns: v.object({
    teamsCount: v.number(),
    matchesCount: v.number(),
    tournamentsCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const division = await ctx.db.get(args.divisionId);
    if (!division) {
      throw new Error("Division not found");
    }

    // Count teams (division entries)
    const entries = await ctx.db
      .query("divisionEntries")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", args.divisionId))
      .collect();

    // Count tournaments that use this division
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", division.leagueId))
      .filter((q) => q.eq(q.field("enableDivisions"), true))
      .collect();

    // For now, matches would be counted differently based on your match schema
    // This is a placeholder
    const matchesCount = 0;

    return {
      teamsCount: entries.length,
      matchesCount,
      tournamentsCount: tournaments.length,
    };
  },
});