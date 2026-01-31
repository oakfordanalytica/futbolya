"use client";

import { useAuth } from "@clerk/nextjs";

/**
 * Hook to check if the current user has admin privileges.
 * Checks for both org:admin and org:superadmin roles.
 *
 * @returns Object containing isAdmin boolean and loading state
 */
export function useIsAdmin() {
  const { has, isLoaded } = useAuth();

  const isSuperAdmin = has?.({ role: "org:superadmin" }) ?? false;
  const isOrgAdmin = has?.({ role: "org:admin" }) ?? false;
  const isAdmin = isOrgAdmin || isSuperAdmin;

  return {
    isAdmin,
    isSuperAdmin,
    isOrgAdmin,
    isLoaded,
  };
}
