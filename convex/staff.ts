import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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