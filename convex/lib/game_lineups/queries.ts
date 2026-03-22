import type { QueryCtx } from "../../_generated/server";
import {
  buildLineupPlayers,
  buildLineupSlots,
  buildRosterPlayers,
  getGameLineupAccessScope,
  loadLineupRow,
} from "./helpers";

async function buildResolvedLineup(ctx: QueryCtx, row: any) {
  if (!row) {
    return null;
  }

  const [slots, starters, substitutes] = await Promise.all([
    buildLineupSlots(ctx, row.slots ?? []),
    buildLineupPlayers(ctx, row.starterPlayerIds),
    buildLineupPlayers(ctx, row.substitutePlayerIds),
  ]);

  return {
    gameId: row.gameId,
    clubId: row.clubId,
    lineupTemplateId: row.lineupTemplateId,
    formation: row.formation,
    slots,
    starters,
    substitutes,
    updatedAt: row.updatedAt,
  };
}

export async function getGameLineupsByGameIdHandler(
  ctx: QueryCtx,
  args: { gameId: any },
) {
  const { game, canEditHome, canEditAway } = await getGameLineupAccessScope(
    ctx,
    args.gameId,
  );

  const [homeRow, awayRow] = await Promise.all([
    loadLineupRow(ctx, game._id, game.homeClubId),
    loadLineupRow(ctx, game._id, game.awayClubId),
  ]);

  const [homeLineup, awayLineup] = await Promise.all([
    buildResolvedLineup(ctx, homeRow),
    buildResolvedLineup(ctx, awayRow),
  ]);

  return {
    homeLineup,
    awayLineup,
    canEditHome,
    canEditAway,
  };
}

export async function getGameLineupsEditorDataHandler(
  ctx: QueryCtx,
  args: { gameId: any },
) {
  const { game, canEditHome, canEditAway } = await getGameLineupAccessScope(
    ctx,
    args.gameId,
  );

  const [homeClub, awayClub, homeLineupRow, awayLineupRow] = await Promise.all([
    ctx.db.get(game.homeClubId),
    ctx.db.get(game.awayClubId),
    loadLineupRow(ctx, game._id, game.homeClubId),
    loadLineupRow(ctx, game._id, game.awayClubId),
  ]);

  if (!homeClub || !awayClub) {
    throw new Error("Game clubs not found");
  }

  const settings = await ctx.db
    .query("leagueSettings")
    .withIndex("byOrganization", (q) => q.eq("organizationId", game.organizationId))
    .unique();

  const [homeTeamLogoUrl, awayTeamLogoUrl, homeRoster, awayRoster, homeLineup, awayLineup] =
    await Promise.all([
      homeClub.logoStorageId ? ctx.storage.getUrl(homeClub.logoStorageId) : Promise.resolve(null),
      awayClub.logoStorageId ? ctx.storage.getUrl(awayClub.logoStorageId) : Promise.resolve(null),
      buildRosterPlayers(ctx, homeClub._id),
      buildRosterPlayers(ctx, awayClub._id),
      buildResolvedLineup(ctx, homeLineupRow),
      buildResolvedLineup(ctx, awayLineupRow),
    ]);

  return {
    availableLineups: settings?.lineups ?? [],
    homeTeam: {
      clubId: homeClub._id,
      teamName: homeClub.name,
      teamLogoUrl: homeTeamLogoUrl ?? undefined,
      teamColor: homeClub.colors?.[0] ?? undefined,
      canEdit: canEditHome,
      lineup: homeLineup,
      roster: homeRoster,
    },
    awayTeam: {
      clubId: awayClub._id,
      teamName: awayClub.name,
      teamLogoUrl: awayTeamLogoUrl ?? undefined,
      teamColor: awayClub.colors?.[0] ?? undefined,
      canEdit: canEditAway,
      lineup: awayLineup,
      roster: awayRoster,
    },
  };
}
