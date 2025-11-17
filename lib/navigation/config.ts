import {
  HomeIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/20/solid";
import type { AppRole } from "@/convex/lib/auth_types";
import type { RoleNavigationConfig } from "./types";

/**
 * =============================================================================
 * CONFIGURACIÓN DE NAVEGACIÓN POR ROL
 * =============================================================================
 */

export const NAVIGATION_CONFIG: Record<AppRole, RoleNavigationConfig> = {
  /**
   * SuperAdmin - Acceso completo a toda la plataforma
   */
  SuperAdmin: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "Leagues",
      icon: ShieldCheckIcon,
      href: "leagues",
    },
    {
      label: "Users",
      icon: UsersIcon,
      href: "users",
    },
    {
      label: "Analytics",
      icon: ChartBarIcon,
      href: "analytics",
    },
    {
      label: "Settings",
      icon: Cog6ToothIcon,
      href: "settings",
    },
  ],

  /**
   * LeagueAdmin - Gestión de liga completa
   */
  LeagueAdmin: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "Clubs",
      icon: BuildingOfficeIcon,
      href: "clubs",
    },
    {
      label: "Users",
      icon: UsersIcon,
      href: "users",
    },
    {
      label: "Categories",
      icon: UserGroupIcon,
      href: "categories",
    },
    {
      label: "Matches",
      icon: CalendarIcon,
      href: "matches",
    },
    {
      label: "Analytics",
      icon: ChartBarIcon,
      href: "analytics",
    },
    {
      label: "Settings",
      icon: Cog6ToothIcon,
      href: "settings",
    },
  ],

  /**
   * ClubAdmin - Gestión de club
   */
  ClubAdmin: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "Players",
      icon: UsersIcon,
      href: "players",
    },
    {
      label: "Staff",
      icon: UserGroupIcon,
      href: "staff",
    },
    {
      label: "Categories",
      icon: TrophyIcon,
      href: "categories",
    },
    {
      label: "Matches",
      icon: CalendarIcon,
      href: "matches",
    },
    {
      label: "Reports",
      icon: DocumentTextIcon,
      href: "reports",
    },
    {
      label: "Settings",
      icon: Cog6ToothIcon,
      href: "settings",
    },
  ],

  /**
   * TechnicalDirector - Vista de entrenador
   */
  TechnicalDirector: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "My Teams",
      icon: UserGroupIcon,
      href: "teams",
    },
    {
      label: "Players",
      icon: UsersIcon,
      href: "players",
    },
    {
      label: "Training",
      icon: CalendarIcon,
      href: "training",
    },
    {
      label: "Matches",
      icon: TrophyIcon,
      href: "matches",
    },
    {
      label: "Reports",
      icon: DocumentTextIcon,
      href: "reports",
    },
  ],

  /**
   * Player - Vista de jugador
   */
  Player: [
    {
      label: "Home",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "My Team",
      icon: UserGroupIcon,
      href: "team",
    },
    {
      label: "Schedule",
      icon: CalendarIcon,
      href: "schedule",
    },
    {
      label: "Stats",
      icon: ChartBarIcon,
      href: "stats",
    },
    {
      label: "Profile",
      icon: Cog6ToothIcon,
      href: "profile",
    },
  ],

  /**
   * Referee - Vista de árbitro
   */
  Referee: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "My Matches",
      icon: ClipboardDocumentCheckIcon,
      href: "matches",
    },
    {
      label: "Schedule",
      icon: CalendarIcon,
      href: "schedule",
    },
    {
      label: "Reports",
      icon: DocumentTextIcon,
      href: "reports",
    },
    {
      label: "Profile",
      icon: Cog6ToothIcon,
      href: "profile",
    },
  ],
};

/**
 * Mapeo de roles a sus rutas base
 */
export const ROLE_BASE_PATHS: Record<AppRole, string> = {
  SuperAdmin: "admin",
  LeagueAdmin: "admin",
  ClubAdmin: "admin",
  TechnicalDirector: "coach",
  Player: "player",
  Referee: "referee",
};