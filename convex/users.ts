import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { clerkClient } from "./clerk";
import type { Doc, Id } from "./_generated/dataModel";

// ========================================
// PROFILE MANAGEMENT
// ========================================

/**
 * Internal mutation called by Clerk webhook to create user profile.
 */
export const createProfileInternal = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const displayName = args.firstName && args.lastName
      ? `${args.firstName} ${args.lastName}`
      : args.firstName || args.lastName;

    return await ctx.db.insert("profiles", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      displayName,
      avatarUrl: args.avatarUrl,
    });
  },
});

/**
 * Query to get current user's profile.
 */
export const getCurrentProfile = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// ========================================
// ROLE MANAGEMENT
// ========================================

/**
 * Assign a role to a user in an organization.
 * Only SuperAdmin or organization admins can assign roles.
 */
export const assignRole = mutation({
  args: {
    profileId: v.id("profiles"),
    role: v.union(
      v.literal("SuperAdmin"),
      v.literal("LeagueAdmin"),
      v.literal("ClubAdmin"),
      v.literal("TechnicalDirector"),
      v.literal("Player"),
      v.literal("Referee")
    ),
    organizationId: v.string(),
    organizationType: v.union(v.literal("league"), v.literal("club")),
  },
  returns: v.id("roleAssignments"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!assignerProfile) throw new Error("Profile not found");

    // TODO: Add authorization check
    // Check if assigner has permission to assign this role

    // Verify organization exists
    if (args.organizationType === "league") {
      const league = await ctx.db.get(args.organizationId as Id<"leagues">);
      if (!league) throw new Error("League not found");
    } else {
      const club = await ctx.db.get(args.organizationId as Id<"clubs">);
      if (!club) throw new Error("Club not found");
    }

    // Check if role assignment already exists
    const existing = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_organizationId", (q) =>
        q.eq("profileId", args.profileId).eq("organizationId", args.organizationId)
      )
      .first();

    if (existing) {
      // Update existing role
      await ctx.db.patch(existing._id, {
        role: args.role,
      });
      await ctx.scheduler.runAfter(0, internal.users.syncRolesToClerk, {
        profileId: args.profileId,
      });
      return existing._id;
    }

    const roleId = await ctx.db.insert("roleAssignments", {
      profileId: args.profileId,
      role: args.role,
      organizationId: args.organizationId,
      organizationType: args.organizationType,
      assignedAt: Date.now(),
      assignedBy: assignerProfile._id,
    });

    await ctx.scheduler.runAfter(0, internal.users.syncRolesToClerk, {
      profileId: args.profileId,
    });

    return roleId;
  },
});

/**
 * Remove a role assignment.
 */
export const removeRole = mutation({
  args: {
    roleAssignmentId: v.id("roleAssignments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check

    const assignment = await ctx.db.get(args.roleAssignmentId);
    if (!assignment) throw new Error("Role assignment not found");

    await ctx.db.delete(args.roleAssignmentId);

    await ctx.scheduler.runAfter(0, internal.users.syncRolesToClerk, {
      profileId: assignment.profileId,
    });

    return null;
  },
});

/**
 * Get all organizations the current user has access to.
 */
export const getMyOrganizations = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      slug: v.string(),
      name: v.string(),
      role: v.string(),
      type: v.union(v.literal("league"), v.literal("club")),
      logoUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!profile) return [];

    const assignments = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const orgs: Array<{
      id: string;
      slug: string;
      name: string;
      role: string;
      type: "league" | "club";
      logoUrl?: string;
    }> = [];

    for (const assignment of assignments) {
      if (assignment.organizationType === "league") {
        const league = await ctx.db.get(assignment.organizationId as Id<"leagues">);
        if (league && league.status === "active") {
          orgs.push({
            id: league._id,
            slug: league.slug,
            name: league.name,
            role: assignment.role,
            type: "league",
            logoUrl: league.logoUrl,
          });
        }
      } else {
        const club = await ctx.db.get(assignment.organizationId as Id<"clubs">);
        if (club) {
          orgs.push({
            id: club._id,
            slug: club.slug,
            name: club.name,
            role: assignment.role,
            type: "club",
            logoUrl: club.logoUrl,
          });
        }
      }
    }

    return orgs;
  },
});

