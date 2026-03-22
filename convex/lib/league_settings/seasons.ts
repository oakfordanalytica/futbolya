import type { MutationCtx } from "../../_generated/server";
import { requireOrgAdmin } from "../../lib/permissions";
import {
  buildDefaultLeagueSettings,
  getLeagueSettingsByOrganizationId,
  isIsoDateString,
} from "./helpers";

export async function addSeasonHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    season: { id: string; name: string; startDate: string; endDate: string };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const seasonName = args.season.name.trim();
  if (!seasonName) {
    throw new Error("Season name is required");
  }

  if (
    !isIsoDateString(args.season.startDate) ||
    !isIsoDateString(args.season.endDate)
  ) {
    throw new Error("Season dates must use YYYY-MM-DD format");
  }

  if (args.season.startDate > args.season.endDate) {
    throw new Error("Season start date must be before end date");
  }

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        seasons: [
          {
            ...args.season,
            name: seasonName,
          },
        ],
      }),
    );
    return null;
  }

  const currentSeasons = settings.seasons ?? [];
  const seasonAlreadyExists = currentSeasons.some(
    (season) => season.id === args.season.id || season.name === seasonName,
  );
  if (seasonAlreadyExists) {
    throw new Error("Season already exists");
  }

  await ctx.db.patch(settings._id, {
    seasons: [
      ...currentSeasons,
      {
        ...args.season,
        name: seasonName,
      },
    ],
  });

  return null;
}

export async function removeSeasonHandler(
  ctx: MutationCtx,
  args: { leagueSlug: string; seasonId: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings?.seasons?.length) {
    return null;
  }

  const seasonExists = settings.seasons.some(
    (season) => season.id === args.seasonId,
  );
  if (!seasonExists) {
    return null;
  }

  const gamesWithSeason = await ctx.db
    .query("games")
    .withIndex("byOrganizationAndSeason", (q) =>
      q.eq("organizationId", organization._id).eq("seasonId", args.seasonId),
    )
    .take(1);

  if (gamesWithSeason.length > 0) {
    throw new Error(
      "Season cannot be removed because there are games linked to it",
    );
  }

  await ctx.db.patch(settings._id, {
    seasons: settings.seasons.filter((season) => season.id !== args.seasonId),
  });

  return null;
}

export async function updateSeasonHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    seasonId: string;
    name: string;
    startDate: string;
    endDate: string;
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const seasonName = args.name.trim();
  if (!seasonName) {
    throw new Error("Season name is required");
  }
  if (!isIsoDateString(args.startDate) || !isIsoDateString(args.endDate)) {
    throw new Error("Season dates must use YYYY-MM-DD format");
  }
  if (args.startDate > args.endDate) {
    throw new Error("Season start date must be before end date");
  }

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings?.seasons?.length) {
    throw new Error("Season not found");
  }

  const seasonExists = settings.seasons.some(
    (season) => season.id === args.seasonId,
  );
  if (!seasonExists) {
    throw new Error("Season not found");
  }

  const duplicateName = settings.seasons.some(
    (season) => season.id !== args.seasonId && season.name === seasonName,
  );
  if (duplicateName) {
    throw new Error("Season already exists");
  }

  const gamesWithSeason = await ctx.db
    .query("games")
    .withIndex("byOrganizationAndSeason", (q) =>
      q.eq("organizationId", organization._id).eq("seasonId", args.seasonId),
    )
    .collect();

  const gameOutOfRange = gamesWithSeason.some(
    (game) => game.date < args.startDate || game.date > args.endDate,
  );
  if (gameOutOfRange) {
    throw new Error("Season range must include all linked games");
  }

  await ctx.db.patch(settings._id, {
    seasons: settings.seasons.map((season) =>
      season.id === args.seasonId
        ? {
            ...season,
            name: seasonName,
            startDate: args.startDate,
            endDate: args.endDate,
          }
        : season,
    ),
  });

  return null;
}
