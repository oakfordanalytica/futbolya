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
      _id: v.string(),
      slug: v.string(),
      name: v.string(),
      role: v.union(
        v.literal("SuperAdmin"),
        v.literal("LeagueAdmin"),
        v.literal("ClubAdmin"),
        v.literal("TechnicalDirector"),
        v.literal("Player"),
        v.literal("Referee")
      ),
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
      _id: string;
      slug: string;
      name: string;
      role: "SuperAdmin" | "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Player" | "Referee";
      type: "league" | "club";
      logoUrl?: string;
    }> = [];

    for (const assignment of assignments) {
      if (assignment.organizationType === "league") {
        const league = await ctx.db.get(assignment.organizationId as Id<"leagues">);
        if (league && league.status === "active") {
          orgs.push({
            _id: league._id,
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
            _id: club._id,
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
  returns: v.union(
    v.literal("SuperAdmin"),
    v.literal("LeagueAdmin"),
    v.literal("ClubAdmin"),
    v.literal("TechnicalDirector"),
    v.literal("Player"),
    v.literal("Referee"),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!profile) return null;

    const globalAssignment = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_role", (q) => 
        q.eq("profileId", profile._id).eq("role", "SuperAdmin")
      )
      .first();

    if (globalAssignment) return "SuperAdmin";

    let orgId: string | null = null;
    if (args.orgType === "league") {
      const league = await ctx.db
        .query("leagues")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = league?._id ?? null;
    } else {
      const club = await ctx.db
        .query("clubs")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = club?._id ?? null;
    }

    if (!orgId) return null;

    // 3. Check specific organization role
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
      organizationType: v.union(v.literal("league"), v.literal("club"), v.literal("system")),
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
 */
export const syncRolesToClerk = internalAction({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.runQuery(internal.users.getProfile, { profileId });
    if (!profile) return null;

    const assignments = await ctx.runQuery(internal.users.getRoleAssignments, { profileId });
    
    const rolesMap: Record<string, string> = {};

    for (const assignment of assignments) {
      // 1. Handle System/Global Roles
      if (assignment.organizationType === "system") {
        rolesMap["system"] = assignment.role;
        continue;
      }

      // 2. Handle Org Roles
      let slug: string | undefined;
      if (assignment.organizationType === "league") {
        const league = await ctx.runQuery(internal.users.getLeagueById, { 
          leagueId: assignment.organizationId 
        });
        slug = league?.slug;
      } else if (assignment.organizationType === "club") {
        const club = await ctx.runQuery(internal.users.getClubById, { 
          clubId: assignment.organizationId 
        });
        slug = club?.slug;
      }

      if (slug) {
        rolesMap[slug] = assignment.role;
      }
    }

    // Update Clerk
    await clerkClient.users.updateUserMetadata(profile.clerkId, {
      publicMetadata: {
        roles: rolesMap,
      },
    });

    return null;
  },
});

/**
 * Create a user profile that can be claimed later.
 * Email is optional - admins can add it later when available.
 */
export const createInvitedUser = mutation({
  args: {
    email: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.optional(v.string()),
    role: v.union(
      v.literal("TechnicalDirector"),
      v.literal("Player"),
      v.literal("Referee")
    ),
    organizationId: v.string(),
    organizationType: v.union(v.literal("league"), v.literal("club")),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check - only admins can create users

    // If email provided, check if user already exists
    if (args.email) {
      const email = args.email; // Narrow the type
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existing) {
        throw new Error("User with this email already exists");
      }
    }

    // Create profile without Clerk ID (they'll claim it when they sign in)
    const profileId = await ctx.db.insert("profiles", {
      clerkId: "", // Empty until they claim their account
      email: args.email ?? "", // Can be empty if not provided yet
      firstName: args.firstName,
      lastName: args.lastName,
      displayName: `${args.firstName} ${args.lastName}`,
      phoneNumber: args.phoneNumber,
    });

    // Assign their role immediately
    await ctx.db.insert("roleAssignments", {
      profileId,
      role: args.role,
      organizationId: args.organizationId,
      organizationType: args.organizationType,
      assignedAt: Date.now(),
    });

    return profileId;
  },
});

/**
 * Update a user's email (when admin gets it later).
 */
export const updateUserEmail = mutation({
  args: {
    profileId: v.id("profiles"),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check

    // Check if email is already taken
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing && existing._id !== args.profileId) {
      throw new Error("Email already in use");
    }

    await ctx.db.patch(args.profileId, {
      email: args.email,
    });

    return null;
  },
});

/**
 * List all profiles (for admin to see who needs email/account setup).
 */
export const listAllProfiles = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.array(
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
      hasAccount: v.boolean(), // Whether they've claimed their account
      roles: v.array(
        v.object({
          role: v.string(),
          organizationId: v.string(),
          organizationType: v.union(v.literal("league"), v.literal("club"), v.literal("system")),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check - only admins should see all users

    let profiles = await ctx.db.query("profiles").collect();

    // If organizationId provided, filter by that organization
    if (args.organizationId) {
      const orgId = args.organizationId;
      const allAssignments = await ctx.db
        .query("roleAssignments")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", orgId)
        )
        .collect();

      const profileIds = new Set(allAssignments.map((a) => a.profileId));
      profiles = profiles.filter((p) => profileIds.has(p._id));
    }

    const result = [];
    for (const profile of profiles) {
      const assignments = await ctx.db
        .query("roleAssignments")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect();

      result.push({
        ...profile,
        hasAccount: profile.clerkId !== "", // Has claimed their account
        roles: assignments.map((a) => ({
          role: a.role,
          organizationId: a.organizationId,
          organizationType: a.organizationType,
        })),
      });
    }

    return result;
  },
});

/**
 * Create an admin user (LeagueAdmin, ClubAdmin, TechnicalDirector, Referee).
 * Email is REQUIRED and Clerk account is created immediately.
 */
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.optional(v.string()),
    role: v.union(
      v.literal("SuperAdmin"),
      v.literal("LeagueAdmin"),
      v.literal("ClubAdmin"),
      v.literal("TechnicalDirector"),
      v.literal("Referee")
    ),
    organizationId: v.optional(v.string()), 
    organizationType: v.union(v.literal("league"), v.literal("club"), v.literal("system")),
  },
  returns: v.object({
    profileId: v.id("profiles"),
    clerkAccountCreated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check - only admins can create users

    // If SuperAdmin creation
    if (args.role === "SuperAdmin") {
       args.organizationType = "system";
       args.organizationId = "global";
    }

    // Verify organization exists
    if (args.organizationType === "league") {
      const league = await ctx.db.get(args.organizationId as Id<"leagues">);
      if (!league) throw new Error("League not found");
    } else {
      const club = await ctx.db.get(args.organizationId as Id<"clubs">);
      if (!club) throw new Error("Club not found");
    }

    // Check if email is already in use
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Create profile first (without Clerk ID)
    const profileId = await ctx.db.insert("profiles", {
      clerkId: "", 
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      displayName: `${args.firstName} ${args.lastName}`,
      phoneNumber: args.phoneNumber,
    });

    // Assign role
    await ctx.db.insert("roleAssignments", {
      profileId,
      role: args.role,
      organizationId: args.organizationId || "global",
      organizationType: args.organizationType,
      assignedAt: Date.now(),
    });

    // Create Clerk account asynchronously
    await ctx.scheduler.runAfter(0, internal.users.createClerkAccount, {
      profileId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    return { profileId, clerkAccountCreated: true };
  },
});

/**
 * Internal action to create Clerk account and link to profile.
 */
export const createClerkAccount = internalAction({
  args: {
    profileId: v.id("profiles"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { clerkClient } = await import("./clerk");

    try {
      // Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [args.email],
        firstName: args.firstName,
        lastName: args.lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      });

      // Link Clerk ID to profile
      await ctx.runMutation(internal.users.linkClerkAccount, {
        profileId: args.profileId,
        clerkId: clerkUser.id,
      });

      // Sync roles to Clerk metadata
      await ctx.runAction(internal.users.syncRolesToClerk, {
        profileId: args.profileId,
      });

      console.log(`✅ Clerk account created for ${args.email}`);
    } catch (error) {
      console.error("Failed to create Clerk account:", error);
      // Don't throw - allow the profile to exist without Clerk account
      // Admin can retry or user can sign up manually
    }

    return null;
  },
});