/**
 * Get user's role in a specific organization.
 */
export const getMyRoleInOrg = query({
  args: {
    orgSlug: v.string(),
    orgType: v.union(v.literal("league"), v.literal("club")),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!profile) return null;

    // Find the organization
    let orgId: string | undefined;
    if (args.orgType === "league") {
      const league = await ctx.db
        .query("leagues")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = league?._id;
    } else {
      const club = await ctx.db
        .query("clubs")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = club?._id;
    }

    if (!orgId) return null;

    const assignment = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_organizationId", (q) =>
        q.eq("profileId", profile._id).eq("organizationId", orgId)
      )
      .first();

    return assignment?.role ?? null;
  },
});

// ========================================
// INTERNAL HELPERS
// ========================================

export const getProfile = internalQuery({
  args: { profileId: v.id("profiles") },
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, { profileId }) => {
    return await ctx.db.get(profileId);
  },
});

export const getRoleAssignments = internalQuery({
  args: { profileId: v.id("profiles") },
  returns: v.array(
    v.object({
      _id: v.id("roleAssignments"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      role: v.union(
        v.literal("SuperAdmin"),
        v.literal("LeagueAdmin"),
        v.literal("ClubAdmin"),
        v.literal("TechnicalDirector"),
        v.literal("Player"),
        v.literal("Referee")
      ),
      organizationId: v.string(),
      organizationType: v.union(v.literal("league"), v.literal("club")),
      assignedAt: v.optional(v.number()),
      assignedBy: v.optional(v.id("profiles")),
    })
  ),
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profileId))
      .collect();
  },
});

export const getLeagueById = internalQuery({
  args: { leagueId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      federationId: v.optional(v.string()),
      region: v.optional(v.string()),
      country: v.string(),
      status: v.union(v.literal("active"), v.literal("inactive")),
      foundedYear: v.optional(v.number()),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      address: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, { leagueId }) => {
    try {
      return await ctx.db.get(leagueId as Id<"leagues">);
    } catch {
      return null;
    }
  },
});

export const getClubById = internalQuery({
  args: { clubId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      leagueId: v.id("leagues"),
      fifaId: v.optional(v.string()),
      headquarters: v.optional(v.string()),
      status: v.union(
        v.literal("affiliated"),
        v.literal("invited"),
        v.literal("suspended")
      ),
      taxId: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
      colors: v.optional(v.array(v.string())),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, { clubId }) => {
    try {
      return await ctx.db.get(clubId as Id<"clubs">);
    } catch {
      return null;
    }
  },
});

/**
 * Sync role assignments to Clerk's public metadata.
 * This allows frontend middleware to access roles without DB queries.
 */
export const syncRolesToClerk = internalAction({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    const profile: Doc<"profiles"> | null = await ctx.runQuery(
      internal.users.getProfile,
      { profileId }
    );

    if (!profile) {
      console.error("Profile not found:", profileId);
      return null;
    }

    const assignments: Array<Doc<"roleAssignments">> = await ctx.runQuery(
      internal.users.getRoleAssignments,
      { profileId }
    );

    const rolesMap: Record<string, string> = {};

    for (const assignment of assignments) {
      let slug: string | undefined;

      if (assignment.organizationType === "league") {
        const league: Doc<"leagues"> | null = await ctx.runQuery(
          internal.users.getLeagueById,
          { leagueId: assignment.organizationId }
        );
        slug = league?.slug;
      } else {
        const club: Doc<"clubs"> | null = await ctx.runQuery(
          internal.users.getClubById,
          { clubId: assignment.organizationId }
        );
        slug = club?.slug;
      }

      if (slug) {
        rolesMap[slug] = assignment.role;
      }
    }

    await clerkClient.users.updateUserMetadata(profile.clerkId, {
      publicMetadata: {
        roles: rolesMap,
      },
    });

    return null;
  },
});