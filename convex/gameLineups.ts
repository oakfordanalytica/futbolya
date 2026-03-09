import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "./lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";

type LineupCtx = QueryCtx | MutationCtx;

const lineupPlayerValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  lastName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  position: v.optional(v.string()),
});

const lineupSlotValidator = v.object({
  id: v.string(),
  x: v.number(),
  y: v.number(),
  role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
  player: v.optional(lineupPlayerValidator),
});

const lineupValidator = v.object({
  gameId: v.id("games"),
  clubId: v.id("clubs"),
  lineupTemplateId: v.optional(v.string()),
  formation: v.optional(v.string()),
  slots: v.array(lineupSlotValidator),
  starters: v.array(lineupPlayerValidator),
  substitutes: v.array(lineupPlayerValidator),
  updatedAt: v.optional(v.number()),
});

const rosterPlayerValidator = v.object({
  _id: v.id("players"),
  playerName: v.string(),
  lastName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  position: v.optional(v.string()),
});

const lineupTemplateValidator = v.object({
  id: v.string(),
  name: v.string(),
  slots: v.array(
    v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
    }),
  ),
});

const editorTeamValidator = v.object({
  clubId: v.id("clubs"),
  teamName: v.string(),
  teamLogoUrl: v.optional(v.string()),
  teamColor: v.optional(v.string()),
  canEdit: v.boolean(),
  lineup: v.union(lineupValidator, v.null()),
  roster: v.array(rosterPlayerValidator),
});

const lineupMutationInputValidator = v.object({
  clubId: v.id("clubs"),
  lineupTemplateId: v.optional(v.string()),
  formation: v.optional(v.string()),
  slots: v.array(
    v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
      playerId: v.optional(v.id("players")),
    }),
  ),
  starterPlayerIds: v.array(v.id("players")),
  substitutePlayerIds: v.array(v.id("players")),
});

function normalizeFormation(input?: string) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

