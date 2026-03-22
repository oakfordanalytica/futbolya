import type { MutationCtx } from "../../_generated/server";
import { requireOrgAdmin } from "../../lib/permissions";
import {
  buildDefaultLeagueSettings,
  getLeagueSettingsByOrganizationId,
} from "./helpers";

export async function upsertLeagueSettingsHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    sportType: "soccer";
    ageCategories: Array<{ id: string; name: string; minAge: number; maxAge: number }>;
    positions: Array<{ id: string; name: string; abbreviation: string }>;
    lineups?: Array<{
      id: string;
      name: string;
      slots: Array<{ id: string; x: number; y: number; role: "goalkeeper" | "outfield" }>;
    }>;
    enabledGenders: Array<"male" | "female" | "mixed">;
    horizontalDivisions?: {
      enabled: boolean;
      type: "alphabetic" | "greek" | "numeric";
    };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const existing = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (existing) {
    await ctx.db.patch(existing._id, {
      sportType: args.sportType,
      ageCategories: args.ageCategories,
      positions: args.positions,
      lineups: args.lineups,
      enabledGenders: args.enabledGenders,
      horizontalDivisions: args.horizontalDivisions,
    });
    return existing._id;
  }

  return await ctx.db.insert(
    "leagueSettings",
    buildDefaultLeagueSettings(organization._id, {
      ageCategories: args.ageCategories,
      positions: args.positions,
      lineups: args.lineups,
      enabledGenders: args.enabledGenders,
      horizontalDivisions: args.horizontalDivisions,
    }),
  );
}

export async function updateEnabledGendersHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    enabledGenders: Array<"male" | "female" | "mixed">;
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        enabledGenders: args.enabledGenders,
      }),
    );
    return null;
  }

  await ctx.db.patch(settings._id, {
    enabledGenders: args.enabledGenders,
  });

  return null;
}

export async function updateHorizontalDivisionsHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    horizontalDivisions?: {
      enabled: boolean;
      type: "alphabetic" | "greek" | "numeric";
    };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(ctx, organization._id);

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        horizontalDivisions: args.horizontalDivisions,
      }),
    );
    return null;
  }

  await ctx.db.patch(settings._id, {
    horizontalDivisions: args.horizontalDivisions,
  });

  return null;
}
