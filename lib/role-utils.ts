// lib/role-utils.ts

// Define the roles for the FutbolYa application
export type FutbolYaRole = 'superadmin' | 'admin' | 'entrenador' | 'arbitro' | 'jugador';

/**
 * Extract role from any Clerk metadata object
 */
export function extractRoleFromMetadata(metadata: {
    publicMetadata?: { futbolYaRole?: string; role?: string };
}): FutbolYaRole | null {
    const publicMeta = metadata.publicMetadata || {};
    const role = publicMeta?.futbolYaRole || publicMeta?.role;
    return role as FutbolYaRole || null;
}

// You can add more role-based check functions here as needed
export function isSuperAdmin(userRole: FutbolYaRole | null): boolean {
    return userRole === 'superadmin';
}