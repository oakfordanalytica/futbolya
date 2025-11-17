import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List categories by organization slug (league or club)
 */
export const listByOrgSlug = query({
  args: { orgSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      ageGroup: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      technicalDirectorId: v.optional(v.id("profiles")),
      technicalDirectorName: v.optional(v.string()),
      playerCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Try to find as club by slug
    const club = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!club) return [];

    // Get categories for this club
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
      .collect();

    // Enrich with related data
    const enrichedCategories: Array<{
      _id: Id<"categories">;
      _creationTime: number;
      name: string;
      ageGroup: string;
      gender: "male" | "female" | "mixed";
      status: "active" | "inactive";
      technicalDirectorId: Id<"profiles"> | undefined;
      technicalDirectorName: string | undefined;
      playerCount: number;
    }> = await Promise.all(
      categories.map(async (category) => {
        let technicalDirectorName: string | undefined;
        if (category.technicalDirectorId) {
          const td = await ctx.db.get(category.technicalDirectorId);
          technicalDirectorName = td?.displayName || td?.email;
        }

        // Count players in this category (using currentCategoryId)
        const players = await ctx.db
          .query("players")
          .withIndex("by_currentCategoryId", (q) => 
            q.eq("currentCategoryId", category._id)
          )
          .collect();

        return {
          _id: category._id,
          _creationTime: category._creationTime,
          name: category.name,
          ageGroup: category.ageGroup,
          gender: category.gender,
          status: category.status,
          technicalDirectorId: category.technicalDirectorId,
          technicalDirectorName,
          playerCount: players.length,
        };
      })
    );

    return enrichedCategories;
  },
});

/**
 * Get category by ID
 */
export const getById = query({
  args: { categoryId: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      ageGroup: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      clubId: v.id("clubs"),
      technicalDirectorId: v.optional(v.id("profiles")),
      assistantCoachIds: v.optional(v.array(v.id("profiles"))),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

/**
 * List categories by club ID
 */
export const listByClubId = query({
  args: { clubId: v.id("clubs") },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      ageGroup: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      technicalDirectorId: v.optional(v.id("profiles")),
      technicalDirectorName: v.optional(v.string()),
      playerCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", args.clubId))
      .collect();

    const enrichedCategories: Array<{
      _id: Id<"categories">;
      _creationTime: number;
      name: string;
      ageGroup: string;
      gender: "male" | "female" | "mixed";
      status: "active" | "inactive";
      technicalDirectorId: Id<"profiles"> | undefined;
      technicalDirectorName: string | undefined;
      playerCount: number;
    }> = await Promise.all(
      categories.map(async (category) => {
        let technicalDirectorName: string | undefined;
        if (category.technicalDirectorId) {
          const td = await ctx.db.get(category.technicalDirectorId);
          technicalDirectorName = td?.displayName || td?.email;
        }

        // Count players in this category (using currentCategoryId)
        const players = await ctx.db
          .query("players")
          .withIndex("by_currentCategoryId", (q) => 
            q.eq("currentCategoryId", category._id)
          )
          .collect();

        return {
          _id: category._id,
          _creationTime: category._creationTime,
          name: category.name,
          ageGroup: category.ageGroup,
          gender: category.gender,
          status: category.status,
          technicalDirectorId: category.technicalDirectorId,
          technicalDirectorName,
          playerCount: players.length,
        };
      })
    );

    return enrichedCategories;
  },
});