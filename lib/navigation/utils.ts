import type { RoleNavigationConfig } from "./types";
import type { UserRole, HasRoleFunction } from "../auth/types";
import { getUserRole, getRoleBasePath } from "../auth/auth";
import { NAVIGATION_CONFIG } from "./config";

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
export function getNavigationForRole(role: UserRole): RoleNavigationConfig {
  return NAVIGATION_CONFIG[role];
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
 * buildNavUrl("cpca-sports", "admin", "settings")
 * // Returns: "/cpca-sports/admin/settings"
 *
 * buildNavUrl("cpca-sports", "admin", "")
 * // Returns: "/cpca-sports/admin"
 * ```
 */
export function buildNavUrl(
  orgSlug: string,
  role: UserRole,
  path: string = "",
): string {
  const basePath = getRoleBasePath(orgSlug, role);
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
 * @param hasRole - Función has() de Clerk
 * @returns Objeto con rol y configuración de navegación
 */
export function getNavigationContext(
  orgSlug: string,
  hasRole: HasRoleFunction,
) {
  const role = getUserRole(hasRole);

  if (!role) {
    return { role: null, navItems: [] };
  }

  return {
    role,
    navItems: getNavigationForRole(role),
  };
}
