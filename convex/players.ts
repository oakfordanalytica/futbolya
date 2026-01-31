import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

// ============================================================================
// VALIDATORS
// ============================================================================

const playerStatus = v.union(v.literal("active"), v.literal("inactive"));

const basketballPosition = v.union(
  v.literal("point_guard"),
  v.literal("shooting_guard"),
  v.literal("small_forward"),
  v.literal("power_forward"),
  v.literal("center"),
);

const basketballPlayerValidator = v.object({
  _id: v.id("players"),
  _creationTime: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  photoUrl: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  jerseyNumber: v.optional(v.number()),
  position: v.optional(basketballPosition),
  status: playerStatus,
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  categoryId: v.id("categories"),
  categoryName: v.optional(v.string()),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List basketball players by club slug.
 * Returns data formatted for the players table/grid.
 */
export const listBasketballPlayersByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(basketballPlayerValidator),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .withIndex("byClub", (q) => q.eq("clubId", club._id))
      .collect();

    // Batch fetch categories
    const categoryIds = [...new Set(players.map((p) => p.categoryId))];
    const categories = await Promise.all(
      categoryIds.map((id) => ctx.db.get(id)),
    );
    const categoryMap = new Map(
      categories.filter(Boolean).map((c) => [c!._id, c!]),
    );

    // Build result with photo URLs
    const result = await Promise.all(
      players.map(async (player) => {
        const category = categoryMap.get(player.categoryId);
        const photoUrl = player.photoStorageId
          ? await ctx.storage.getUrl(player.photoStorageId)
          : undefined;

        return {
          _id: player._id,
          _creationTime: player._creationTime,
          firstName: player.firstName,
          lastName: player.lastName,
          photoUrl: photoUrl ?? undefined,
          dateOfBirth: player.dateOfBirth,
          jerseyNumber: player.jerseyNumber,
          position: player.position,
          status: player.status,
          height: player.height,
          weight: player.weight,
          categoryId: player.categoryId,
          categoryName: category?.name,
        };
      }),
    );

    return result;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Generate upload URL for player photo.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a new player.
 */
export const createPlayer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    dateOfBirth: v.optional(v.string()),
    categoryId: v.id("categories"),
    sportType: v.union(v.literal("basketball"), v.literal("soccer")),
    jerseyNumber: v.optional(v.number()),
    position: v.optional(basketballPosition),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
  },
  returns: v.id("players"),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    // Get category to find the club
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const playerId = await ctx.db.insert("players", {
      firstName: args.firstName,
      lastName: args.lastName,
      photoStorageId: args.photoStorageId,
      dateOfBirth: args.dateOfBirth,
      clubId: category.clubId,
      categoryId: args.categoryId,
      sportType: args.sportType,
      jerseyNumber: args.jerseyNumber,
      position: args.position,
      height: args.height,
      weight: args.weight,
      status: "active",
    });

    return playerId;
  },
});

/**
 * Delete a player.
 */
export const deletePlayer = mutation({
  args: { playerId: v.id("players") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Delete photo from storage if exists
    if (player.photoStorageId) {
      await ctx.storage.delete(player.photoStorageId);
    }

    await ctx.db.delete(args.playerId);

    return null;
  },
});

/**
 * Update a player.
 */
export const updatePlayer = mutation({
  args: {
    playerId: v.id("players"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    dateOfBirth: v.optional(v.string()),
    jerseyNumber: v.optional(v.number()),
    position: v.optional(basketballPosition),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    status: v.optional(playerStatus),
    categoryId: v.optional(v.id("categories")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const { playerId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // If updating photo, delete old one
    if (
      filteredUpdates.photoStorageId &&
      player.photoStorageId &&
      filteredUpdates.photoStorageId !== player.photoStorageId
    ) {
      await ctx.storage.delete(player.photoStorageId);
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(playerId, filteredUpdates);
    }

    return null;
  },
});
