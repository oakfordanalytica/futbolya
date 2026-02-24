export const ENABLED_STAFF_ROLES = ["head_coach"] as const;

export type EnabledStaffRole = (typeof ENABLED_STAFF_ROLES)[number];

const enabledStaffRolesSet = new Set<string>(ENABLED_STAFF_ROLES);

export function isEnabledStaffRole(value: unknown): value is EnabledStaffRole {
  return typeof value === "string" && enabledStaffRolesSet.has(value);
}
