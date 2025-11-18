import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get organization by slug (league or club)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.string(),
      type: v.literal("league"),
      slug: v.string(),
      name: v.string(),
      logoUrl: v.optional(v.string()),
      clubId: v.null(),
    }),
    v.object({
      _id: v.string(),
      type: v.literal("club"),
      slug: v.string(),
      name: v.string(),
      logoUrl: v.optional(v.string()),
      clubId: v.id("clubs"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Try to find as league first
    const league = await ctx.db
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (league) {
      return {
        _id: league._id,
        type: "league" as const,
        slug: league.slug,
        name: league.name,
        logoUrl: league.logoUrl,
        clubId: null,
      };
    }

    // Try to find as club
    const club = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (club) {
      return {
        _id: club._id,
        type: "club" as const,
        slug: club.slug,
        name: club.name,
        logoUrl: club.logoUrl,
        clubId: club._id,
      };
    }

    return null;
  },
});