import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export type LeagueSettingsCtx = QueryCtx | MutationCtx;

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isIsoDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export async function getOrganizationByLeagueSlug(
  ctx: LeagueSettingsCtx,
  leagueSlug: string,
) {
  return await ctx.db
    .query("organizations")
    .withIndex("bySlug", (q) => q.eq("slug", leagueSlug))
    .unique();
}

export async function getLeagueSettingsByOrganizationId(
  ctx: LeagueSettingsCtx,
  organizationId: Id<"organizations">,
) {
  return await ctx.db
    .query("leagueSettings")
    .withIndex("byOrganization", (q) => q.eq("organizationId", organizationId))
    .unique();
}

export function buildDefaultLeagueSettings(
  organizationId: Id<"organizations">,
  overrides: Partial<{
    ageCategories: Array<{ id: string; name: string; minAge: number; maxAge: number }>;
    positions: Array<{ id: string; name: string; abbreviation: string }>;
    lineups: Array<{
      id: string;
      name: string;
      slots: Array<{
        id: string;
        x: number;
        y: number;
        role: "goalkeeper" | "outfield";
      }>;
    }>;
    enabledGenders: Array<"male" | "female" | "mixed">;
    seasons: Array<{ id: string; name: string; startDate: string; endDate: string }>;
    horizontalDivisions?: {
      enabled: boolean;
      type: "alphabetic" | "greek" | "numeric";
    };
  }> = {},
) {
  return {
    organizationId,
    sportType: "soccer" as const,
    ageCategories: overrides.ageCategories ?? [],
    positions: overrides.positions ?? [],
    lineups: overrides.lineups ?? [],
    enabledGenders: overrides.enabledGenders ?? (["male", "female"] as Array<
      "male" | "female" | "mixed"
    >),
    ...(overrides.seasons ? { seasons: overrides.seasons } : {}),
    ...(overrides.horizontalDivisions !== undefined
      ? { horizontalDivisions: overrides.horizontalDivisions }
      : {}),
  };
}
