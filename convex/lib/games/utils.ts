import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "../../lib/permissions";
import { normalizeGameStatus, type StoredGameStatus } from "@/lib/games/status";
import type { GameDoc, TeamStatsDoc } from "./validators";

export type PermissionCtx = QueryCtx | MutationCtx;

export function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

export function calculatePercentage(partial: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return roundToSingleDecimal((partial / total) * 100);
}

export function isOperationallyCompleted(status: StoredGameStatus) {
  return normalizeGameStatus(status) === "completed";
}

export function topByMetric<T>(
  items: Array<T>,
  getValue: (item: T) => number,
  limit: number,
  direction: "desc" | "asc" = "desc",
): Array<T> {
  return [...items]
    .sort((a, b) => {
      const diff = getValue(a) - getValue(b);
      if (diff === 0) {
        return 0;
      }
      return direction === "desc" ? diff * -1 : diff;
    })
    .slice(0, limit);
}

export function isIsoDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function requireGameAccess(ctx: PermissionCtx, game: GameDoc) {
  const user = await getCurrentUser(ctx);
  if (user.isSuperAdmin) {
    return user;
  }

  const isOrgAdmin = await hasOrgAdminAccess(
    ctx,
    user._id,
    game.organizationId,
  );
  if (isOrgAdmin) {
    return user;
  }

  const [homeAccess, awayAccess] = await Promise.all([
    hasClubStaffAccess(ctx, user._id, game.homeClubId),
    hasClubStaffAccess(ctx, user._id, game.awayClubId),
  ]);

  if (!homeAccess && !awayAccess) {
    throw new Error("You do not have access to this game");
  }

  return user;
}

export async function requireGameAdminAccess(
  ctx: PermissionCtx,
  organizationId: Id<"organizations">,
) {
  const user = await getCurrentUser(ctx);
  if (user.isSuperAdmin) {
    return user;
  }

  const isOrgAdmin = await hasOrgAdminAccess(ctx, user._id, organizationId);
  if (!isOrgAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

export async function loadClubsWithLogos(
  ctx: PermissionCtx,
  clubIds: Array<Id<"clubs">>,
) {
  const uniqueClubIds = [...new Set(clubIds)];
  const clubs = await Promise.all(uniqueClubIds.map((id) => ctx.db.get(id)));
  const existingClubs = clubs.filter((club): club is NonNullable<typeof club> =>
    Boolean(club),
  );
  const clubMap = new Map(existingClubs.map((club) => [club._id, club]));

  const logoEntries = await Promise.all(
    existingClubs.map(async (club) => {
      const logoUrl = club.logoStorageId
        ? ((await ctx.storage.getUrl(club.logoStorageId)) ?? undefined)
        : undefined;
      return [club._id, logoUrl] as const;
    }),
  );

  return {
    clubMap,
    clubLogoMap: new Map(logoEntries),
  };
}

export function buildTeamTotals(
  clubId: Id<"clubs">,
  game: GameDoc,
  playerStats: Array<{
    clubId: Id<"clubs">;
    yellowCards?: number;
    redCards?: number;
    penaltiesAttempted?: number;
    penaltiesScored?: number;
  }>,
  teamStats: TeamStatsDoc | null,
) {
  const teamPlayerStats = playerStats.filter((stat) => stat.clubId === clubId);
  const goals =
    game.homeClubId === clubId ? (game.homeScore ?? 0) : (game.awayScore ?? 0);

  return {
    clubId,
    goals,
    corners: teamStats?.corners ?? 0,
    freeKicks: teamStats?.freeKicks ?? 0,
    yellowCards: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.yellowCards ?? 0),
      0,
    ),
    redCards: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.redCards ?? 0),
      0,
    ),
    penaltiesAttempted: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.penaltiesAttempted ?? 0),
      0,
    ),
    penaltiesScored: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.penaltiesScored ?? 0),
      0,
    ),
    substitutions: teamStats?.substitutions ?? 0,
  };
}
