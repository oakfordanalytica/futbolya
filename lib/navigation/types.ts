import type { ForwardRefExoticComponent, SVGProps } from "react";

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
   * "" -> /:slug/:role
   * "settings" -> /:slug/:role/settings
   * "users/manage" -> /:slug/:role/users/manage
   */
  href: string;
};

/**
 * Configuración de navegación para un rol
 */
export type RoleNavigationConfig = NavItem[];
