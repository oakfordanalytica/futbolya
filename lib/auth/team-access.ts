import "server-only";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

export async function getAccessibleTeamSlugs(
  organizationSlug: string,
  token?: string,
): Promise<string[]> {
  const resolvedToken = token ?? (await getAuthToken());

  if (!resolvedToken) {
    return [];
  }

  try {
    const teamSlugs = await fetchQuery(
      api.staff.listMyClubSlugsByOrganization,
      { organizationSlug },
      { token: resolvedToken },
    );

    return [...new Set(teamSlugs)].sort();
  } catch {
    return [];
  }
}

export async function getPrimaryTeamSlug(
  organizationSlug: string,
  token?: string,
): Promise<string | null> {
  const teamSlugs = await getAccessibleTeamSlugs(organizationSlug, token);
  return teamSlugs[0] ?? null;
}
