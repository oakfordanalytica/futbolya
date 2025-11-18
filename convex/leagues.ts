import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List all leagues (SuperAdmin only)
 */
export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      shortName: v.optional(v.string()),
      slug: v.string(),
      country: v.string(),
      region: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
      logoUrl: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("inactive")),
    })
  ),
  handler: async (ctx) => {
    const leagues = await ctx.db
      .query("leagues")
      .order("desc")
      .collect();

    return leagues.map((league) => ({
      _id: league._id,
      _creationTime: league._creationTime,
      name: league.name,
      shortName: league.shortName,
      slug: league.slug,
      country: league.country,
      region: league.region,
      foundedYear: league.foundedYear,
      logoUrl: league.logoUrl,
      status: league.status,
    }));
  },
});

/**
 * Get league by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      country: v.string(),
      region: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("inactive")),
      foundedYear: v.optional(v.number()),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      address: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get league by ID
 */
export const getById = query({
  args: { leagueId: v.id("leagues") },
  returns: v.union(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      country: v.string(),
      region: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("inactive")),
      foundedYear: v.optional(v.number()),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      address: v.optional(v.string()),
      federationId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leagueId);
  },
});

/**
 * Get league statistics
 */
export const getStats = query({
  args: { leagueId: v.id("leagues") },
  returns: v.object({
    totalClubs: v.number(),
    affiliatedClubs: v.number(),
    invitedClubs: v.number(),
    totalPlayers: v.number(),
    totalCategories: v.number(),
    totalReferees: v.number(),
  }),
  handler: async (ctx, args) => {
    // Count clubs
    const clubs = await ctx.db
      .query("clubs")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const affiliatedClubs = clubs.filter(
      (c) => c.status === "affiliated"
    ).length;
    const invitedClubs = clubs.filter((c) => c.status === "invited").length;

    // Count categories across all clubs
    let totalCategories = 0;
    for (const club of clubs) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
        .collect();
      totalCategories += categories.length;
    }

    // Count referees for this league
    const referees = await ctx.db
      .query("referees")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Count players across all categories
    let totalPlayers = 0;
    for (const club of clubs) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
        .collect();

      for (const category of categories) {
        const players = await ctx.db
          .query("players")
          .withIndex("by_currentCategoryId", (q) =>
            q.eq("currentCategoryId", category._id)
          )
          .collect();
        totalPlayers += players.length;
      }
    }

    return {
      totalClubs: clubs.length,
      affiliatedClubs,
      invitedClubs,
      totalPlayers,
      totalCategories,
      totalReferees: referees.length,
    };
  },
});

/**
 * Create a new league
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    shortName: v.optional(v.string()),
    country: v.string(),
    region: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    federationId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  returns: v.id("leagues"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
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
      .query("leagues")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("A league with this slug already exists");
    }

    return await ctx.db.insert("leagues", {
      name: args.name,
      slug,
      shortName: args.shortName,
      country: args.country,
      region: args.region,
      foundedYear: args.foundedYear,
      website: args.website,
      email: args.email,
      phoneNumber: args.phoneNumber,
      address: args.address,
      federationId: args.federationId,
      status: args.status,
    });
  },
});

/**
 * Update a league
 */
export const update = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
    shortName: v.optional(v.string()),
    country: v.string(),
    region: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    await ctx.db.patch(args.leagueId, {
      name: args.name,
      shortName: args.shortName,
      country: args.country,
      region: args.region,
      foundedYear: args.foundedYear,
      website: args.website,
      email: args.email,
      phoneNumber: args.phoneNumber,
      address: args.address,
      status: args.status,
    });

    return null;
  },
});

/**
 * Delete a league (SuperAdmin only)
 */
export const deleteLeague = mutation({
  args: { leagueId: v.id("leagues") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const league = await ctx.db.get(args.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    // Check if league has clubs
    const clubs = await ctx.db
      .query("clubs")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    if (clubs.length > 0) {
      throw new Error(
        `Cannot delete league with ${clubs.length} clubs. Remove all clubs first.`
      );
    }

    // Check if league has divisions
    const divisions = await ctx.db
      .query("divisions")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    if (divisions.length > 0) {
      throw new Error(
        `Cannot delete league with ${divisions.length} divisions. Remove all divisions first.`
      );
    }

    await ctx.db.delete(args.leagueId);
    return null;
  },
});

/**
 * Get league by ID (for SuperAdmin)
 */
export const getByIdAdmin = query({
  args: { leagueId: v.id("leagues") },
  returns: v.union(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      country: v.string(),
      region: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      address: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      federationId: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("inactive")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leagueId);
  },
});