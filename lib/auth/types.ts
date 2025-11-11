/**
 * Roles de organización disponibles en la aplicación
 * Estos deben coincidir con los roles configurados en Clerk
 */
export type UserRole = "admin" | "staff" | "member";

/**
 * Mapeo de roles de Clerk a roles de la aplicación
 */
export const CLERK_ROLES = {
  ADMIN: "org:admin",
  STAFF: "org:staff",
  MEMBER: "org:member",
} as const;

/**
 * Función de verificación de roles de Clerk
 */
export type HasRoleFunction = (params: { role: string }) => boolean;
