// lib/role-utils.ts
import type { UserIdentity } from "convex/server";

export type FutbolYaRole = 'superadmin' | 'admin' | 'entrenador' | 'arbitro' | 'jugador' | 'pending';

// Define a type for the relevant part of sessionClaims, allowing both cases
type ClaimsWithPublicMetadata = {
    publicMetadata?: { // camelCase
        futbolYaRole?: string;
        [key: string]: any;
    };
    public_metadata?: { // snake_case
        futbolYaRole?: string;
        [key: string]: any;
    };
    [key: string]: any; // Allow other top-level claims
} | null | undefined;


export function extractFutbolYaRole(
    identityOrClaims: UserIdentity | ClaimsWithPublicMetadata
): FutbolYaRole | undefined {
    if (!identityOrClaims) {
        return undefined;
    }

    let role: string | undefined | null = undefined;

    // --- CHECK BOTH CASES ---
    // Prefer public_metadata if available (matches JWT template screenshot)
    const metaData = (identityOrClaims as any).public_metadata || (identityOrClaims as any).publicMetadata;

    if (metaData && typeof metaData === 'object') {
        role = metaData.futbolYaRole;
    }
    // --- END CHECK ---


    // Fallback check for potentially flattened property (less likely but safe)
    if (!role && 'futbolYaRole' in identityOrClaims) {
         role = (identityOrClaims as any).futbolYaRole;
    }

    // Validate against known roles before returning
    const validRoles: FutbolYaRole[] = ['superadmin', 'admin', 'entrenador', 'arbitro', 'jugador', 'pending'];
    if (role && validRoles.includes(role as FutbolYaRole)) {
        return role as FutbolYaRole;
    }

    console.warn("Could not extract valid FutbolYaRole. Found:", role, "Input Object:", identityOrClaims); // Added warning
    return undefined; // Default if no valid role found
}

export function isSuperAdmin(userRole?: FutbolYaRole): boolean {
    return userRole === 'superadmin';
}

export function isAdminOrSuperAdmin(userRole?: FutbolYaRole): boolean {
    return userRole === 'admin' || userRole === 'superadmin';
}