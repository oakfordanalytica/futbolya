// lib/role-utils.ts

// Define the roles for the FutbolYa application
export type FutbolYaRole = 'superadmin' | 'admin' | 'entrenador' | 'arbitro' | 'jugador';

/**
 * Extract role from any Clerk metadata object
 */
export function extractRoleFromMetadata(metadata: {
    publicMetadata?: { dismissalRole?: string; role?: string; futbolYaRole?: string };
    privateMetadata?: { dismissalRole?: string; role?: string; futbolYaRole?: string };
    metadata?: { dismissalRole?: string; role?: string; futbolYaRole?: string };
    dismissalRole?: string;
    role?: string;
    futbolYaRole?: string;
}): FutbolYaRole {
    const publicMeta = metadata.publicMetadata || metadata;
    const privateMeta = metadata.privateMetadata;
    const meta = metadata.metadata;

    // Priority order for role extraction - Add futbolYaRole to the priority list
    const role = publicMeta?.futbolYaRole || 
        publicMeta?.dismissalRole ||
        publicMeta?.role ||
        privateMeta?.futbolYaRole ||
        privateMeta?.dismissalRole ||
        privateMeta?.role ||
        meta?.futbolYaRole ||
        meta?.dismissalRole ||
        meta?.role;

    return (role as FutbolYaRole) || undefined;
}

// You can add more role-based check functions here as needed
export function isSuperAdmin(userRole: FutbolYaRole | null): boolean {
    return userRole === 'superadmin';
}