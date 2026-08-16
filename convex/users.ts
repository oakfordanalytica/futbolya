import {
  action,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { clerkClient } from "./clerk";
import { internal } from "./_generated/api";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "./lib/tenancy";
import {
  canApplyClerkUserSnapshot,
  roleFromPublicMetadata,
} from "@/lib/auth/roles";
import { processPendingStaffInvite } from "./lib/pending_staff_invite";

type SingleTenantAppRole = "admin" | "coach";

async function requireCurrentSingleTenantAdmin(clerkUserId: string) {
  const user = await clerkClient.users.getUser(clerkUserId);
  const role = roleFromPublicMetadata(user.publicMetadata);
  if (role !== "admin" && role !== "superadmin") {
    throw new Error("Forbidden");
  }
}

/**
 * Get the current authenticated user's profile with their organization memberships.
 */
export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      isActive: v.boolean(),
      isSuperAdmin: v.boolean(),
      clerkUpdatedAt: v.optional(v.number()),
      memberships: v.array(
        v.object({
          organizationId: v.id("organizations"),
          organizationSlug: v.string(),
          organizationName: v.string(),
          role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("coach"),
            v.literal("member"),
          ),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    const organizationIds = [
      ...new Set(memberships.map((membership) => membership.organizationId)),
    ];
    const organizations = await Promise.all(
      organizationIds.map((id) => ctx.db.get(id)),
    );
    const organizationMap = new Map(
      organizations
        .filter(Boolean)
        .map((organization) => [organization!._id, organization!]),
    );

    const enrichedMemberships = memberships.map((membership) => {
      const organization = organizationMap.get(membership.organizationId);
      return {
        organizationId: membership.organizationId,
        organizationSlug: organization?.slug ?? "",
        organizationName: organization?.name ?? "",
        role: membership.role,
      };
    });

    return {
      ...user,
      memberships: enrichedMemberships,
    };
  },
});

/**
 * Self-heal the current Clerk user into Convex and reconcile access from
 * trusted Clerk invitation metadata before protected layouts resolve access.
 */
export const syncCurrentUser = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkUser = await clerkClient.users.getUser(identity.subject);

    await ctx.runMutation(internal.users.upsertFromClerk, {
      data: {
        id: clerkUser.id,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        image_url: clerkUser.imageUrl,
        profile_image_url: clerkUser.imageUrl,
        primary_email_address:
          clerkUser.primaryEmailAddress?.emailAddress ?? undefined,
        email_addresses: clerkUser.emailAddresses.map((email) => ({
          email_address: email.emailAddress,
        })),
        public_metadata: clerkUser.publicMetadata,
        updated_at: clerkUser.updatedAt,
      },
    });

    if (isSingleTenantMode()) {
      const role = roleFromPublicMetadata(clerkUser.publicMetadata);
      const accessSynced = await ctx.runMutation(
        internal.members.syncFromSingleTenant,
        {
          clerkUserId: clerkUser.id,
          organizationSlug: DEFAULT_TENANT_SLUG,
          clerkUpdatedAt: clerkUser.updatedAt,
          ...(role ? { role } : {}),
        },
      );

      if (accessSynced && role === "coach") {
        await processPendingStaffInvite({
          ctx,
          clerkUserId: clerkUser.id,
          clerkUpdatedAt: clerkUser.updatedAt,
          publicMetadata: clerkUser.publicMetadata,
        });
      }
    }

    return null;
  },
});

/**
 * Get a user by ID.
 */
export const getById = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      isActive: v.boolean(),
      isSuperAdmin: v.boolean(),
      clerkUpdatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser) {
      return null;
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return null;
    }

    if (currentUser._id === targetUser._id || currentUser.isSuperAdmin) {
      return targetUser;
    }

    const [currentMemberships, targetMemberships] = await Promise.all([
      ctx.db
        .query("organizationMembers")
        .withIndex("byUserId", (q) => q.eq("userId", currentUser._id))
        .collect(),
      ctx.db
        .query("organizationMembers")
        .withIndex("byUserId", (q) => q.eq("userId", targetUser._id))
        .collect(),
    ]);

    const currentOrganizationIds = new Set(
      currentMemberships.map((membership) => membership.organizationId),
    );
    const sharesOrganization = targetMemberships.some((membership) =>
      currentOrganizationIds.has(membership.organizationId),
    );

    return sharesOrganization ? targetUser : null;
  },
});

/**
 * Upsert user from Clerk webhook (internal).
 * Handles both user.created and user.updated events.
 * Reads isSuperAdmin from Clerk publicMetadata.
 */
