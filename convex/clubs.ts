import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
      shortName: v.optional(v.string()), // ✅ Add this
      slug: v.string(),
      headquarters: v.optional(v.string()), // ✅ Add this
      foundedYear: v.optional(v.number()), // ✅ Add this if you want it
      logoUrl: v.optional(v.string()),
      taxId: v.optional(v.string()),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clubs = await ctx.db.query("clubs").collect();

    return await Promise.all(
      clubs.map(async (club) => {
        const league = await ctx.db.get(club.leagueId);
        return {
          _id: club._id,
          _creationTime: club._creationTime,
          name: club.name,
          shortName: club.shortName, // ✅ Add this
          slug: club.slug,
          headquarters: club.headquarters, // ✅ Add this
          foundedYear: club.foundedYear, // ✅ Add this if you want it
          logoUrl: club.logoUrl,
          taxId: club.taxId,
          status: club.status,
          leagueId: club.leagueId,
          leagueName: league?.name,
        };
      })
    );
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

/**
 * Create a new club
 */
export const create = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
    shortName: v.optional(v.string()),
    slug: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    status: v.union(
      v.literal("affiliated"),
      v.literal("invited"),
      v.literal("suspended")
    ),
  },
  returns: v.id("clubs"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    // Generate slug from name if not provided
    const slug =
      args.slug ||
      args.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existing = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("A club with this slug already exists");
    }

    return await ctx.db.insert("clubs", {
      leagueId: args.leagueId,
      name: args.name,
      shortName: args.shortName,
      slug,
      headquarters: args.headquarters,
      foundedYear: args.foundedYear,
      website: args.website,
      email: args.email,
      phoneNumber: args.phoneNumber,
      status: args.status,
    });
  },
});

/**
 * Update a club
 */
export const update = mutation({
  args: {
    clubId: v.id("clubs"),
    name: v.string(),
    shortName: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    colors: v.optional(v.array(v.string())),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    status: v.union(
      v.literal("affiliated"),
      v.literal("invited"),
      v.literal("suspended")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Club not found");
    }

    await ctx.db.patch(args.clubId, {
      name: args.name,
      shortName: args.shortName,
      headquarters: args.headquarters,
      foundedYear: args.foundedYear,
      colors: args.colors,
      website: args.website,
      email: args.email,
      phoneNumber: args.phoneNumber,
      status: args.status,
    });

    return null;
  },
});

/**
 * Delete a club
 */
export const deleteClub = mutation({
  args: { clubId: v.id("clubs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Club not found");
    }

    // Check if club has categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", args.clubId))
      .collect();

    if (categories.length > 0) {
      throw new Error(
        `Cannot delete club with ${categories.length} categories. Remove all categories first.`
      );
    }

    await ctx.db.delete(args.clubId);
    return null;
  },
});

/**
 * Get club statistics
 */
export const getStatistics = query({
  args: { clubId: v.id("clubs") },
  returns: v.object({
    categoriesCount: v.number(),
    playersCount: v.number(),
    staffCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Club not found");
    }

    // Count categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", args.clubId))
      .collect();

    // Count players across all categories
    let playersCount = 0;
    for (const category of categories) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_currentCategoryId", (q) =>
          q.eq("currentCategoryId", category._id)
        )
        .collect();
      playersCount += players.length;
    }

    // Count staff (users with roles in this club)
    const staffAssignments = await ctx.db
      .query("roleAssignments")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), args.clubId),
          q.eq(q.field("organizationType"), "club")
        )
      )
      .collect();

    return {
      categoriesCount: categories.length,
      playersCount,
      staffCount: staffAssignments.length,
    };
  },
});

/**
 * Get club by ID (for SuperAdmin)
 */
export const getByIdAdmin = query({
  args: { clubId: v.id("clubs") },
  returns: v.union(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      headquarters: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
      colors: v.optional(v.array(v.string())),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      taxId: v.optional(v.string()),
      status: v.union(
        v.literal("affiliated"),
        v.literal("invited"),
        v.literal("suspended")
      ),
      leagueId: v.id("leagues"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clubId);
  },
});