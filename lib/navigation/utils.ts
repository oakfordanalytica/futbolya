import type { AppRole } from "@/convex/lib/auth_types";
import type { NavItem, NavigationContext } from "./types";
import {
  HomeIcon,
  UsersIcon,
  TrophyIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

/**
 * Get navigation items based on role
 */
export function getNavigationContext(
  orgSlug: string,
  role: AppRole | null,
): NavigationContext {
  if (!role) {
    return { role: null, navItems: [], basePath: "" };
  }

  const roleBasePaths: Record<AppRole, string> = {
    SuperAdmin: "admin",
    LeagueAdmin: "admin",
    ClubAdmin: "admin",
    TechnicalDirector: "coach",
    Player: "player",
    Referee: "referee",
  };

  const basePath = `/${orgSlug}/${roleBasePaths[role]}`;

  // SuperAdmin and LeagueAdmin navigation (League context)
  if (role === "SuperAdmin" || role === "LeagueAdmin") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "Clubs", href: "clubs", icon: BuildingOfficeIcon },
        { label: "Divisions", href: "divisions", icon: ChartBarIcon },
        { label: "Categories", href: "categories", icon: TrophyIcon },
        { label: "Users", href: "users", icon: UsersIcon },
        { label: "Settings", href: "settings", icon: Cog6ToothIcon },
      ],
    };
  }

  // ClubAdmin navigation (Club context)
  if (role === "ClubAdmin") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "Players", href: "players", icon: UserGroupIcon },
        { label: "Staff", href: "staff", icon: UsersIcon },
        { label: "Categories", href: "categories", icon: TrophyIcon },
        { label: "Users", href: "users", icon: UsersIcon },
        { label: "Settings", href: "settings", icon: Cog6ToothIcon },
      ],
    };
  }

  // TechnicalDirector navigation
  if (role === "TechnicalDirector") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "My Categories", href: "categories", icon: TrophyIcon },
        { label: "Players", href: "players", icon: UserGroupIcon },
      ],
    };
  }

  // Player navigation
  if (role === "Player") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "My Profile", href: "profile", icon: UsersIcon },
        { label: "My Matches", href: "matches", icon: TrophyIcon },
      ],
    };
  }

  // Referee navigation
  if (role === "Referee") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "My Matches", href: "matches", icon: TrophyIcon },
      ],
    };
  }

  return { role, basePath, navItems: [] };
}

/**
 * Build full navigation URL
 */
export function buildNavUrl(basePath: string, itemHref: string): string {
  if (itemHref === "") {
    return basePath;
  }
  const cleanHref = itemHref.startsWith("/") ? itemHref.slice(1) : itemHref;
  return `${basePath}/${cleanHref}`;
}

/**
 * Check if navigation item is active
 */
export function isNavItemActive(
  currentPath: string,
  itemHref: string,
  isIndex: boolean = false,
): boolean {
  if (isIndex) {
    // For index routes, match exactly or with trailing slash
    return currentPath === itemHref || currentPath === `${itemHref}/`;
  }

  // For other routes, check if current path starts with item href
  return currentPath.startsWith(itemHref);
}