export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  returns: v.id("users"),
  handler: async (ctx, { data }) => {
    const clerkId = data.id;

    const email =
      data.email_addresses?.[0]?.email_address ||
      data.primary_email_address ||
      `user_${clerkId}@temp.clerk`;

    const firstName = data.first_name || "";
    const lastName = data.last_name || "";
    const imageUrl = data.image_url || data.profile_image_url || undefined;
    const isSuperAdmin = data.public_metadata?.isSuperAdmin === true;
    const clerkUpdatedAt =
      typeof data.updated_at === "number" ? data.updated_at : undefined;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      if (
        !canApplyClerkUserSnapshot(
          existingUser.isActive,
          existingUser.clerkUpdatedAt,
          clerkUpdatedAt,
        )
      ) {
        return existingUser._id;
      }

      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        imageUrl,
        isActive: true,
        isSuperAdmin,
        ...(clerkUpdatedAt !== undefined ? { clerkUpdatedAt } : {}),
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
      isActive: true,
      isSuperAdmin,
      ...(clerkUpdatedAt !== undefined ? { clerkUpdatedAt } : {}),
    });
    return userId;
  },
});

/**
 * Get user by Clerk ID (internal).
 */
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      isActive: v.boolean(),
      isSuperAdmin: v.boolean(),
      clerkUpdatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/**
 * Deactivate user from Clerk webhook (internal).
 */
export const deactivateUser = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { isActive: false });
    }

    return null;
  },
});


/**
 * Update a user's role in single-tenant mode by writing to Clerk publicMetadata.
 * Convex membership is updated immediately to keep the UI in sync.
 */
export const setSingleTenantRole = action({
  args: {
    organizationSlug: v.string(),
    clerkUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("coach")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isSingleTenantMode()) {
      throw new Error("Single-tenant role updates are not enabled");
    }

    if (args.organizationSlug !== DEFAULT_TENANT_SLUG) {
      throw new Error("Organization not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    await requireCurrentSingleTenantAdmin(identity.subject);

    if (identity.subject === args.clerkUserId) {
      throw new Error("You cannot change your own role");
    }

    const targetUser = await clerkClient.users.getUser(args.clerkUserId);
    const targetRole = targetUser.publicMetadata?.role;
    const isTargetSuperAdmin =
      targetUser.publicMetadata?.isSuperAdmin === true ||
      targetRole === "superadmin" ||
      targetRole === "org:superadmin";
    if (isTargetSuperAdmin) {
      throw new Error("Cannot update role for a SuperAdmin");
    }

    const updatedUser = await clerkClient.users.updateUserMetadata(
      args.clerkUserId,
      {
        publicMetadata: {
          ...(targetUser.publicMetadata ?? {}),
          role: args.role as SingleTenantAppRole,
        },
      },
    );

    await ctx.runMutation(internal.members.syncFromSingleTenant, {
      clerkUserId: args.clerkUserId,
      organizationSlug: args.organizationSlug,
      role: args.role,
      clerkUpdatedAt: updatedUser.updatedAt,
    });

    return null;
  },
});

/**
 * Delete a user from Clerk in single-tenant mode.
 * The Convex user record is deactivated immediately.
 */
export const deleteSingleTenantUser = action({
  args: {
    organizationSlug: v.string(),
    clerkUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isSingleTenantMode()) {
      throw new Error("Single-tenant user deletion is not enabled");
    }

    if (args.organizationSlug !== DEFAULT_TENANT_SLUG) {
      throw new Error("Organization not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    await requireCurrentSingleTenantAdmin(identity.subject);

    if (identity.subject === args.clerkUserId) {
      throw new Error("You cannot delete your own account");
    }

    const targetUser = await clerkClient.users.getUser(args.clerkUserId);
    const targetRole = targetUser.publicMetadata?.role;
    const isTargetSuperAdmin =
      targetUser.publicMetadata?.isSuperAdmin === true ||
      targetRole === "superadmin" ||
      targetRole === "org:superadmin";
    if (isTargetSuperAdmin) {
      throw new Error("Cannot delete a SuperAdmin");
    }

    await clerkClient.users.deleteUser(args.clerkUserId);

    await ctx.runMutation(internal.members.syncFromSingleTenant, {
      clerkUserId: args.clerkUserId,
      organizationSlug: args.organizationSlug,
    });
    await ctx.runMutation(internal.users.deactivateUser, {
      clerkId: args.clerkUserId,
    });

    return null;
  },
});
