import type { QueryCtx } from "../../_generated/server";
import { requireOrgAccess, requireOrgAdmin } from "../permissions";
import {
  getLeagueSettingsByOrganizationId,
  getTodayDateString,
} from "./helpers";

export async function getTeamConfigHandler(
  ctx: QueryCtx,
  args: { leagueSlug: string },
) {
  const { organization } = await requireOrgAccess(ctx, args.leagueSlug);
  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );

  if (!settings) {
    return {
      sportType: "soccer" as const,
      ageCategories: [],
      positions: [],
      lineups: [],
      enabledGenders: ["male", "female"] as Array<"male" | "female" | "mixed">,
      horizontalDivisions: undefined,
    };
  }

  return {
    sportType: settings.sportType,
    ageCategories: settings.ageCategories,
    positions: settings.positions ?? [],
    lineups: settings.lineups ?? [],
    enabledGenders: settings.enabledGenders,
    horizontalDivisions: settings.horizontalDivisions,
  };
}

export async function getByLeagueSlugHandler(
  ctx: QueryCtx,
  args: { leagueSlug: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);
  return await getLeagueSettingsByOrganizationId(ctx, organization._id);
}

export async function listSeasonsHandler(
  ctx: QueryCtx,
  args: { leagueSlug: string },
) {
  const { organization } = await requireOrgAccess(ctx, args.leagueSlug);
  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );
  const seasons = settings?.seasons ?? [];
  return [...seasons].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function listActiveSeasonsHandler(
  ctx: QueryCtx,
  args: { leagueSlug: string },
) {
  const { organization } = await requireOrgAccess(ctx, args.leagueSlug);
  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );

  if (!settings?.seasons?.length) {
    return [];
  }

  const today = getTodayDateString();
  return settings.seasons
    .filter((season) => season.startDate <= today && season.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
