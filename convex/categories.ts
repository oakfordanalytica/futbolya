import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

// ============================================================================
// VALIDATORS
// ============================================================================

const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed")
);

const categoryStatus = v.union(v.literal("active"), v.literal("inactive"));

const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  clubId: v.id("clubs"),
  name: v.string(),
  ageGroup: v.string(),
  gender: gender,
  status: categoryStatus,
});

const categoryWithPlayerCountValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  name: v.string(),
  ageGroup: v.string(),
  gender: gender,
  status: categoryStatus,
  playerCount: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List categories by club slug.
 */
export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(categoryValidator),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    return await ctx.db
      .query("categories")
      .withIndex("byClub", (q) => q.eq("clubId", club._id))
      .collect();
  },
});

/**
 * List categories by club slug with player count.
 */
export const listByClubSlugWithPlayerCount = query({
  args: { clubSlug: v.string() },
  returns: v.array(categoryWithPlayerCountValidator),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("byClub", (q) => q.eq("clubId", club._id))
      .collect();

    const result: Array<{
      _id: typeof categories[0]["_id"];
      _creationTime: number;
      name: string;
      ageGroup: string;
      gender: "male" | "female" | "mixed";
      status: "active" | "inactive";
      playerCount: number;
    }> = [];

    for (const category of categories) {
      const players = await ctx.db
        .query("players")
        .withIndex("byCategory", (q) => q.eq("categoryId", category._id))
        .collect();

      result.push({
        _id: category._id,
        _creationTime: category._creationTime,
        name: category.name,
        ageGroup: category.ageGroup,
        gender: category.gender,
        status: category.status,
        playerCount: players.length,
      });
    }

    return result;
  },
});

/**
 * Get a category by ID.
 */
export const getById = query({
  args: { categoryId: v.id("categories") },
  returns: v.union(categoryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new category.
 */
export const create = mutation({
  args: {
    clubSlug: v.string(),
    name: v.string(),
    ageGroup: v.string(),
    gender: gender,
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      throw new Error("Club not found");
    }

    // Check for duplicate name within club
    const existing = await ctx.db
      .query("categories")
      .withIndex("byClubAndName", (q) =>
        q.eq("clubId", club._id).eq("name", args.name)
      )
      .unique();

    if (existing) {
      throw new Error(`Category "${args.name}" already exists in this club`);
    }

    return await ctx.db.insert("categories", {
      clubId: club._id,
      name: args.name,
      ageGroup: args.ageGroup,
      gender: args.gender,
      status: "active",
    });
  },
});

/**
 * Update a category.
 */
export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    ageGroup: v.optional(v.string()),
    gender: v.optional(gender),
    status: v.optional(categoryStatus),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const { categoryId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // Check name uniqueness if changing
    if (filteredUpdates.name && typeof filteredUpdates.name === "string") {
      const existing = await ctx.db
        .query("categories")
        .withIndex("byClubAndName", (q) =>
          q.eq("clubId", category.clubId).eq("name", filteredUpdates.name as string)
        )
        .unique();

      if (existing && existing._id !== categoryId) {
        throw new Error(`Category "${filteredUpdates.name}" already exists`);
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(categoryId, filteredUpdates);
    }

    return null;
  },
});

/**
 * Delete a category.
 * Also deletes all players in the category.
 */
export const remove = mutation({
  args: { categoryId: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Delete all players in this category
    const players = await ctx.db
      .query("players")
      .withIndex("byCategory", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // Delete staff assigned to this category
    const staff = await ctx.db
      .query("staff")
      .withIndex("byCategory", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    for (const s of staff) {
      await ctx.db.delete(s._id);
    }

    // Delete the category
    await ctx.db.delete(args.categoryId);

    return null;
  },
});
