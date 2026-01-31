import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
      isActive: v.boolean(),
      isSuperAdmin: v.boolean(),
      memberships: v.array(
        v.object({
          organizationId: v.id("organizations"),
          organizationSlug: v.string(),
          organizationName: v.string(),
          role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
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

    // Get all memberships for this user
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    // Batch fetch all organizations at once to avoid N+1
    const orgIds = [...new Set(memberships.map((m) => m.organizationId))];
    const orgs = await Promise.all(orgIds.map((id) => ctx.db.get(id)));
    const orgMap = new Map(orgs.filter(Boolean).map((o) => [o!._id, o!]));

    const enrichedMemberships = memberships.map((m) => {
      const org = orgMap.get(m.organizationId);
      return {
        organizationId: m.organizationId,
        organizationSlug: org?.slug ?? "",
        organizationName: org?.name ?? "",
        role: m.role,
      };
    });

    return {
      ...user,
      memberships: enrichedMemberships,
    };
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
      isActive: v.boolean(),
      isSuperAdmin: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Upsert user from Clerk webhook (internal).
 * Handles both user.created and user.updated events.
 * Reads isSuperAdmin from Clerk's publicMetadata.
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
    const isSuperAdmin = data.public_metadata?.isSuperAdmin === true;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        isActive: true,
        isSuperAdmin,
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      firstName,
      lastName,
      isActive: true,
      isSuperAdmin,
    });
    return userId;
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
