import type { AppRole } from "@/lib/auth/types";

export function getRoleForOrg(
  auth: Awaited<ReturnType<typeof import("@clerk/nextjs/server").auth>>,
  orgSlug: string,
): AppRole | null {
  const publicMetadata = auth.sessionClaims?.publicMetadata as { roles?: Record<string, AppRole> } | undefined;
  const roles = publicMetadata?.roles;
  
  if (!roles) {
    return null;
  }
  return roles[orgSlug] ?? null;
}

function getRoleBasePath(orgSlug: string, role: AppRole): string {
  switch (role) {
    case "SuperAdmin":
    case "LeagueAdmin":
    case "ClubAdmin":
      return `/${orgSlug}/admin`;
    case "TechnicalDirector":
      return `/${orgSlug}/coach`;
    case "Player":
      return `/${orgSlug}/player`;
    case "Referee":
      return `/${orgSlug}/referee`;
    default:
      return `/${orgSlug}`;
  }
}

export function getRouteByRole(
  auth: Awaited<ReturnType<typeof import("@clerk/nextjs/server").auth>>,
  orgSlug: string,
): string {
  const role = getRoleForOrg(auth, orgSlug);
  return role ? getRoleBasePath(orgSlug, role) : `/${orgSlug}`;
}