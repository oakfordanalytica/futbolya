import type { MutationCtx } from "../../_generated/server";
import { requireOrgAdmin } from "../../lib/permissions";
import {
  buildDefaultLeagueSettings,
  getLeagueSettingsByOrganizationId,
} from "./helpers";

export async function addLineupHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    lineup: {
      id: string;
      name: string;
      slots: Array<{ id: string; x: number; y: number; role: "goalkeeper" | "outfield" }>;
    };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const lineupName = args.lineup.name.trim();
  if (!lineupName) {
    throw new Error("Lineup name is required");
  }

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        lineups: [{ ...args.lineup, name: lineupName }],
      }),
    );
    return null;
  }

  const currentLineups = settings.lineups ?? [];
  const exists = currentLineups.some(
    (lineup) =>
      lineup.id === args.lineup.id ||
      lineup.name.toLowerCase() === lineupName.toLowerCase(),
  );
  if (exists) {
    throw new Error("Lineup already exists");
  }

  await ctx.db.patch(settings._id, {
    lineups: [...currentLineups, { ...args.lineup, name: lineupName }],
  });

  return null;
}

export async function updateLineupHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    lineupId: string;
    name: string;
    slots: Array<{ id: string; x: number; y: number; role: "goalkeeper" | "outfield" }>;
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const lineupName = args.name.trim();
  if (!lineupName) {
    throw new Error("Lineup name is required");
  }

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    throw new Error("League settings not found");
  }

  const currentLineups = settings.lineups ?? [];
  const exists = currentLineups.some(
    (lineup) =>
      lineup.id !== args.lineupId &&
      lineup.name.toLowerCase() === lineupName.toLowerCase(),
  );
  if (exists) {
    throw new Error("Lineup already exists");
  }

  const target = currentLineups.find((lineup) => lineup.id === args.lineupId);
  if (!target) {
    throw new Error("Lineup not found");
  }

  await ctx.db.patch(settings._id, {
    lineups: currentLineups.map((lineup) =>
      lineup.id === args.lineupId
        ? {
            ...lineup,
            name: lineupName,
            slots: args.slots,
          }
        : lineup,
    ),
  });

  return null;
}

export async function removeLineupHandler(
  ctx: MutationCtx,
  args: { leagueSlug: string; lineupId: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    throw new Error("League settings not found");
  }

  await ctx.db.patch(settings._id, {
    lineups: (settings.lineups ?? []).filter(
      (lineup) => lineup.id !== args.lineupId,
    ),
  });

  return null;
}
