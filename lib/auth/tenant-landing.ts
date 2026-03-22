import "server-only";

import { TEAM_ROUTES, ROUTES } from "@/lib/navigation/routes";
import { getPrimaryTeamSlug } from "@/lib/auth/team-access";
import { getTenantAccess } from "@/lib/auth/tenant-access";

export type TenantLandingResolution =
  | {
      status: "ready";
      path: string;
    }
  | {
      status: "pending";
    }
  | {
      status: "forbidden";
      path: string;
    };

export async function resolveTenantLanding(
  tenant: string,
  token?: string,
): Promise<TenantLandingResolution> {
  const { hasAccess, role } = await getTenantAccess(tenant, token);

  if (!hasAccess || !role) {
    return {
      status: "forbidden",
      path: ROUTES.org.root(tenant),
    };
  }

  if (role === "coach") {
    const teamSlug = await getPrimaryTeamSlug(tenant, token);

    if (!teamSlug) {
      return { status: "pending" };
    }

    return {
      status: "ready",
      path: TEAM_ROUTES.roster(tenant, teamSlug),
    };
  }

  return {
    status: "ready",
    path: ROUTES.org.teams.list(tenant),
  };
}
