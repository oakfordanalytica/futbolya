import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";
import { roleFromSessionClaims, type TenantRole } from "@/lib/auth/roles";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";

interface TenantAccess {
  hasAccess: boolean;
  isAdmin: boolean;
  role: TenantRole | null;
}

function hasPendingStaffInvite(publicMetadata: unknown): boolean {
  if (!publicMetadata || typeof publicMetadata !== "object") {
    return false;
  }

  const pendingStaff = (publicMetadata as { pendingStaff?: unknown })
    .pendingStaff;
  if (!pendingStaff || typeof pendingStaff !== "object") {
    return false;
  }

  const staffRole = (pendingStaff as { staffRole?: unknown }).staffRole;
  const clubId = (pendingStaff as { clubId?: unknown }).clubId;
  return typeof staffRole === "string" && typeof clubId === "string";
}

function normalizeMembershipRole(
  role: "superadmin" | "admin" | "member" | "coach" | undefined,
): TenantRole | null {
  if (role === "superadmin") {
    return "superadmin";
  }

  if (role === "admin") {
    return "admin";
  }

  if (role === "member" || role === "coach") {
    return "coach";
  }

  return null;
}

function normalizeMetadataRole(
  role: unknown,
  isSuperAdmin: unknown,
): TenantRole | null {
  if (isSuperAdmin === true) {
    return "superadmin";
  }

  if (role === "superadmin" || role === "org:superadmin") {
    return "superadmin";
  }

  if (role === "admin" || role === "org:admin") {
    return "admin";
  }

  if (role === "coach" || role === "member" || role === "org:member") {
    return "coach";
  }

  return null;
}

function resolveSingleTenantFallbackRole(args: {
  publicMetadata?: unknown;
  sessionClaims?: unknown;
}): TenantRole | null {
  if (args.publicMetadata && typeof args.publicMetadata === "object") {
    const metadata = args.publicMetadata as {
      role?: unknown;
      isSuperAdmin?: unknown;
    };
    const metadataRole = normalizeMetadataRole(
      metadata.role,
      metadata.isSuperAdmin,
    );
    if (metadataRole) {
      return metadataRole;
    }

    if (hasPendingStaffInvite(args.publicMetadata)) {
      return "coach";
    }
  }

  return roleFromSessionClaims(args.sessionClaims);
}

/**
 * Resolve the current user's access level for a tenant slug.
 * Uses Convex memberships so it doesn't depend on Clerk active-org sync timing.
 */
export async function getTenantAccess(
  tenant: string,
  token?: string,
): Promise<TenantAccess> {
  if (isSingleTenantMode()) {
    const authObject = await auth();
    const hasCanonicalTenant = tenant === DEFAULT_TENANT_SLUG;
    if (!authObject.userId || !hasCanonicalTenant) {
      return { hasAccess: false, isAdmin: false, role: null };
    }

    const resolvedToken = token ?? (await getAuthToken());
    if (resolvedToken) {
      try {
        const currentUser = await fetchQuery(
          api.users.me,
          {},
          { token: resolvedToken },
        );

        if (currentUser?.isSuperAdmin) {
          return { hasAccess: true, isAdmin: true, role: "superadmin" };
        }

        const membership = currentUser?.memberships.find(
          (item) => item.organizationSlug === DEFAULT_TENANT_SLUG,
        );
        const role = normalizeMembershipRole(membership?.role);
        if (role) {
          return {
            hasAccess: true,
            isAdmin: role === "admin" || role === "superadmin",
            role,
          };
        }
      } catch {
        // Fall back to Clerk session metadata while the Convex user record catches up.
      }
    }

    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(authObject.userId);
      const role = resolveSingleTenantFallbackRole({
        publicMetadata: clerkUser.publicMetadata,
        sessionClaims: authObject.sessionClaims,
      });

      if (!role) {
        return { hasAccess: false, isAdmin: false, role: null };
      }

      return {
        hasAccess: true,
        isAdmin: role === "admin" || role === "superadmin",
        role,
      };
    } catch {
      const role = resolveSingleTenantFallbackRole({
        sessionClaims: authObject.sessionClaims,
      });

      if (!role) {
        return { hasAccess: false, isAdmin: false, role: null };
      }

      return {
        hasAccess: true,
        isAdmin: role === "admin" || role === "superadmin",
        role,
      };
    }
  }

  const resolvedToken = token ?? (await getAuthToken());
  const currentUser = await fetchQuery(
    api.users.me,
    {},
    { token: resolvedToken },
  );

  if (!currentUser) {
    return { hasAccess: false, isAdmin: false, role: null };
  }

  if (currentUser.isSuperAdmin) {
    return { hasAccess: true, isAdmin: true, role: "superadmin" };
  }

  const membership = currentUser.memberships.find(
    (item) => item.organizationSlug === tenant,
  );
  const role = normalizeMembershipRole(membership?.role);
  const hasAccess = Boolean(role);
  const isAdmin = role === "admin" || role === "superadmin";

  return { hasAccess, isAdmin, role };
}
