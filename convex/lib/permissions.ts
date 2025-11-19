import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function requireClubAccess(
  ctx: QueryCtx | MutationCtx,
  clubId: Id<"clubs">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  // 1. Check Global SuperAdmin (via DB lookup for accuracy)
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
    
  if (!profile) throw new Error("Profile not found");

  const superAdminRole = await ctx.db
    .query("roleAssignments")
    .withIndex("by_profileId_and_role", (q) => 
      q.eq("profileId", profile._id).eq("role", "SuperAdmin")
    )
    .first();

  if (superAdminRole) return true; // Access granted

  // 2. Check Club Admin
  const clubRole = await ctx.db
    .query("roleAssignments")
    .withIndex("by_profileId_and_organizationId", (q) =>
      q.eq("profileId", profile._id).eq("organizationId", clubId)
    )
    .first();

  if (clubRole?.role === "ClubAdmin") return true;

  // League Admins usually DO NOT manage internal club data (players/cats)
  // so we return false or throw.
  throw new Error("You do not have permission to manage this club's data");
}