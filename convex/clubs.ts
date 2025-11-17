import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all clubs (SuperAdmin only)
 */
export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      taxId: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      status: v.union(
        v.literal("affiliated"),
        v.literal("invited"),
        v.literal("suspended")
      ),
      leagueId: v.id("leagues"),
      leagueName: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const clubs = await ctx.db
      .query("clubs")
      .order("desc")
      .collect();

    const clubsWithLeagues = await Promise.all(
      clubs.map(async (club) => {
        const league = await ctx.db.get(club.leagueId);

        return {
          _id: club._id,
          _creationTime: club._creationTime,
          name: club.name,
          slug: club.slug,
          taxId: club.taxId,
          logoUrl: club.logoUrl,
          status: club.status,
          leagueId: club.leagueId,
          leagueName: league?.name,
        };
      })
    );

    return clubsWithLeagues;
  },
});

/**
 * List clubs by league slug
 */
export const listByLeagueSlug = query({
  args: { leagueSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      logoUrl: v.optional(v.string()),
      status: v.union(
        v.literal("affiliated"),
        v.literal("invited"),
        v.literal("suspended")
      ),
      headquarters: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const league = await ctx.db
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", args.leagueSlug))
      .unique();

    if (!league) {
      return [];
    }

    const clubs = await ctx.db
      .query("clubs")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", league._id))
      .collect();

    return clubs.map((club) => ({
      _id: club._id,
      _creationTime: club._creationTime,
      name: club.name,
      slug: club.slug,
      logoUrl: club.logoUrl,
      status: club.status,
      headquarters: club.headquarters,
      foundedYear: club.foundedYear,
    }));
  },
});

/**
 * Get club by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
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
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get club by ID
 */
export const getById = query({
  args: { clubId: v.id("clubs") },
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clubId);
  },
});