/**
 * Link Clerk account to existing profile.
 */
export const linkClerkAccount = internalMutation({
  args: {
    profileId: v.id("profiles"),
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      clerkId: args.clerkId,
    });
    return null;
  },
});

/**
 * Get profile by Clerk ID (for webhook).
 */
export const getProfileByClerkId = internalQuery({
  args: { clerkId: v.string() },
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
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getProfileByEmail = internalQuery({
  args: { email: v.string() },
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
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const debugMyRoles = query({
  args: {},
  returns: v.union(
    v.object({
      authenticated: v.boolean(),
      clerkId: v.optional(v.string()),
      email: v.optional(v.string()),
      profileFound: v.boolean(),
      rolesFromDb: v.array(
        v.object({
          role: v.union(
            v.literal("SuperAdmin"),
            v.literal("LeagueAdmin"),
            v.literal("ClubAdmin"),
            v.literal("TechnicalDirector"),
            v.literal("Player"),
            v.literal("Referee")
          ),
          organizationId: v.string(),
          organizationType: v.union(v.literal("league"), v.literal("club"), v.literal("system")),
          organizationSlug: v.optional(v.string()),
        })
      ),
    }),
    v.object({
      authenticated: v.boolean(),
      error: v.string(),
    })
  ),
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      
      if (!identity) {
        return {
          authenticated: false,
          error: "No identity found - user not authenticated with Convex",
        };
      }

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!profile) {
        return {
          authenticated: true,
          clerkId: identity.subject,
          profileFound: false,
          error: `Profile not found for Clerk ID: ${identity.subject}`,
          rolesFromDb: [],
        };
      }

      const assignments = await ctx.db
        .query("roleAssignments")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect();

      const rolesWithSlugs = [];
      for (const assignment of assignments) {
        let slug: string | undefined;
        
        if (assignment.organizationType === "league") {
          const league = await ctx.db.get(assignment.organizationId as Id<"leagues">);
          slug = league?.slug;
        } else {
          const club = await ctx.db.get(assignment.organizationId as Id<"clubs">);
          slug = club?.slug;
        }

        rolesWithSlugs.push({
          role: assignment.role,
          organizationId: assignment.organizationId,
          organizationType: assignment.organizationType,
          organizationSlug: slug,
        });
      }

      return {
        authenticated: true,
        clerkId: profile.clerkId,
        email: profile.email,
        profileFound: true,
        rolesFromDb: rolesWithSlugs,
      };
    } catch (error) {
      return {
        authenticated: false,
        error: `Error: ${error}`,
      };
    }
  },
});

/**
 * List all profiles with roles in a specific organization
 */
export const listProfilesInOrg = query({
  args: {
    orgSlug: v.string(),
    orgType: v.union(v.literal("league"), v.literal("club")),
  },
  returns: v.array(
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
      role: v.union(
        v.literal("SuperAdmin"),
        v.literal("LeagueAdmin"),
        v.literal("ClubAdmin"),
        v.literal("TechnicalDirector"),
        v.literal("Player"),
        v.literal("Referee")
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Find organization ID
    let orgId: string | null = null;

    if (args.orgType === "league") {
      const league = await ctx.db
        .query("leagues")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = league?._id ?? null;
    } else {
      const club = await ctx.db
        .query("clubs")
        .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
        .unique();
      orgId = club?._id ?? null;
    }

    if (!orgId) {
      return [];
    }

    // Get all role assignments for this organization
    const roleAssignments = await ctx.db
      .query("roleAssignments")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId))
      .collect();

    // Get unique profiles and their roles
    const profilesMap = new Map<
      string,
      {
        _id: Id<"profiles">;
        _creationTime: number;
        clerkId: string;
        email: string;
        firstName: string | undefined;
        lastName: string | undefined;
        displayName: string | undefined;
        avatarUrl: string | undefined;
        phoneNumber: string | undefined;
        role: "SuperAdmin" | "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Player" | "Referee";
      }
    >();

    for (const assignment of roleAssignments) {
      const profile = await ctx.db.get(assignment.profileId);
      if (profile && !profilesMap.has(profile._id)) {
        profilesMap.set(profile._id, {
          _id: profile._id,
          _creationTime: profile._creationTime,
          clerkId: profile.clerkId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          phoneNumber: profile.phoneNumber,
          role: assignment.role,
        });
      }
    }

    return Array.from(profilesMap.values());
  },
});