function ensureUniqueIds(ids: Id<"players">[], label: string) {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} contains duplicate players`);
  }
}

function buildPlayerName(player: {
  firstName: string;
  lastName: string;
  secondLastName?: string;
}) {
  return buildPlayerFullName(
    player.firstName,
    player.lastName,
    player.secondLastName,
  );
}

async function buildLineupPlayers(ctx: LineupCtx, playerIds: Id<"players">[]) {
  const players = await Promise.all(
    playerIds.map((playerId) => ctx.db.get(playerId)),
  );

  return await Promise.all(
    players
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(async (player) => ({
        playerId: player._id,
        playerName: buildPlayerName(player),
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoStorageId
          ? ((await ctx.storage.getUrl(player.photoStorageId)) ?? undefined)
          : undefined,
        position: player.position,
      })),
  );
}

async function buildRosterPlayers(ctx: LineupCtx, clubId: Id<"clubs">) {
  const players = await ctx.db
    .query("players")
    .withIndex("byClub", (q) => q.eq("clubId", clubId))
    .collect();

  const soccerPlayers = players
    .filter(
      (player) => player.sportType === "soccer" && player.status === "active",
    )
    .sort((a, b) =>
      buildPlayerName(a).localeCompare(buildPlayerName(b), undefined, {
        sensitivity: "base",
      }),
    );

  return await Promise.all(
    soccerPlayers.map(async (player) => ({
      _id: player._id,
      playerName: buildPlayerName(player),
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber,
      cometNumber: player.cometNumber,
      photoUrl: player.photoStorageId
        ? ((await ctx.storage.getUrl(player.photoStorageId)) ?? undefined)
        : undefined,
      position: player.position,
    })),
  );
}

async function getGameAccessScope(ctx: LineupCtx, gameId: Id<"games">) {
  const user = await getCurrentUser(ctx);
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const isOrgAdmin = await hasOrgAdminAccess(
    ctx,
    user._id,
    game.organizationId,
  );
  const [canCoachHome, canCoachAway] = await Promise.all([
    hasClubStaffAccess(ctx, user._id, game.homeClubId),
    hasClubStaffAccess(ctx, user._id, game.awayClubId),
  ]);

  if (!isOrgAdmin && !canCoachHome && !canCoachAway) {
    throw new Error("You do not have access to this game");
  }

  return {
    user,
    game,
    canEditHome: isOrgAdmin || canCoachHome,
    canEditAway: isOrgAdmin || canCoachAway,
  };
}

async function loadLineupRow(
  ctx: LineupCtx,
  gameId: Id<"games">,
  clubId: Id<"clubs">,
) {
  return await ctx.db
    .query("gameLineups")
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", gameId).eq("clubId", clubId),
    )
    .unique();
}

async function buildLineupSlots(
  ctx: LineupCtx,
  slots: {
    id: string;
    x: number;
    y: number;
    role: "goalkeeper" | "outfield";
    playerId?: Id<"players">;
  }[],
) {
  return await Promise.all(
    slots.map(async (slot) => {
      if (!slot.playerId) {
        return {
          id: slot.id,
          x: slot.x,
          y: slot.y,
          role: slot.role,
        };
      }

      const players = await buildLineupPlayers(ctx, [slot.playerId]);
      const player = players[0];

      return {
        id: slot.id,
        x: slot.x,
        y: slot.y,
        role: slot.role,
        ...(player ? { player } : {}),
      };
    }),
  );
}

async function validateAndPersistLineup(
  ctx: MutationCtx,
  {
    gameId,
    userId,
    game,
    canEditHome,
    canEditAway,
    lineup,
  }: {
    gameId: Id<"games">;
    userId: Id<"users">;
    game: {
      homeClubId: Id<"clubs">;
      awayClubId: Id<"clubs">;
    };
    canEditHome: boolean;
    canEditAway: boolean;
    lineup: {
      clubId: Id<"clubs">;
      lineupTemplateId?: string;
      formation?: string;
      slots: {
        id: string;
        x: number;
        y: number;
        role: "goalkeeper" | "outfield";
        playerId?: Id<"players">;
      }[];
      starterPlayerIds: Id<"players">[];
      substitutePlayerIds: Id<"players">[];
    };
  },
) {
  const isHomeTeam = lineup.clubId === game.homeClubId;
  const isAwayTeam = lineup.clubId === game.awayClubId;
  if (!isHomeTeam && !isAwayTeam) {
    throw new Error("Club is not part of this game");
  }

  if ((isHomeTeam && !canEditHome) || (isAwayTeam && !canEditAway)) {
    throw new Error("You do not have permission to edit this lineup");
  }

  ensureUniqueIds(lineup.starterPlayerIds, "Starters");
  ensureUniqueIds(lineup.substitutePlayerIds, "Substitutes");

  const allPlayerIds = [
    ...lineup.starterPlayerIds,
    ...lineup.substitutePlayerIds,
  ];
  if (new Set(allPlayerIds).size !== allPlayerIds.length) {
    throw new Error(
      "A player cannot be in starters and substitutes at the same time",
    );
  }
  if (lineup.starterPlayerIds.length > 11) {
    throw new Error("Starters cannot exceed 11 players");
  }

  if (lineup.slots.length > 0) {
    const slotPlayerIds = lineup.slots
      .map((slot) => slot.playerId)
      .filter((playerId): playerId is Id<"players"> => Boolean(playerId));
    if (new Set(slotPlayerIds).size !== slotPlayerIds.length) {
      throw new Error("A player cannot be assigned to more than one slot");
    }
    if (slotPlayerIds.length !== lineup.starterPlayerIds.length) {
      throw new Error("Starter players must match the assigned lineup slots");
    }
    const starterSet = new Set(lineup.starterPlayerIds);
    const slotSet = new Set(slotPlayerIds);
    if (
      starterSet.size !== slotSet.size ||
      [...starterSet].some((playerId) => !slotSet.has(playerId))
    ) {
      throw new Error("Starter players must match the assigned lineup slots");
    }
  }

  const players = await Promise.all(
    allPlayerIds.map((playerId) => ctx.db.get(playerId)),
  );
  for (const player of players) {
    if (
      !player ||
      player.clubId !== lineup.clubId ||
      player.sportType !== "soccer"
    ) {
      throw new Error(
        "One or more selected players do not belong to this team",
      );
    }
  }

  const payload = {
    gameId,
    clubId: lineup.clubId,
    lineupTemplateId: lineup.lineupTemplateId,
    formation: normalizeFormation(lineup.formation),
    slots: lineup.slots,
    starterPlayerIds: lineup.starterPlayerIds,
    substitutePlayerIds: lineup.substitutePlayerIds,
    updatedBy: userId,
    updatedAt: Date.now(),
  };

  const existing = await loadLineupRow(ctx, gameId, lineup.clubId);
  if (existing) {
    await ctx.db.patch(existing._id, payload);
  } else {
    await ctx.db.insert("gameLineups", payload);
  }
}

export const getByGameId = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeLineup: v.union(lineupValidator, v.null()),
    awayLineup: v.union(lineupValidator, v.null()),
    canEditHome: v.boolean(),
    canEditAway: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { game, canEditHome, canEditAway } = await getGameAccessScope(
      ctx,
      args.gameId,
    );

    const [homeRow, awayRow] = await Promise.all([
      loadLineupRow(ctx, game._id, game.homeClubId),
      loadLineupRow(ctx, game._id, game.awayClubId),
    ]);

    const [homeLineup, awayLineup] = await Promise.all([
      homeRow
        ? Promise.all([
            buildLineupSlots(ctx, homeRow.slots ?? []),
            buildLineupPlayers(ctx, homeRow.starterPlayerIds),
            buildLineupPlayers(ctx, homeRow.substitutePlayerIds),
          ]).then(([slots, starters, substitutes]) => ({
            gameId: homeRow.gameId,
            clubId: homeRow.clubId,
            lineupTemplateId: homeRow.lineupTemplateId,
            formation: homeRow.formation,
            slots,
            starters,
            substitutes,
            updatedAt: homeRow.updatedAt,
          }))
        : Promise.resolve(null),
      awayRow
        ? Promise.all([
            buildLineupSlots(ctx, awayRow.slots ?? []),
            buildLineupPlayers(ctx, awayRow.starterPlayerIds),
            buildLineupPlayers(ctx, awayRow.substitutePlayerIds),
          ]).then(([slots, starters, substitutes]) => ({
            gameId: awayRow.gameId,
            clubId: awayRow.clubId,
            lineupTemplateId: awayRow.lineupTemplateId,
            formation: awayRow.formation,
            slots,
            starters,
            substitutes,
            updatedAt: awayRow.updatedAt,
          }))
        : Promise.resolve(null),
    ]);

    return {
      homeLineup,
      awayLineup,
      canEditHome,
      canEditAway,
    };
  },
});

export const getEditorData = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    availableLineups: v.array(lineupTemplateValidator),
    homeTeam: editorTeamValidator,
    awayTeam: editorTeamValidator,
  }),
  handler: async (ctx, args) => {
    const { game, canEditHome, canEditAway } = await getGameAccessScope(
      ctx,
      args.gameId,
    );

    const [homeClub, awayClub, homeLineupRow, awayLineupRow] =
      await Promise.all([
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
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", game.organizationId),
      )
      .unique();

    const [homeTeamLogoUrl, awayTeamLogoUrl, homeRoster, awayRoster] =
      await Promise.all([
        homeClub.logoStorageId
          ? ctx.storage.getUrl(homeClub.logoStorageId)
          : Promise.resolve(null),
        awayClub.logoStorageId
          ? ctx.storage.getUrl(awayClub.logoStorageId)
          : Promise.resolve(null),
        buildRosterPlayers(ctx, homeClub._id),
        buildRosterPlayers(ctx, awayClub._id),
      ]);

    const [homeLineup, awayLineup] = await Promise.all([
      homeLineupRow
        ? Promise.all([
            buildLineupSlots(ctx, homeLineupRow.slots ?? []),
            buildLineupPlayers(ctx, homeLineupRow.starterPlayerIds),
            buildLineupPlayers(ctx, homeLineupRow.substitutePlayerIds),
          ]).then(([slots, starters, substitutes]) => ({
            gameId: homeLineupRow.gameId,
            clubId: homeLineupRow.clubId,
            lineupTemplateId: homeLineupRow.lineupTemplateId,
            formation: homeLineupRow.formation,
            slots,
            starters,
            substitutes,
            updatedAt: homeLineupRow.updatedAt,
          }))
        : Promise.resolve(null),
      awayLineupRow
        ? Promise.all([
            buildLineupSlots(ctx, awayLineupRow.slots ?? []),
            buildLineupPlayers(ctx, awayLineupRow.starterPlayerIds),
            buildLineupPlayers(ctx, awayLineupRow.substitutePlayerIds),
          ]).then(([slots, starters, substitutes]) => ({
            gameId: awayLineupRow.gameId,
            clubId: awayLineupRow.clubId,
            lineupTemplateId: awayLineupRow.lineupTemplateId,
            formation: awayLineupRow.formation,
            slots,
            starters,
            substitutes,
            updatedAt: awayLineupRow.updatedAt,
          }))
        : Promise.resolve(null),
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
  },
});

export const upsert = mutation({
  args: {
    gameId: v.id("games"),
    ...lineupMutationInputValidator.fields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user, game, canEditHome, canEditAway } = await getGameAccessScope(
      ctx,
      args.gameId,
    );

    await validateAndPersistLineup(ctx, {
      gameId: args.gameId,
      userId: user._id,
      game,
      canEditHome,
      canEditAway,
      lineup: args,
    });

    return null;
  },
});

export const saveEditorData = mutation({
  args: {
    gameId: v.id("games"),
    lineups: v.array(lineupMutationInputValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user, game, canEditHome, canEditAway } = await getGameAccessScope(
      ctx,
      args.gameId,
    );

    if (args.lineups.length === 0) {
      throw new Error("No lineups to save");
    }

    const clubIds = args.lineups.map((lineup) => lineup.clubId);
    if (new Set(clubIds).size !== clubIds.length) {
      throw new Error("Each team lineup can only be submitted once");
    }

    for (const lineup of args.lineups) {
      await validateAndPersistLineup(ctx, {
        gameId: args.gameId,
        userId: user._id,
        game,
        canEditHome,
        canEditAway,
        lineup,
      });
    }

    return null;
  },
});
