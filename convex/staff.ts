import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * List staff by club slug
 */
export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      fullName: v.string(),
      avatarUrl: v.optional(v.string()),
      role: v.string(),
      categoryName: v.optional(v.string()),
      clubName: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Find club by slug
    const club = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    // Get all categories for this club (categories have technicalDirectorId)
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
      .collect();

    const staff: Array<{
      _id: Id<"categories">;
      _creationTime: number;
      profileId: Id<"profiles">;
      fullName: string;
      avatarUrl: string | undefined;
      role: string;
      categoryName: string | undefined;
      clubName: string;
    }> = [];

    for (const category of categories) {
      // Add technical director if exists
      if (category.technicalDirectorId) {
        const profile = await ctx.db.get(category.technicalDirectorId);
        if (profile) {
          staff.push({
            _id: category._id,
            _creationTime: category._creationTime,
            profileId: category.technicalDirectorId,
            fullName: profile.displayName || profile.email || "Unknown",
            avatarUrl: profile.avatarUrl,
            role: "Technical Director",
            categoryName: category.name,
            clubName: club.name,
          });
        }
      }

      // Add assistant coaches if exist
      if (category.assistantCoachIds) {
        for (const coachId of category.assistantCoachIds) {
          const profile = await ctx.db.get(coachId);
          if (profile) {
            staff.push({
              _id: category._id,
              _creationTime: category._creationTime,
              profileId: coachId,
              fullName: profile.displayName || profile.email || "Unknown",
              avatarUrl: profile.avatarUrl,
              role: "Assistant Coach",
              categoryName: category.name,
              clubName: club.name,
            });
          }
        }
      }
    }

    return staff;
  },
});

/**
 * Get staff member by profile ID (shows all their assignments)
 */
export const getByProfileId = query({
  args: { profileId: v.id("profiles") },
  returns: v.object({
    profile: v.object({
      _id: v.id("profiles"),
      displayName: v.optional(v.string()),
      email: v.string(),
      avatarUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
    assignments: v.array(
      v.object({
        categoryId: v.id("categories"),
        categoryName: v.string(),
        clubName: v.string(),
        role: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Find all categories where this person is TD or assistant
    const allCategories = await ctx.db.query("categories").collect();

    const assignments: Array<{
      categoryId: Id<"categories">;
      categoryName: string;
      clubName: string;
      role: string;
    }> = [];

    for (const category of allCategories) {
      let role: string | null = null;

      if (category.technicalDirectorId === args.profileId) {
        role = "Technical Director";
      } else if (category.assistantCoachIds?.includes(args.profileId)) {
        role = "Assistant Coach";
      }

      if (role) {
        const club = await ctx.db.get(category.clubId);
        if (club) {
          assignments.push({
            categoryId: category._id,
            categoryName: category.name,
            clubName: club.name,
            role,
          });
        }
      }
    }

    return {
      profile: {
        _id: profile._id,
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        phoneNumber: profile.phoneNumber,
      },
      assignments,
    };
  },
});

/**
 * Remove staff member from a category
 */
export const removeFromCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    profileId: v.id("profiles"),
    role: v.union(v.literal("technical_director"), v.literal("assistant_coach")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    if (args.role === "technical_director") {
      if (category.technicalDirectorId !== args.profileId) {
        throw new Error("Profile is not the technical director of this category");
      }
      await ctx.db.patch(args.categoryId, {
        technicalDirectorId: undefined,
      });
    } else {
      const assistantCoachIds = category.assistantCoachIds || [];
      const updatedIds = assistantCoachIds.filter((id) => id !== args.profileId);
      
      if (assistantCoachIds.length === updatedIds.length) {
        throw new Error("Profile is not an assistant coach of this category");
      }
      
      await ctx.db.patch(args.categoryId, {
        assistantCoachIds: updatedIds,
      });
    }

    return null;
  },
});

/**
 * Get staff statistics
 */
export const getStatistics = query({
  args: { profileId: v.id("profiles") },
  returns: v.object({
    totalAssignments: v.number(),
    technicalDirectorCount: v.number(),
    assistantCoachCount: v.number(),
    totalPlayers: v.number(),
  }),
  handler: async (ctx, args) => {
    const allCategories = await ctx.db.query("categories").collect();

    let technicalDirectorCount = 0;
    let assistantCoachCount = 0;
    const categoryIds: Array<Id<"categories">> = [];

    for (const category of allCategories) {
      if (category.technicalDirectorId === args.profileId) {
        technicalDirectorCount++;
        categoryIds.push(category._id);
      } else if (category.assistantCoachIds?.includes(args.profileId)) {
        assistantCoachCount++;
        categoryIds.push(category._id);
      }
    }

    // Count total players across all categories this staff manages
    let totalPlayers = 0;
    for (const categoryId of categoryIds) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_currentCategoryId", (q) => q.eq("currentCategoryId", categoryId))
        .collect();
      totalPlayers += players.length;
    }

    return {
      totalAssignments: technicalDirectorCount + assistantCoachCount,
      technicalDirectorCount,
      assistantCoachCount,
      totalPlayers,
    };
  },
});

/**
 * Add staff member to a category
 */
export const addToCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    email: v.string(),
    firstName: v.string(), // Added
    lastName: v.string(),  // Added
    phoneNumber: v.optional(v.string()), // Added
    role: v.union(v.literal("technical_director"), v.literal("assistant_coach")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    
    const clubId = category.clubId;

    // 1. Find or Create Profile
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!profile) {
      // Create new profile
      const profileId = await ctx.db.insert("profiles", {
        clerkId: "", // Will be filled by action
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        displayName: `${args.firstName} ${args.lastName}`,
        phoneNumber: args.phoneNumber,
      });
      
      profile = await ctx.db.get(profileId);
      
      // Trigger Clerk creation (send invite/create account)
      await ctx.scheduler.runAfter(0, internal.users.createClerkAccount, {
        profileId: profileId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      });
    }

    if (!profile) throw new Error("Unexpected error creating profile");

    // 2. Ensure they have the Base Role in the Club
    // Whether they are a TD or Assistant, they need "TechnicalDirector" access to the platform
    const existingRole = await ctx.db
      .query("roleAssignments")
      .withIndex("by_profileId_and_organizationId", (q) =>
        q.eq("profileId", profile!._id).eq("organizationId", clubId)
      )
      .first();

    if (!existingRole) {
      await ctx.db.insert("roleAssignments", {
        profileId: profile._id,
        role: "TechnicalDirector", // Base role for all coaching staff
        organizationId: clubId,
        organizationType: "club",
        assignedAt: Date.now(),
      });
      
      // Sync roles so they can login immediately
      await ctx.scheduler.runAfter(0, internal.users.syncRolesToClerk, {
        profileId: profile._id,
      });
    }

    // 3. Link to Category
    if (args.role === "technical_director") {
      if (category.technicalDirectorId && category.technicalDirectorId !== profile._id) {
        throw new Error("Category already has a technical director");
      }
      await ctx.db.patch(args.categoryId, {
        technicalDirectorId: profile._id,
      });
    } else {
      const assistantCoachIds = category.assistantCoachIds || [];
      // Prevent duplicates
      if (!assistantCoachIds.includes(profile._id)) {
        await ctx.db.patch(args.categoryId, {
          assistantCoachIds: [...assistantCoachIds, profile._id],
        });
      }
    }

    return null;
  },
});