import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";
import { roleFromPublicMetadata, type TenantRole } from "@/lib/auth/roles";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";

interface TenantAccess {
  hasAccess: boolean;
  isAdmin: boolean;
  role: TenantRole | null;
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

export async function getCurrentClerkTenantRole(
  userId: string,
): Promise<TenantRole | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const currentUser = await fetchQuery(api.users.me, {}, { token });
  if (!currentUser) {
    return null;
  }
  const membership = currentUser.memberships.find(
    (item) => item.organizationSlug === DEFAULT_TENANT_SLUG,
  );
  const localRole = currentUser.isSuperAdmin
    ? "superadmin"
    : normalizeMembershipRole(membership?.role);
  if (!localRole) {
    return null;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const clerkRole = roleFromPublicMetadata(user.publicMetadata);
  return clerkRole === localRole ? clerkRole : null;
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
    if (!resolvedToken) {
      return { hasAccess: false, isAdmin: false, role: null };
    }

    try {
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
        (item) => item.organizationSlug === DEFAULT_TENANT_SLUG,
      );
      const role = normalizeMembershipRole(membership?.role);
      return {
        hasAccess: Boolean(role),
        isAdmin: role === "admin" || role === "superadmin",
        role,
      };
    } catch {
      return { hasAccess: false, isAdmin: false, role: null };
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
