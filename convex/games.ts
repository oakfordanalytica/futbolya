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
  v.literal("awaiting_stats"),
  v.literal("pending_review"),
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
  homeStatsSubmittedAt: v.optional(v.number()),
  awayStatsSubmittedAt: v.optional(v.number()),
  homeStatsConfirmed: v.optional(v.boolean()),
  awayStatsConfirmed: v.optional(v.boolean()),
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
      status:
        | "scheduled"
        | "awaiting_stats"
        | "pending_review"
        | "completed"
        | "cancelled";
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
      status:
        | "scheduled"
        | "awaiting_stats"
        | "pending_review"
        | "completed"
        | "cancelled";
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

const playerStatsValidator = v.object({
  _id: v.id("gamePlayerStats"),
  playerId: v.id("players"),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  isStarter: v.boolean(),
  minutes: v.optional(v.number()),
  points: v.optional(v.number()),
  fieldGoalsMade: v.optional(v.number()),
  fieldGoalsAttempted: v.optional(v.number()),
  threePointersMade: v.optional(v.number()),
  threePointersAttempted: v.optional(v.number()),
  freeThrowsMade: v.optional(v.number()),
  freeThrowsAttempted: v.optional(v.number()),
  offensiveRebounds: v.optional(v.number()),
  defensiveRebounds: v.optional(v.number()),
  assists: v.optional(v.number()),
  steals: v.optional(v.number()),
  blocks: v.optional(v.number()),
  turnovers: v.optional(v.number()),
  personalFouls: v.optional(v.number()),
  plusMinus: v.optional(v.number()),
});

/**
 * Get player stats for a game.
 */
export const getGamePlayerStats = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeStats: v.array(playerStatsValidator),
    awayStats: v.array(playerStatsValidator),
  }),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return { homeStats: [], awayStats: [] };
    }

    const allStats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Batch fetch players
    const playerIds = [...new Set(allStats.map((s) => s.playerId))];
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const playerMap = new Map(players.filter(Boolean).map((p) => [p!._id, p!]));

    // Get photo URLs
    const photoUrls = new Map<string, string>();
    for (const player of players.filter(Boolean)) {
      if (player!.photoStorageId) {
        const url = await ctx.storage.getUrl(player!.photoStorageId);
        if (url) {
          photoUrls.set(player!._id, url);
        }
      }
    }

    const mapStats = (stats: typeof allStats) =>
      stats.map((s) => {
        const player = playerMap.get(s.playerId);
        return {
          _id: s._id,
          playerId: s.playerId,
          playerName: player
            ? `${player.firstName} ${player.lastName}`
            : "Unknown",
          jerseyNumber: player?.jerseyNumber,
          photoUrl: photoUrls.get(s.playerId),
          clubId: s.clubId,
          isStarter: s.isStarter,
          minutes: s.minutes,
          points: s.points,
          fieldGoalsMade: s.fieldGoalsMade,
          fieldGoalsAttempted: s.fieldGoalsAttempted,
          threePointersMade: s.threePointersMade,
          threePointersAttempted: s.threePointersAttempted,
          freeThrowsMade: s.freeThrowsMade,
          freeThrowsAttempted: s.freeThrowsAttempted,
          offensiveRebounds: s.offensiveRebounds,
          defensiveRebounds: s.defensiveRebounds,
          assists: s.assists,
          steals: s.steals,
          blocks: s.blocks,
          turnovers: s.turnovers,
          personalFouls: s.personalFouls,
          plusMinus: s.plusMinus,
        };
      });

    const homeStats = mapStats(
      allStats.filter((s) => s.clubId === game.homeClubId),
    );
    const awayStats = mapStats(
      allStats.filter((s) => s.clubId === game.awayClubId),
    );

    return { homeStats, awayStats };
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
      homeStatsSubmittedAt: game.homeStatsSubmittedAt,
      awayStatsSubmittedAt: game.awayStatsSubmittedAt,
      homeStatsConfirmed: game.homeStatsConfirmed,
      awayStatsConfirmed: game.awayStatsConfirmed,
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

// ============================================================================
// STATS SUBMISSION
// ============================================================================

const playerStatInput = v.object({
  playerId: v.id("players"),
  isStarter: v.boolean(),
  minutes: v.optional(v.number()),
  points: v.optional(v.number()),
  fieldGoalsMade: v.optional(v.number()),
  fieldGoalsAttempted: v.optional(v.number()),
  threePointersMade: v.optional(v.number()),
  threePointersAttempted: v.optional(v.number()),
  freeThrowsMade: v.optional(v.number()),
  freeThrowsAttempted: v.optional(v.number()),
  offensiveRebounds: v.optional(v.number()),
  defensiveRebounds: v.optional(v.number()),
  assists: v.optional(v.number()),
  steals: v.optional(v.number()),
  blocks: v.optional(v.number()),
  turnovers: v.optional(v.number()),
  personalFouls: v.optional(v.number()),
  plusMinus: v.optional(v.number()),
});

/**
 * Submit team stats for a game.
 * Called by a team's staff after the game starts.
 */
