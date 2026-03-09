"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  isAdminFromSessionClaims,
  isSuperAdminFromSessionClaims,
  roleFromSessionClaims,
} from "@/lib/auth/roles";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";

const SINGLE_TENANT_MODE = isSingleTenantMode();

/**
 * Hook to check if the current user has admin privileges.
 * Checks for both org:admin and org:superadmin roles.
 *
 * @returns Object containing isAdmin boolean and loading state
 */
export function useIsAdmin() {
  const { has, isLoaded, sessionClaims } = useAuth();
  const currentUser = useQuery(api.users.me, SINGLE_TENANT_MODE ? {} : "skip");

  if (SINGLE_TENANT_MODE) {
    const fallbackIsSuperAdmin = isSuperAdminFromSessionClaims(sessionClaims);
    const fallbackRole = roleFromSessionClaims(sessionClaims);
    const fallbackIsAdmin = isAdminFromSessionClaims(sessionClaims);

    const membership = currentUser?.memberships.find(
      (item) => item.organizationSlug === DEFAULT_TENANT_SLUG,
    );
    const currentRole = currentUser?.isSuperAdmin
      ? "superadmin"
      : membership?.role === "superadmin" || membership?.role === "admin"
        ? membership.role
        : membership?.role === "coach" || membership?.role === "member"
          ? "coach"
          : null;

    const isSuperAdmin = currentUser?.isSuperAdmin ?? fallbackIsSuperAdmin;
    const isAdmin = currentUser
      ? isSuperAdmin ||
        membership?.role === "admin" ||
        membership?.role === "superadmin"
      : fallbackIsAdmin;

    return {
      isAdmin,
      isSuperAdmin,
      isOrgAdmin: false,
      role: currentRole ?? fallbackRole,
      isLoaded,
    };
  }

  const isSuperAdmin = has?.({ role: "org:superadmin" }) ?? false;
  const isOrgAdmin = has?.({ role: "org:admin" }) ?? false;
  const isAdmin = isOrgAdmin || isSuperAdmin;

  return {
    isAdmin,
    isSuperAdmin,
    isOrgAdmin,
    role: isSuperAdmin ? "superadmin" : isOrgAdmin ? "admin" : null,
    isLoaded,
  };
}
