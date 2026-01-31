import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

const roleValidator = v.union(
  v.literal("superadmin"),
  v.literal("admin"),
  v.literal("member"),
);

const membershipValidator = v.object({
  _id: v.id("organizationMembers"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  clerkMembershipId: v.string(),
  role: roleValidator,
  createdAt: v.number(),
});

/**
 * Get membership by user and organization.
 */
export const getByUserAndOrg = query({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.union(membershipValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizationMembers")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .unique();
  },
});

/**
 * Get all memberships for an organization.
 */
export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      membership: membershipValidator,
      user: v.object({
        _id: v.id("users"),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    // Batch fetch all users at once to avoid N+1
    const userIds = [...new Set(memberships.map((m) => m.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u!]));

    return memberships.map((membership) => {
      const user = userMap.get(membership.userId);
      return {
        membership,
        user: user
          ? {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            }
          : {
              _id: membership.userId,
              firstName: "",
              lastName: "",
              email: "",
            },
      };
    });
  },
});

/**
 * Get all memberships for a user.
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      membership: membershipValidator,
      organization: v.object({
        _id: v.id("organizations"),
        name: v.string(),
        slug: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect();

    // Batch fetch all organizations at once to avoid N+1
    const orgIds = [...new Set(memberships.map((m) => m.organizationId))];
    const orgs = await Promise.all(orgIds.map((id) => ctx.db.get(id)));
    const orgMap = new Map(orgs.filter(Boolean).map((o) => [o!._id, o!]));

    return memberships.map((membership) => {
      const org = orgMap.get(membership.organizationId);
      return {
        membership,
        organization: org
          ? {
              _id: org._id,
              name: org.name,
              slug: org.slug,
            }
          : {
              _id: membership.organizationId,
              name: "",
              slug: "",
            },
      };
    });
  },
});

/**
 * Convert Clerk role string to our role type.
 */
function clerkRoleToRole(clerkRole: string): "superadmin" | "admin" | "member" {
  switch (clerkRole) {
    case "org:superadmin":
      return "superadmin";
    case "org:admin":
      return "admin";
    case "org:member":
    default:
      return "member";
  }
}

/**
 * Upsert organization membership from Clerk webhook (internal).
 */
export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  returns: v.union(v.id("organizationMembers"), v.null()),
  handler: async (ctx, { data }) => {
    const clerkMembershipId = data.id;
    const clerkUserId = data.public_user_data?.user_id;
    const clerkOrgId = data.organization?.id;
    const clerkRole = data.role;

    if (!clerkUserId || !clerkOrgId) {
      console.error("Missing user_id or organization.id in membership data");
      return null;
    }

    // Find or create user
    let user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", clerkUserId))
      .unique();

    if (!user) {
      // User webhook hasn't arrived yet - create user from membership data
      const userData = data.public_user_data;
      if (!userData) {
        console.error(
          `User data missing in membership webhook for clerkId: ${clerkUserId}`,
        );
        return null;
      }

      const userId = await ctx.db.insert("users", {
        clerkId: clerkUserId,
        email: userData.identifier ?? "",
        firstName: userData.first_name ?? "",
        lastName: userData.last_name ?? "",
        isActive: true,
        isSuperAdmin: false,
      });

      user = await ctx.db.get(userId);
      if (!user) {
        console.error(`Failed to create user for clerkId: ${clerkUserId}`);
        return null;
      }
    }

    // Find or create organization
    let organization = await ctx.db
      .query("organizations")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
      .unique();

    if (!organization) {
      // Organization webhook hasn't arrived yet - create org from membership data
      const orgData = data.organization;
      if (!orgData) {
        console.error(
          `Organization data missing in membership webhook for clerkOrgId: ${clerkOrgId}`,
        );
        return null;
      }

      const orgId = await ctx.db.insert("organizations", {
        clerkOrgId: orgData.id,
        name: orgData.name,
        slug: orgData.slug ?? orgData.id,
        imageUrl: orgData.image_url ?? undefined,
        createdAt: Date.now(),
      });

      organization = await ctx.db.get(orgId);
      if (!organization) {
        console.error(
          `Failed to create organization for clerkOrgId: ${clerkOrgId}`,
        );
        return null;
      }
    }

    const role = clerkRoleToRole(clerkRole);

    // Check if membership already exists
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("byClerkMembershipId", (q) =>
        q.eq("clerkMembershipId", clerkMembershipId),
      )
      .unique();

    if (existing) {
      // Update role if changed
      if (existing.role !== role) {
        await ctx.db.patch(existing._id, { role });
      }
      return existing._id;
    }

    // Also check by user and org to prevent duplicates
    const existingByUserOrg = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("userId", user._id).eq("organizationId", organization._id),
      )
      .unique();

    if (existingByUserOrg) {
      // Update with clerk membership id and role
      await ctx.db.patch(existingByUserOrg._id, {
        clerkMembershipId,
        role,
      });
      return existingByUserOrg._id;
    }

    // Create new membership
    return await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId: organization._id,
      clerkMembershipId,
      role,
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete organization membership from Clerk webhook (internal).
 */
export const deleteFromClerk = internalMutation({
  args: { data: v.any() },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const clerkMembershipId = data.id;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("byClerkMembershipId", (q) =>
        q.eq("clerkMembershipId", clerkMembershipId),
      )
      .unique();

    if (membership) {
      await ctx.db.delete(membership._id);
    }

    return null;
  },
});
