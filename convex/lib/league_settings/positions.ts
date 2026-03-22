import type { MutationCtx } from "../../_generated/server";
import { requireOrgAdmin } from "../../lib/permissions";
import {
  buildDefaultLeagueSettings,
  getLeagueSettingsByOrganizationId,
} from "./helpers";

export async function addPositionHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    position: { id: string; name: string; abbreviation: string };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        positions: [args.position],
      }),
    );
    return null;
  }

  const currentPositions = settings.positions ?? [];
  const exists = currentPositions.some(
    (p) => p.id === args.position.id || p.name === args.position.name,
  );
  if (exists) {
    throw new Error("Position already exists");
  }

  await ctx.db.patch(settings._id, {
    positions: [...currentPositions, args.position],
  });

  return null;
}

export async function removePositionHandler(
  ctx: MutationCtx,
  args: { leagueSlug: string; positionId: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    return null;
  }

  const currentPositions = settings.positions ?? [];
  await ctx.db.patch(settings._id, {
    positions: currentPositions.filter((p) => p.id !== args.positionId),
  });

  return null;
}

export async function updatePositionHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    positionId: string;
    name: string;
    abbreviation: string;
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const positionName = args.name.trim();
  const positionAbbreviation = args.abbreviation.trim();
  if (!positionName || !positionAbbreviation) {
    throw new Error("Position name and abbreviation are required");
  }

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    throw new Error("League settings not found");
  }

  const currentPositions = settings.positions ?? [];
  const positionExists = currentPositions.some(
    (position) => position.id === args.positionId,
  );
  if (!positionExists) {
    throw new Error("Position not found");
  }

  const duplicatePosition = currentPositions.some(
    (position) =>
      position.id !== args.positionId &&
      (position.name === positionName ||
        position.abbreviation === positionAbbreviation),
  );
  if (duplicatePosition) {
    throw new Error("Position already exists");
  }

  await ctx.db.patch(settings._id, {
    positions: currentPositions.map((position) =>
      position.id === args.positionId
        ? {
            ...position,
            name: positionName,
            abbreviation: positionAbbreviation,
          }
        : position,
    ),
  });

  return null;
}
