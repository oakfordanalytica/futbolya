export type AppRole = "admin" | "coach";
export type TenantRole = "superadmin" | "admin" | "coach";

export interface PendingStaffInvite {
  staffRole: string;
  clubId: string;
  categoryId?: string;
}

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

export function isClerkSnapshotStale(
  currentUpdatedAt: number | undefined,
  incomingUpdatedAt: number | undefined,
): boolean {
  return (
    currentUpdatedAt !== undefined &&
    incomingUpdatedAt !== undefined &&
    incomingUpdatedAt < currentUpdatedAt
  );
}

export function canApplyClerkUserSnapshot(
  isActive: boolean,
  currentUpdatedAt: number | undefined,
  incomingUpdatedAt: number | undefined,
): boolean {
  return (
    isActive && !isClerkSnapshotStale(currentUpdatedAt, incomingUpdatedAt)
  );
}

export function roleFromPublicMetadata(
  publicMetadata: unknown,
): TenantRole | null {
  if (!publicMetadata || typeof publicMetadata !== "object") {
    return null;
  }

  const metadata = publicMetadata as SessionMetadata;
  if (
    metadata.isSuperAdmin === true ||
    metadata.role === "superadmin" ||
    metadata.role === "org:superadmin"
  ) {
    return "superadmin";
  }

  return normalizeAppRole(metadata.role);
}

export function pendingStaffInviteFromPublicMetadata(
  publicMetadata: unknown,
): PendingStaffInvite | null {
  if (!publicMetadata || typeof publicMetadata !== "object") {
    return null;
  }

  const pendingStaff = (publicMetadata as { pendingStaff?: unknown })
    .pendingStaff;
  if (!pendingStaff || typeof pendingStaff !== "object") {
    return null;
  }

  const staffRole = (pendingStaff as { staffRole?: unknown }).staffRole;
  const clubId = (pendingStaff as { clubId?: unknown }).clubId;
  const categoryId = (pendingStaff as { categoryId?: unknown }).categoryId;

  if (typeof staffRole !== "string" || typeof clubId !== "string") {
    return null;
  }

  return {
    staffRole,
    clubId,
    ...(typeof categoryId === "string" ? { categoryId } : {}),
  };
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
