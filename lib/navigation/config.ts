import {
  HomeIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/20/solid";
import type { UserRole } from "@/lib/auth/types";
import type { RoleNavigationConfig } from "@/lib/navigation/types";

/**
 * =============================================================================
 * CONFIGURACIÓN DE NAVEGACIÓN
 * =============================================================================
 */
export const NAVIGATION_CONFIG: Record<UserRole, RoleNavigationConfig> = {
  admin: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
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
      label: "Events",
      icon: CalendarIcon,
      href: "events",
    },
    {
      label: "Settings",
      icon: Cog6ToothIcon,
      href: "settings",
    },
  ],

  staff: [
    {
      label: "Dashboard",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "Events",
      icon: CalendarIcon,
      href: "events",
    },
    {
      label: "Members",
      icon: UserGroupIcon,
      href: "members",
    },
    {
      label: "Reports",
      icon: DocumentTextIcon,
      href: "reports",
    },
  ],

  member: [
    {
      label: "Home",
      icon: HomeIcon,
      href: "",
    },
    {
      label: "My Events",
      icon: CalendarIcon,
      href: "events",
    },
    {
      label: "Achievements",
      icon: TrophyIcon,
      href: "achievements",
    },
    {
      label: "Profile",
      icon: Cog6ToothIcon,
      href: "profile",
    },
  ],
};
