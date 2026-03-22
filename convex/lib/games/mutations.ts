import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { requireOrgAdmin } from "../../lib/permissions";
import { normalizeGameStatus } from "@/lib/games/status";
import { getTodayDateString, isIsoDateString, requireGameAdminAccess } from "./utils";

export async function createGameHandler(
  ctx: MutationCtx,
  args: {
    orgSlug: string;
    seasonId?: string;
    homeClubId: Id<"clubs">;
    awayClubId: Id<"clubs">;
    date: string;
    startTime: string;
    category: string;
    gender: "male" | "female" | "mixed";
    locationName?: string;
    locationCoordinates?: number[];
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.orgSlug);

  const [homeClub, awayClub] = await Promise.all([
    ctx.db.get(args.homeClubId),
    ctx.db.get(args.awayClubId),
  ]);

  if (!homeClub || homeClub.organizationId !== organization._id) {
    throw new Error("Home club not found or doesn't belong to this league");
  }
  if (!awayClub || awayClub.organizationId !== organization._id) {
    throw new Error("Away club not found or doesn't belong to this league");
  }
  if (homeClub.status !== "affiliated" || awayClub.status !== "affiliated") {
    throw new Error("Only affiliated teams can be scheduled for games");
  }
  if (args.homeClubId === args.awayClubId) {
    throw new Error("Home and away clubs must be different");
  }
  if (!isIsoDateString(args.date)) {
    throw new Error("Game date must use YYYY-MM-DD format");
  }

  if (args.seasonId) {
    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    const season = (settings?.seasons ?? []).find(
      (item) => item.id === args.seasonId,
    );
    if (!season) {
      throw new Error("Selected season not found");
    }

    const today = getTodayDateString();
    if (season.startDate > today || season.endDate < today) {
      throw new Error("Selected season is not currently active");
    }
    if (args.date < season.startDate || args.date > season.endDate) {
      throw new Error("Game date must be within the selected season range");
    }
  }

  return await ctx.db.insert("games", {
    organizationId: organization._id,
    seasonId: args.seasonId,
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
}

export async function updateGameHandler(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    date?: string;
    startTime?: string;
    category?: string;
    gender?: "male" | "female" | "mixed";
    locationName?: string;
    locationCoordinates?: number[];
    status?: "scheduled" | "in_progress" | "halftime" | "completed" | "cancelled";
    homeScore?: number;
    awayScore?: number;
  },
) {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  await requireGameAdminAccess(ctx, game.organizationId);

  const normalizedStatus = normalizeGameStatus(game.status);

  if (
    normalizedStatus === "in_progress" ||
    normalizedStatus === "halftime" ||
    normalizedStatus === "completed"
  ) {
    throw new Error(
      "Games that are in progress or completed cannot be edited",
    );
  }

  const { gameId, ...updates } = args;
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
}

export async function removeGameHandler(
  ctx: MutationCtx,
  args: { gameId: Id<"games"> },
) {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  await requireGameAdminAccess(ctx, game.organizationId);

  const [events, playerStats, teamStats, lineups] = await Promise.all([
    ctx.db
      .query("gameEvents")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
    ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
    ctx.db
      .query("gameTeamStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
    ctx.db
      .query("gameLineups")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
  ]);

  for (const event of events) {
    await ctx.db.delete(event._id);
  }
  for (const stat of playerStats) {
    await ctx.db.delete(stat._id);
  }
  for (const stat of teamStats) {
    await ctx.db.delete(stat._id);
  }
  for (const lineup of lineups) {
    await ctx.db.delete(lineup._id);
  }

  await ctx.db.delete(args.gameId);
  return null;
}
