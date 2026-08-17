import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function revokeOrganizationAccess(
  ctx: MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
) {
  const [membership, staffAssignments] = await Promise.all([
    ctx.db
      .query("organizationMembers")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("userId", userId).eq("organizationId", organizationId),
      )
      .unique(),
    ctx.db
      .query("staff")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect(),
  ]);

  for (const assignment of staffAssignments) {
    const club = await ctx.db.get(assignment.clubId);
    if (club?.organizationId === organizationId) {
      await ctx.db.delete(assignment._id);
    }
  }

  if (membership) {
    await ctx.db.delete(membership._id);
  }
}

export async function revokeAllUserAccess(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const [memberships, staffAssignments] = await Promise.all([
    ctx.db
      .query("organizationMembers")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("staff")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect(),
  ]);

  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }
  for (const assignment of staffAssignments) {
    await ctx.db.delete(assignment._id);
  }
}
