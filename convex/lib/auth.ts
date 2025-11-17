import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import type { UserIdentity } from "convex/server";

// Helper to get the full identity and profile
export async function getFullIdentity(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  identity: UserIdentity,
) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!profile) {
    throw new Error("User profile not found. Webhook might be delayed.");
  }
  return profile;
}

/**
 * The BE version of getOrgRole. It queries the DB, not session claims.
 */
export const getOrgRole = async (
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  identity: UserIdentity,
  orgSlug: string,
) => {
  const profile = await getFullIdentity(ctx, identity);

  // 1. Check if the org is a League
  const league = await ctx.db
    .query("leagues")
    .withIndex("by_slug", (q) => q.eq("slug", orgSlug))
    .unique();

  if (league) {
    const assignment = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_organizationId", (q) =>
        q.eq("profileId", profile._id).eq("organizationId", league._id),
      )
      .first();

    if (assignment && assignment.organizationType === "league") {
      return {
        organization: league,
        role: assignment.role,
        type: "league" as const,
      };
    }
  }

  // 2. Check if the org is a Club
  const club = await ctx.db
    .query("clubs")
    .withIndex("by_slug", (q) => q.eq("slug", orgSlug))
    .unique();

  if (club) {
    const assignment = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_organizationId", (q) =>
        q.eq("profileId", profile._id).eq("organizationId", club._id),
      )
      .first();

    if (assignment && assignment.organizationType === "club") {
      return {
        organization: club,
        role: assignment.role,
        type: "club" as const,
      };
    }
  }
  
  return null;
};