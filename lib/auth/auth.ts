import type { auth } from "@clerk/nextjs/server";
import type { AppRole } from "@/convex/lib/auth_types";

export type Auth = Awaited<ReturnType<typeof auth>>;

/**
 * Get user's roles from Clerk session claims.
 * Handles both session token format and publicMetadata format.
 */
export function getRolesFromClaims(auth: Auth): Record<string, AppRole> | null {
  // Try to get from top-level session claims first (after JWT configuration)
  const directRoles = auth.sessionClaims?.roles as Record<string, AppRole> | undefined;
  if (directRoles && typeof directRoles === 'object') {
    return directRoles;
  }

  // Fallback to publicMetadata (before JWT configuration)
  const publicMetadata = auth.sessionClaims?.publicMetadata as
    | { roles?: Record<string, AppRole> }
    | undefined;
  
  return publicMetadata?.roles || null;
}

/**
 * Get role for a specific organization
 * Updated to fallback to SuperAdmin if the specific org role doesn't exist
 */
export function getRoleForOrg(auth: Auth, orgSlug: string): AppRole | null {
  const roles = getRolesFromClaims(auth);
  if (!roles) return null;

  // Priority 1: Specific Role in this Org
  if (roles[orgSlug]) return roles[orgSlug];

  // Priority 2: Global SuperAdmin
  if (roles["system"] === "SuperAdmin") return "SuperAdmin";

  return null;
}

/**
 * Get base path for a role
 */
export function getRoleBasePath(orgSlug: string, role: AppRole): string {
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

/**
 * Get the route path based on user's role
 */
export function getRouteByRole(role: AppRole, orgSlug: string): string {
  return getRoleBasePath(orgSlug, role);
}

/**
 * Get user's primary organization (first one with a role)
 */
export function getPrimaryOrg(
  roles: Record<string, AppRole> | null,
): { slug: string; role: AppRole } | null {
  if (!roles || Object.keys(roles).length === 0) return null;
  const firstSlug = Object.keys(roles)[0];
  return { slug: firstSlug, role: roles[firstSlug] };
}

/**
 * Check if user is a global SuperAdmin based on claims
 */
export function isSuperAdmin(auth: Auth): boolean {
  const roles = getRolesFromClaims(auth);
  if (!roles) return false;
  // Check for the reserved system key
  return roles["system"] === "SuperAdmin";
}