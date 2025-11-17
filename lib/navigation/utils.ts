import type { AppRole } from "@/convex/lib/auth_types";
import type { RoleNavigationConfig, NavigationContext } from "./types";
import { NAVIGATION_CONFIG, ROLE_BASE_PATHS } from "./config";

/**
 * =============================================================================
 * FUNCIONES DE NAVEGACIÓN
 * =============================================================================
 */

/**
 * Obtiene la configuración de navegación para un rol
 * @param role - Rol del usuario
 * @returns Array de items de navegación
 */
export function getNavigationForRole(role: AppRole): RoleNavigationConfig {
  return NAVIGATION_CONFIG[role];
}

/**
 * Obtiene la ruta base para un rol
 * @param role - Rol del usuario
 * @returns Segmento de ruta (admin, coach, player, referee)
 */
export function getRoleBasePath(role: AppRole): string {
  return ROLE_BASE_PATHS[role];
}

/**
 * Construye una URL completa para navegación
 * @param orgSlug - Slug de la organización
 * @param role - Rol del usuario
 * @param path - Ruta relativa (opcional)
 * @returns URL completa
 *
 * @example
 * ```ts
 * buildNavUrl("liga-del-valle", "LeagueAdmin", "users")
 * // Returns: "/liga-del-valle/admin/users"
 *
 * buildNavUrl("liga-del-valle", "Player", "")
 * // Returns: "/liga-del-valle/player"
 * ```
 */
export function buildNavUrl(
  orgSlug: string,
  role: AppRole,
  path: string = "",
): string {
  const roleBase = getRoleBasePath(role);
  const basePath = `/${orgSlug}/${roleBase}`;
  return path ? `${basePath}/${path}` : basePath;
}

/**
 * Verifica si una ruta de navegación está activa
 * @param currentPathname - Pathname actual
 * @param itemUrl - URL del item de navegación
 * @param isHome - Si es la ruta home del rol
 * @returns true si está activa
 */
export function isNavItemActive(
  currentPathname: string,
  itemUrl: string,
  isHome: boolean,
): boolean {
  if (isHome) {
    // Para home: comparación exacta
    return currentPathname === itemUrl;
  }
  // Para otras rutas: coincidencia por prefijo
  return currentPathname.startsWith(itemUrl);
}

/**
 * Obtiene toda la información de navegación necesaria para el sidebar
 * @param orgSlug - Slug de la organización
 * @param role - Rol del usuario en la organización actual
 * @returns Objeto con contexto de navegación completo
 */
export function getNavigationContext(
  orgSlug: string,
  role: AppRole | null,
): NavigationContext {
  if (!role) {
    return {
      role: null,
      navItems: [],
      basePath: "",
    };
  }

  const roleBase = getRoleBasePath(role);
  const basePath = `/${orgSlug}/${roleBase}`;

  return {
    role,
    navItems: getNavigationForRole(role),
    basePath,
  };
}