export type AppRole = "admin" | "coach";
export type TenantRole = "superadmin" | "admin" | "coach";

interface SessionMetadata {
  role?: unknown;
  isSuperAdmin?: unknown;
}

function mergeSessionMetadata(sessionClaims: unknown): SessionMetadata | null {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;
  const candidates = [
    claims.metadata,
    claims.publicMetadata,
    claims.privateMetadata,
    claims.public_metadata,
    claims.private_metadata,
  ];

  const merged: SessionMetadata = {};
  let hasMetadata = false;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    Object.assign(merged, candidate);
    hasMetadata = true;
  }

  return hasMetadata ? merged : null;
}

function normalizeAppRole(role: unknown): AppRole | null {
  if (role === "admin" || role === "org:admin" || role === "org:superadmin") {
    return "admin";
  }

  if (role === "coach" || role === "member" || role === "org:member") {
    return "coach";
  }

  return null;
}

export function getAppRoleFromSessionClaims(
  sessionClaims: unknown,
): AppRole | null {
  const metadata = mergeSessionMetadata(sessionClaims);
  return normalizeAppRole(metadata?.role);
}

export function isSuperAdminFromSessionClaims(sessionClaims: unknown): boolean {
  const metadata = mergeSessionMetadata(sessionClaims);
  return metadata?.isSuperAdmin === true;
}

export function isAdminFromSessionClaims(sessionClaims: unknown): boolean {
  return (
    isSuperAdminFromSessionClaims(sessionClaims) ||
    getAppRoleFromSessionClaims(sessionClaims) === "admin"
  );
}

export function roleFromSessionClaims(
  sessionClaims: unknown,
): TenantRole | null {
  if (isSuperAdminFromSessionClaims(sessionClaims)) {
    return "superadmin";
  }

  const role = getAppRoleFromSessionClaims(sessionClaims);
  if (role === "admin") {
    return "admin";
  }

  if (role === "coach") {
    return "coach";
  }

  return null;
}

export function hasSingleTenantAccessFromSessionClaims(
  sessionClaims: unknown,
): boolean {
  return roleFromSessionClaims(sessionClaims) !== null;
}