/**
 * Delete a user (Profile + Roles + Clerk Account).
 * Only SuperAdmins can perform this action.
 */
export const deleteUser = mutation({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Verify SuperAdmin permissions
    const requester = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!requester) throw new Error("Requester not found");

    const superAdminRole = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_role", (q) => 
        q.eq("profileId", requester._id).eq("role", "SuperAdmin")
      )
      .first();
      
    if (!superAdminRole) throw new Error("Unauthorized: Only SuperAdmins can delete users");

    // 2. Prevent self-deletion
    if (args.profileId === requester._id) {
      throw new Error("You cannot delete your own account");
    }

    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) throw new Error("User not found");

    // 3. Delete all Role Assignments for this user
    const assignments = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // 4. Delete the Profile
    await ctx.db.delete(args.profileId);

    // 5. Delete from Clerk (if they have a connected account)
    if (targetProfile.clerkId) {
      await ctx.scheduler.runAfter(0, internal.users.deleteClerkUser, {
        clerkId: targetProfile.clerkId,
      });
    }

    return null;
  },
});

/**
 * Internal action to delete user from Clerk.
 */
export const deleteClerkUser = internalAction({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // clerkClient is imported from "./clerk"
    try {
      await clerkClient.users.deleteUser(args.clerkId);
    } catch (error) {
      console.error(`Failed to delete Clerk user ${args.clerkId}:`, error);
    }
    return null;
  },
});