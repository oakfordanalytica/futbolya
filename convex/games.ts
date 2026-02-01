import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";

// ============================================================================
// VALIDATORS
// ============================================================================

const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

const gameStatus = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const gameValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  homeClubId: v.id("clubs"),
  awayClubId: v.id("clubs"),
  homeClubSlug: v.string(),
  awayClubSlug: v.string(),
  homeTeamName: v.string(),
  awayTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamLogo: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender: gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
});

const gameListItemValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  homeTeamId: v.string(),
  homeTeamName: v.string(),
  awayTeamId: v.string(),
  awayTeamName: v.string(),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender: gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List games by league (organization) slug.
 */
export const listByLeagueSlug = query({
  args: { orgSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!org) {
      return [];
    }

    const games = await ctx.db
      .query("games")
      .withIndex("byOrganization", (q) => q.eq("organizationId", org._id))
      .order("desc")
      .collect();

    // Batch fetch clubs
    const clubIds = [
      ...new Set(games.flatMap((g) => [g.homeClubId, g.awayClubId])),
    ];
    const clubs = await Promise.all(clubIds.map((id) => ctx.db.get(id)));
    const clubMap = new Map(clubs.filter(Boolean).map((c) => [c!._id, c!]));

    const result: Array<{
      _id: Id<"games">;
      _creationTime: number;
      homeTeamId: string;
      homeTeamName: string;
      awayTeamId: string;
      awayTeamName: string;
      date: string;
      startTime: string;
      category: string;
      gender: "male" | "female" | "mixed";
      locationName?: string;
      locationCoordinates?: number[];
      status: "scheduled" | "in_progress" | "completed" | "cancelled";
      homeScore?: number;
      awayScore?: number;
    }> = [];

    for (const game of games) {
      const homeClub = clubMap.get(game.homeClubId);
      const awayClub = clubMap.get(game.awayClubId);

      result.push({
        _id: game._id,
        _creationTime: game._creationTime,
        homeTeamId: game.homeClubId,
        homeTeamName: homeClub?.name ?? "Unknown",
        awayTeamId: game.awayClubId,
        awayTeamName: awayClub?.name ?? "Unknown",
        date: game.date,
        startTime: game.startTime,
        category: game.category,
        gender: game.gender,
        locationName: game.locationName,
        locationCoordinates: game.locationCoordinates,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
    }

    return result;
  },
});

/**
 * List games by club slug (where the club is either home or away team).
 */
export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    // Get games where club is home team
    const homeGames = await ctx.db
      .query("games")
      .withIndex("byHomeClub", (q) => q.eq("homeClubId", club._id))
      .collect();

    // Get games where club is away team
    const awayGames = await ctx.db
      .query("games")
      .withIndex("byAwayClub", (q) => q.eq("awayClubId", club._id))
      .collect();

    // Combine and deduplicate games
    const allGames = [...homeGames, ...awayGames];
    const uniqueGames = Array.from(
      new Map(allGames.map((g) => [g._id, g])).values(),
    );

    // Sort by date descending
    uniqueGames.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    // Batch fetch clubs
    const clubIds = [
      ...new Set(uniqueGames.flatMap((g) => [g.homeClubId, g.awayClubId])),
    ];
    const clubs = await Promise.all(clubIds.map((id) => ctx.db.get(id)));
    const clubMap = new Map(clubs.filter(Boolean).map((c) => [c!._id, c!]));

    const result: Array<{
      _id: Id<"games">;
      _creationTime: number;
      homeTeamId: string;
      homeTeamName: string;
      awayTeamId: string;
      awayTeamName: string;
      date: string;
      startTime: string;
      category: string;
      gender: "male" | "female" | "mixed";
      locationName?: string;
      locationCoordinates?: number[];
      status: "scheduled" | "in_progress" | "completed" | "cancelled";
      homeScore?: number;
      awayScore?: number;
    }> = [];

    for (const game of uniqueGames) {
      const homeClub = clubMap.get(game.homeClubId);
      const awayClub = clubMap.get(game.awayClubId);

      result.push({
        _id: game._id,
        _creationTime: game._creationTime,
        homeTeamId: game.homeClubId,
        homeTeamName: homeClub?.name ?? "Unknown",
        awayTeamId: game.awayClubId,
        awayTeamName: awayClub?.name ?? "Unknown",
        date: game.date,
        startTime: game.startTime,
        category: game.category,
        gender: game.gender,
        locationName: game.locationName,
        locationCoordinates: game.locationCoordinates,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
    }

    return result;
  },
});

