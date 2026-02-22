import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { hasOrgAdminAccess } from "./lib/permissions";

const roleValidator = v.union(
  v.literal("superadmin"),
  v.literal("admin"),
  v.literal("coach"),
  v.literal("member"),
);

const membershipValidator = v.object({
  _id: v.id("organizationMembers"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  clerkMembershipId: v.string(),
  role: roleValidator,
  createdAt: v.optional(v.number()),
});

function formatOrganizationNameFromSlug(slug: string) {
  return slug
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

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
        clerkId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
        isSuperAdmin: v.boolean(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const isAdmin = await hasOrgAdminAccess(
      ctx,
      currentUser._id,
      args.organizationId,
    );

    if (!isAdmin) {
      return [];
    }

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const userIds = [...new Set(memberships.map((membership) => membership.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(users.filter(Boolean).map((user) => [user!._id, user!]));

    return memberships.flatMap((membership) => {
      const user = userMap.get(membership.userId);
      if (!user || !user.isActive) {
        return [];
      }

      return [
        {
          membership,
          user: {
            _id: user._id,
            clerkId: user.clerkId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            ...(user.imageUrl ? { imageUrl: user.imageUrl } : {}),
            isSuperAdmin: user.isSuperAdmin,
          },
        },
      ];
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

    const organizationIds = [
      ...new Set(memberships.map((membership) => membership.organizationId)),
    ];
    const organizations = await Promise.all(
      organizationIds.map((id) => ctx.db.get(id)),
    );
    const organizationMap = new Map(
      organizations.filter(Boolean).map((organization) => [organization!._id, organization!]),
    );

    return memberships.map((membership) => {
      const organization = organizationMap.get(membership.organizationId);
      return {
        membership,
        organization: organization
          ? {
              _id: organization._id,
              name: organization.name,
              slug: organization.slug,
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
function clerkRoleToRole(
  clerkRole: string,
): "superadmin" | "admin" | "coach" {
  switch (clerkRole) {
    case "org:superadmin":
      return "superadmin";
    case "org:admin":
      return "admin";
    case "org:member":
    default:
      return "coach";
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

    let user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", clerkUserId))
      .unique();

    if (!user) {
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
        imageUrl: userData.image_url ?? undefined,
        isActive: true,
        isSuperAdmin: false,
      });

      user = await ctx.db.get(userId);
      if (!user) {
        console.error(`Failed to create user for clerkId: ${clerkUserId}`);
        return null;
      }
    }

    let organization = await ctx.db
      .query("organizations")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
      .unique();

    if (!organization) {
      const organizationData = data.organization;
      if (!organizationData) {
        console.error(
          `Organization data missing in membership webhook for clerkOrgId: ${clerkOrgId}`,
        );
        return null;
      }

      const organizationId = await ctx.db.insert("organizations", {
        clerkOrgId: organizationData.id,
        name: organizationData.name,
        slug: organizationData.slug ?? organizationData.id,
        imageUrl: organizationData.image_url ?? undefined,
      });

      organization = await ctx.db.get(organizationId);
      if (!organization) {
        console.error(
          `Failed to create organization for clerkOrgId: ${clerkOrgId}`,
        );
        return null;
      }
    }

    const role = clerkRoleToRole(clerkRole);

    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("byClerkMembershipId", (q) =>
        q.eq("clerkMembershipId", clerkMembershipId),
      )
      .unique();

    if (existing) {
      if (existing.role !== role) {
        await ctx.db.patch(existing._id, { role });
      }
      return existing._id;
    }

    const existingByUserOrg = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("userId", user._id).eq("organizationId", organization._id),
      )
      .unique();

    if (existingByUserOrg) {
      await ctx.db.patch(existingByUserOrg._id, {
        clerkMembershipId,
        role,
      });
      return existingByUserOrg._id;
    }

    return await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId: organization._id,
      clerkMembershipId,
      role,
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

/**
 * Upsert a user's membership for single-tenant mode based on user metadata.
 */
export const upsertFromSingleTenant = internalMutation({
  args: {
    clerkUserId: v.string(),
    organizationSlug: v.string(),
    role: roleValidator,
  },
  returns: v.union(v.id("organizationMembers"), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();
    if (!user) {
      return null;
    }

    const role = args.role === "member" ? "coach" : args.role;
    const resolvedRole = user.isSuperAdmin ? "superadmin" : role;

    let organization = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.organizationSlug))
      .unique();

    if (!organization) {
      const organizationId = await ctx.db.insert("organizations", {
        clerkOrgId: `single:${args.organizationSlug}`,
        name: formatOrganizationNameFromSlug(args.organizationSlug),
        slug: args.organizationSlug,
      });
      organization = await ctx.db.get(organizationId);
      if (!organization) {
        return null;
      }
    }

    const syntheticMembershipId = `single:${args.clerkUserId}:${organization._id}`;
    const existingBySyntheticId = await ctx.db
      .query("organizationMembers")
      .withIndex("byClerkMembershipId", (q) =>
        q.eq("clerkMembershipId", syntheticMembershipId),
      )
      .unique();

    if (existingBySyntheticId) {
      if (existingBySyntheticId.role !== resolvedRole) {
        await ctx.db.patch(existingBySyntheticId._id, { role: resolvedRole });
      }
      return existingBySyntheticId._id;
    }

    const existingByUserOrg = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("userId", user._id).eq("organizationId", organization._id),
      )
      .unique();

    if (existingByUserOrg) {
      await ctx.db.patch(existingByUserOrg._id, {
        role: resolvedRole,
        clerkMembershipId: syntheticMembershipId,
      });
      return existingByUserOrg._id;
    }

    return await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId: organization._id,
      clerkMembershipId: syntheticMembershipId,
      role: resolvedRole,
    });
  },
});
