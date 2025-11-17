import type { ForwardRefExoticComponent, SVGProps } from "react";
import type { AppRole } from "@/convex/lib/auth_types";

/**
 * Item de navegación en el sidebar
 */
export type NavItem = {
  /** Texto a mostrar */
  label: string;
  /** Icono de Heroicons */
  icon: ForwardRefExoticComponent<SVGProps<SVGSVGElement>>;
  /**
   * Ruta relativa al contexto del rol
   * @example
   * "" -> /:slug/admin
   * "users" -> /:slug/admin/users
   * "settings" -> /:slug/admin/settings
   */
  href: string;
};

/**
 * Configuración de navegación para un rol
 */
export type RoleNavigationConfig = NavItem[];

/**
 * Contexto de navegación completo
 */
export type NavigationContext = {
  role: AppRole | null;
  navItems: NavItem[];
  basePath: string;
};