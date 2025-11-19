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
  ShieldCheckIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  GlobeAmericasIcon,
} from "@heroicons/react/24/outline";

export function getNavigationContext(
  orgSlug: string,
  role: AppRole | null,
  orgType?: "league" | "club" | null
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

  // Base path depends on whether we are in an org context or global
  const basePath = orgSlug ? `/${orgSlug}/${roleBasePaths[role]}` : "/admin";

  // 1. SUPER ADMIN LOGIC
  if (role === "SuperAdmin") {
    // If SuperAdmin is inside a specific Organization, show that Org's menu + Global Back Link
    if (orgSlug && orgType) {
      // const globalLink = { 
      //   label: "Global Dashboard", 
      //   href: "/admin", 
      //   icon: GlobeAmericasIcon 
      // };

      if (orgType === "league") {
        return {
          role,
          basePath: basePath, 
          navItems: [
            // globalLink,
            { label: "Dashboard", href: "", icon: HomeIcon },
            { label: "Clubs", href: "clubs", icon: BuildingOfficeIcon },
            { label: "Tournaments", href: "tournaments", icon: TrophyIcon },
            { label: "Divisions", href: "divisions", icon: ChartBarIcon },
            { label: "Referees", href: "referees", icon: ShieldCheckIcon },
            { label: "Settings", href: "settings", icon: Cog6ToothIcon },
          ],
        };
      }

      if (orgType === "club") {
        return {
          role,
          basePath: basePath,
          navItems: [
            // globalLink,
            { label: "Dashboard", href: "", icon: HomeIcon },
            { label: "Matches", href: "matches", icon: CalendarIcon },
            { label: "Players", href: "players", icon: UserGroupIcon },
            { label: "Staff", href: "staff", icon: UsersIcon },
            { label: "Categories", href: "categories", icon: TrophyIcon },
            { label: "Settings", href: "settings", icon: Cog6ToothIcon },
          ],
        };
      }
    }

    // Default SuperAdmin Global View (No Org selected)
    return {
      role,
      basePath: basePath,
      navItems: [
        { label: "Global Dashboard", href: "", icon: HomeIcon },
        { label: "Leagues", href: "leagues", icon: TrophyIcon },
        { label: "Clubs", href: "clubs", icon: BuildingOfficeIcon },
        { label: "Global Users", href: "users", icon: UsersIcon },
      ],
    };
  }

  // 2. LEAGUE ADMIN
  if (role === "LeagueAdmin") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "Clubs", href: "clubs", icon: BuildingOfficeIcon },
        { label: "Tournaments", href: "tournaments", icon: TrophyIcon },
        { label: "Divisions", href: "divisions", icon: ChartBarIcon },
        { label: "Referees", href: "referees", icon: ShieldCheckIcon },
        { label: "Settings", href: "settings", icon: Cog6ToothIcon },
      ],
    };
  }

  // 3. CLUB ADMIN
  if (role === "ClubAdmin") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "Matches", href: "matches", icon: CalendarIcon },
        { label: "Players", href: "players", icon: UserGroupIcon },
        { label: "Staff", href: "staff", icon: UsersIcon },
        { label: "Categories", href: "categories", icon: TrophyIcon },
        { label: "Settings", href: "settings", icon: Cog6ToothIcon },
      ],
    };
  }

  // 4. TECHNICAL DIRECTOR
  if (role === "TechnicalDirector") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "My Team", href: "players", icon: UserGroupIcon }, // View their squad
        { label: "Matches", href: "matches", icon: CalendarIcon },
        { label: "Training", href: "training", icon: ClipboardDocumentCheckIcon },
      ],
    };
  }

  // 5. PLAYER NAVIGATION
  if (role === "Player") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "My Matches", href: "matches", icon: CalendarIcon },
        { label: "Profile", href: "profile", icon: UsersIcon },
      ],
    };
  }

  // 6. REFEREE NAVIGATION
  if (role === "Referee") {
    return {
      role,
      basePath,
      navItems: [
        { label: "Dashboard", href: "", icon: HomeIcon },
        { label: "Assignments", href: "matches", icon: CalendarIcon }, // Matches they are assigned to
        { label: "Reports", href: "reports", icon: ClipboardDocumentCheckIcon },
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