/**
 * Get a game by ID with team details.
 */
export const getById = query({
  args: { gameId: v.id("games") },
  returns: v.union(gameValidator, v.null()),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);

    if (!game) {
      return null;
    }

    const homeClub = await ctx.db.get(game.homeClubId);
    const awayClub = await ctx.db.get(game.awayClubId);

    let homeTeamLogo: string | undefined;
    let awayTeamLogo: string | undefined;

    if (homeClub?.logoStorageId) {
      homeTeamLogo =
        (await ctx.storage.getUrl(homeClub.logoStorageId)) ?? undefined;
    }
    if (awayClub?.logoStorageId) {
      awayTeamLogo =
        (await ctx.storage.getUrl(awayClub.logoStorageId)) ?? undefined;
    }

    return {
      _id: game._id,
      _creationTime: game._creationTime,
      organizationId: game.organizationId,
      homeClubId: game.homeClubId,
      awayClubId: game.awayClubId,
      homeClubSlug: homeClub?.slug ?? "",
      awayClubSlug: awayClub?.slug ?? "",
      homeTeamName: homeClub?.name ?? "Unknown",
      awayTeamName: awayClub?.name ?? "Unknown",
      homeTeamLogo,
      awayTeamLogo,
      date: game.date,
      startTime: game.startTime,
      category: game.category,
      gender: game.gender,
      locationName: game.locationName,
      locationCoordinates: game.locationCoordinates,
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new game.
 */
export const create = mutation({
  args: {
    orgSlug: v.string(),
    homeClubId: v.id("clubs"),
    awayClubId: v.id("clubs"),
    date: v.string(),
    startTime: v.string(),
    category: v.string(),
    gender: gender,
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const org = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!org) {
      throw new Error("Organization not found");
    }

    // Validate clubs exist and belong to org
    const homeClub = await ctx.db.get(args.homeClubId);
    const awayClub = await ctx.db.get(args.awayClubId);

    if (!homeClub || homeClub.organizationId !== org._id) {
      throw new Error("Home club not found or doesn't belong to this league");
    }
    if (!awayClub || awayClub.organizationId !== org._id) {
      throw new Error("Away club not found or doesn't belong to this league");
    }

    if (args.homeClubId === args.awayClubId) {
      throw new Error("Home and away clubs must be different");
    }

    return await ctx.db.insert("games", {
      organizationId: org._id,
      homeClubId: args.homeClubId,
      awayClubId: args.awayClubId,
      date: args.date,
      startTime: args.startTime,
      category: args.category,
      gender: args.gender,
      locationName: args.locationName,
      locationCoordinates: args.locationCoordinates,
      status: "scheduled",
    });
  },
});

/**
 * Update game details.
 */
export const update = mutation({
  args: {
    gameId: v.id("games"),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    category: v.optional(v.string()),
    gender: v.optional(gender),
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
    status: v.optional(gameStatus),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const { gameId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(gameId, filteredUpdates);
    }

    return null;
  },
});

/**
 * Delete a game.
 */
export const remove = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Delete game player stats
    const stats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const stat of stats) {
      await ctx.db.delete(stat._id);
    }

    // Delete the game
    await ctx.db.delete(args.gameId);

    return null;
  },
});
