import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { requireClubAccess, requireClubAccessBySlug } from "./lib/permissions";

// ============================================================================
// VALIDATORS
// ============================================================================

const playerStatus = v.union(v.literal("active"), v.literal("inactive"));
const playerViewerAccessLevel = v.union(
  v.literal("superadmin"),
  v.literal("admin"),
  v.literal("coach"),
);

const basketballPlayerValidator = v.object({
  _id: v.id("players"),
  _creationTime: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  photoUrl: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  jerseyNumber: v.optional(v.number()),
  position: v.optional(v.string()),
  status: playerStatus,
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  bioTitle: v.optional(v.string()),
  bioContent: v.optional(v.string()),
  country: v.optional(v.string()),
  categoryId: v.id("categories"),
  categoryName: v.optional(v.string()),
});

const basketballPlayerDetailValidator = v.object({
  _id: v.id("players"),
  _creationTime: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  photoUrl: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  jerseyNumber: v.optional(v.number()),
  position: v.optional(v.string()),
  status: playerStatus,
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  bioTitle: v.optional(v.string()),
  bioContent: v.optional(v.string()),
  country: v.optional(v.string()),
  categoryId: v.id("categories"),
  categoryName: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubSlug: v.string(),
  clubLogoUrl: v.optional(v.string()),
  clubPrimaryColor: v.optional(v.string()),
  gamesPlayed: v.number(),
  pointsPerGame: v.number(),
  reboundsPerGame: v.number(),
  assistsPerGame: v.number(),
  viewerAccessLevel: playerViewerAccessLevel,
});

function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

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
    const { club } = await requireClubAccessBySlug(ctx, args.clubSlug);

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
          country: player.country,
          categoryId: player.categoryId,
          categoryName: category?.name,
        };
      }),
    );

    return result;
  },
});

/**
 * Get basketball player details by player ID within a specific club slug.
 * Returns null when player does not exist or does not belong to the provided club.
 */
export const getBasketballPlayerDetailByClubSlug = query({
  args: {
    clubSlug: v.string(),
    playerId: v.id("players"),
  },
  returns: v.union(basketballPlayerDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const { club, accessLevel } = await requireClubAccessBySlug(
      ctx,
      args.clubSlug,
    );

    const player = await ctx.db.get(args.playerId);
    if (
      !player ||
      player.clubId !== club._id ||
      player.sportType !== "basketball"
    ) {
      return null;
    }

    const category = await ctx.db.get(player.categoryId);
    const playerStats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byPlayer", (q) => q.eq("playerId", player._id))
      .collect();

    const linkedGames = await Promise.all(
      playerStats.map((stat) => ctx.db.get(stat.gameId)),
    );

    let gamesPlayed = 0;
    let points = 0;
    let rebounds = 0;
    let assists = 0;

    for (let index = 0; index < playerStats.length; index += 1) {
      const stat = playerStats[index];
      const game = linkedGames[index];

      if (
        !game ||
        game.organizationId !== club.organizationId ||
        game.status !== "completed" ||
        typeof game.homeScore !== "number" ||
        typeof game.awayScore !== "number"
      ) {
        continue;
      }

      gamesPlayed += 1;
      points += stat.points ?? 0;
      rebounds += (stat.offensiveRebounds ?? 0) + (stat.defensiveRebounds ?? 0);
      assists += stat.assists ?? 0;
    }

    const pointsPerGame =
      gamesPlayed > 0 ? roundToSingleDecimal(points / gamesPlayed) : 0;
    const reboundsPerGame =
      gamesPlayed > 0 ? roundToSingleDecimal(rebounds / gamesPlayed) : 0;
    const assistsPerGame =
      gamesPlayed > 0 ? roundToSingleDecimal(assists / gamesPlayed) : 0;

    const photoUrl = player.photoStorageId
      ? await ctx.storage.getUrl(player.photoStorageId)
      : undefined;
    const clubLogoUrl = club.logoStorageId
      ? await ctx.storage.getUrl(club.logoStorageId)
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
      bioTitle: player.bioTitle,
      bioContent: player.bioContent,
      country: player.country,
      categoryId: player.categoryId,
      categoryName: category?.name,
      clubId: club._id,
      clubName: club.name,
      clubSlug: club.slug,
      clubLogoUrl: clubLogoUrl ?? undefined,
      clubPrimaryColor: club.colors?.[0],
      gamesPlayed,
      pointsPerGame,
      reboundsPerGame,
      assistsPerGame,
      viewerAccessLevel: accessLevel,
    };
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
    position: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    country: v.optional(v.string()),
  },
  returns: v.id("players"),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    // Get category to find the club
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await requireClubAccess(ctx, category.clubId);

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
      country: args.country,
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

    await requireClubAccess(ctx, player.clubId);

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
    position: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    country: v.optional(v.string()),
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

    await requireClubAccess(ctx, player.clubId);

    const { playerId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (args.categoryId) {
      const targetCategory = await ctx.db.get(args.categoryId);
      if (!targetCategory) {
        throw new Error("Category not found");
      }

      await requireClubAccess(ctx, targetCategory.clubId);
      filteredUpdates.clubId = targetCategory.clubId;
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

/**
 * Update a player's bio fields.
 * Available for users with coach/admin access to the player's club.
 */
export const updatePlayerBio = mutation({
  args: {
    playerId: v.id("players"),
    bioTitle: v.string(),
    bioContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await requireClubAccess(ctx, player.clubId);

    await ctx.db.patch(args.playerId, {
      bioTitle: args.bioTitle.trim(),
      bioContent: args.bioContent.trim(),
    });

    return null;
  },
});