export const submitTeamStats = mutation({
  args: {
    gameId: v.id("games"),
    clubId: v.id("clubs"),
    playerStats: v.array(playerStatInput),
    teamScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the club is part of this game
    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    // Check if user has permission (is staff of the club)
    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to submit stats");
    }

    // Check game status - must be scheduled or awaiting_stats
    if (game.status !== "scheduled" && game.status !== "awaiting_stats") {
      throw new Error(
        "Stats can only be submitted when game is scheduled or awaiting stats",
      );
    }

    // Check if game time has passed (allow submission)
    const gameDateTime = new Date(`${game.date}T${game.startTime}`);
    if (new Date() < gameDateTime) {
      throw new Error("Cannot submit stats before game start time");
    }

    // Check if this team already submitted
    if (isHomeTeam && game.homeStatsSubmittedAt) {
      throw new Error("Home team stats already submitted");
    }
    if (isAwayTeam && game.awayStatsSubmittedAt) {
      throw new Error("Away team stats already submitted");
    }

    // Verify all players belong to this club
    for (const stat of args.playerStats) {
      const player = await ctx.db.get(stat.playerId);
      if (!player || player.clubId !== args.clubId) {
        throw new Error(`Player ${stat.playerId} does not belong to this club`);
      }
    }

    // Delete any existing stats for this team in this game (shouldn't happen but safety)
    const existingStats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGameAndClub", (q) =>
        q.eq("gameId", args.gameId).eq("clubId", args.clubId),
      )
      .collect();
    for (const stat of existingStats) {
      await ctx.db.delete(stat._id);
    }

    // Insert player stats
    for (const stat of args.playerStats) {
      await ctx.db.insert("gamePlayerStats", {
        gameId: args.gameId,
        playerId: stat.playerId,
        clubId: args.clubId,
        isStarter: stat.isStarter,
        minutes: stat.minutes,
        points: stat.points,
        fieldGoalsMade: stat.fieldGoalsMade,
        fieldGoalsAttempted: stat.fieldGoalsAttempted,
        threePointersMade: stat.threePointersMade,
        threePointersAttempted: stat.threePointersAttempted,
        freeThrowsMade: stat.freeThrowsMade,
        freeThrowsAttempted: stat.freeThrowsAttempted,
        offensiveRebounds: stat.offensiveRebounds,
        defensiveRebounds: stat.defensiveRebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        personalFouls: stat.personalFouls,
        plusMinus: stat.plusMinus,
      });
    }

    // Update game with submission timestamp and score
    const now = Date.now();
    const updates: Record<string, unknown> = {};

    if (isHomeTeam) {
      updates.homeStatsSubmittedAt = now;
      updates.homeScore = args.teamScore;
    } else {
      updates.awayStatsSubmittedAt = now;
      updates.awayScore = args.teamScore;
    }

    // Update status based on submissions
    const homeSubmitted = isHomeTeam ? true : !!game.homeStatsSubmittedAt;
    const awaySubmitted = isAwayTeam ? true : !!game.awayStatsSubmittedAt;

    if (homeSubmitted && awaySubmitted) {
      updates.status = "pending_review";
    } else {
      updates.status = "awaiting_stats";
    }

    await ctx.db.patch(args.gameId, updates);

    return null;
  },
});

/**
 * Confirm the opponent's stats.
 * Called after reviewing the other team's submitted stats.
 */
export const confirmOpponentStats = mutation({
  args: {
    gameId: v.id("games"),
    clubId: v.id("clubs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the club is part of this game
    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    // Check if user has permission
    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to confirm stats");
    }

    // Must be in pending_review status
    if (game.status !== "pending_review") {
      throw new Error("Game must be in pending review status to confirm stats");
    }

    // Update confirmation
    const updates: Record<string, unknown> = {};

    if (isHomeTeam) {
      updates.homeStatsConfirmed = true;
    } else {
      updates.awayStatsConfirmed = true;
    }

    // Check if both teams have confirmed
    const homeConfirmed = isHomeTeam ? true : !!game.homeStatsConfirmed;
    const awayConfirmed = isAwayTeam ? true : !!game.awayStatsConfirmed;

    if (homeConfirmed && awayConfirmed) {
      updates.status = "completed";
    }

    await ctx.db.patch(args.gameId, updates);

    return null;
  },
});

/**
 * Force complete a game (admin only).
 */
export const forceComplete = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user.isSuperAdmin) {
      // Check if user is org admin
      const game = await ctx.db.get(args.gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      const org = await ctx.db.get(game.organizationId);
      if (!org) {
        throw new Error("Organization not found");
      }

      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("byUserAndOrg", (q) =>
          q.eq("userId", user._id).eq("organizationId", org._id),
        )
        .unique();

      if (
        !membership ||
        (membership.role !== "admin" && membership.role !== "superadmin")
      ) {
        throw new Error("Admin access required");
      }
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      status: "completed",
      homeStatsConfirmed: true,
      awayStatsConfirmed: true,
    });

    return null;
  },
});
