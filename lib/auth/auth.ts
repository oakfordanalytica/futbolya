import type { UserRole, HasRoleFunction } from "@/lib/auth/types";
import { CLERK_ROLES } from "@/lib/auth/types";

/**
 * Determina el rol del usuario desde Clerk
 * @param hasRole - Función has() de Clerk auth
 * @returns El rol del usuario o null
 *
 * @example
 * ```ts
 * const { has } = await auth();
 * const role = getUserRole(has);
 * // role: "admin" | "staff" | "member" | null
 * ```
 */
export function getUserRole(hasRole: HasRoleFunction): UserRole | null {
  // Orden de prioridad: admin > staff > member
  if (hasRole({ role: CLERK_ROLES.ADMIN })) return "admin";
  if (hasRole({ role: CLERK_ROLES.STAFF })) return "staff";
  if (hasRole({ role: CLERK_ROLES.MEMBER })) return "member";

  return null;
}

/**
 * Construye la ruta base de un rol específico
 * @param orgSlug - Slug de la organización
 * @param role - Rol del usuario
 * @returns Ruta base del rol
 *
 * @example
 * ```ts
 * getRoleBasePath("cpca-sports", "admin")
 * // Returns: "/cpca-sports/admin"
 * ```
 */
export function getRoleBasePath(orgSlug: string, role: UserRole): string {
  return `/${orgSlug}/${role}`;
}

/**
 * Determina la ruta de destino según el rol del usuario en la organización
 * @param orgSlug - El slug de la organización
 * @param hasRole - Función has() de Clerk auth para verificar roles
 * @returns La ruta completa hacia donde redirigir al usuario
 */
export function getRouteByRole(
  orgSlug: string,
  hasRole: HasRoleFunction,
): string {
  const role = getUserRole(hasRole);
  return role ? getRoleBasePath(orgSlug, role) : `/${orgSlug}/apply`;
}
