import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { requireOrgAdmin } from "./lib/permissions";

// ============================================================================
// VALIDATORS
// ============================================================================

const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

const sportType = v.union(v.literal("basketball"), v.literal("soccer"));

const ageCategoryValidator = v.object({
  id: v.string(),
  name: v.string(),
  minAge: v.number(),
  maxAge: v.number(),
});

const positionValidator = v.object({
  id: v.string(),
  name: v.string(),
  abbreviation: v.string(),
});

const horizontalDivisionsValidator = v.object({
  enabled: v.boolean(),
  type: v.union(
    v.literal("alphabetic"),
    v.literal("greek"),
    v.literal("numeric"),
  ),
});

const teamConfigValidator = v.object({
  sportType: sportType,
  ageCategories: v.array(ageCategoryValidator),
  positions: v.array(positionValidator),
  enabledGenders: v.array(gender),
  horizontalDivisions: v.optional(horizontalDivisionsValidator),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get team configuration for a league.
 * Returns the settings needed for creating teams, categories, and games.
 */
export const getTeamConfig = query({
  args: { leagueSlug: v.string() },
  returns: v.union(teamConfigValidator, v.null()),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.leagueSlug))
      .unique();

    if (!org) {
      return null;
    }

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) => q.eq("organizationId", org._id))
      .unique();

    if (!settings) {
      // Return default configuration
      return {
        sportType: "basketball" as const,
        ageCategories: [],
        positions: [],
        enabledGenders: ["male", "female"] as Array<
          "male" | "female" | "mixed"
        >,
        horizontalDivisions: undefined,
      };
    }

    return {
      sportType: settings.sportType,
      ageCategories: settings.ageCategories,
      positions: settings.positions ?? [],
      enabledGenders: settings.enabledGenders,
      horizontalDivisions: settings.horizontalDivisions,
    };
  },
});

/**
 * Get full league settings.
 */
export const getByLeagueSlug = query({
  args: { leagueSlug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("leagueSettings"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      sportType: sportType,
      ageCategories: v.array(ageCategoryValidator),
      positions: v.optional(v.array(positionValidator)),
      enabledGenders: v.array(gender),
      horizontalDivisions: v.optional(horizontalDivisionsValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.leagueSlug))
      .unique();

    if (!org) {
      return null;
    }

    return await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) => q.eq("organizationId", org._id))
      .unique();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create or update league settings.
 */
export const upsert = mutation({
  args: {
    leagueSlug: v.string(),
    sportType: sportType,
    ageCategories: v.array(ageCategoryValidator),
    positions: v.array(positionValidator),
    enabledGenders: v.array(gender),
    horizontalDivisions: v.optional(horizontalDivisionsValidator),
  },
  returns: v.id("leagueSettings"),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const existing = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sportType: args.sportType,
        ageCategories: args.ageCategories,
        positions: args.positions,
        enabledGenders: args.enabledGenders,
        horizontalDivisions: args.horizontalDivisions,
      });
      return existing._id;
    }

    return await ctx.db.insert("leagueSettings", {
      organizationId: organization._id,
      sportType: args.sportType,
      ageCategories: args.ageCategories,
      positions: args.positions,
      enabledGenders: args.enabledGenders,
      horizontalDivisions: args.horizontalDivisions,
    });
  },
});

/**
 * Add an age category.
 */
export const addAgeCategory = mutation({
  args: {
    leagueSlug: v.string(),
    category: ageCategoryValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      // Create settings with just this category
      await ctx.db.insert("leagueSettings", {
        organizationId: organization._id,
        sportType: "basketball",
        ageCategories: [args.category],
        positions: [],
        enabledGenders: ["male", "female"],
      });
      return null;
    }

    // Check for duplicate
    const exists = settings.ageCategories.some(
      (c) => c.id === args.category.id || c.name === args.category.name,
    );
    if (exists) {
      throw new Error("Age category already exists");
    }

    await ctx.db.patch(settings._id, {
      ageCategories: [...settings.ageCategories, args.category],
    });

    return null;
  },
});

/**
 * Remove an age category.
 */
export const removeAgeCategory = mutation({
  args: {
    leagueSlug: v.string(),
    categoryId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      return null;
    }

    await ctx.db.patch(settings._id, {
      ageCategories: settings.ageCategories.filter(
        (c) => c.id !== args.categoryId,
      ),
    });

    return null;
  },
});

/**
 * Update enabled genders.
 */
export const updateEnabledGenders = mutation({
  args: {
    leagueSlug: v.string(),
    enabledGenders: v.array(gender),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      // Create settings with enabled genders
      await ctx.db.insert("leagueSettings", {
        organizationId: organization._id,
        sportType: "basketball",
        ageCategories: [],
        positions: [],
        enabledGenders: args.enabledGenders,
      });
      return null;
    }

    await ctx.db.patch(settings._id, {
      enabledGenders: args.enabledGenders,
    });

    return null;
  },
});

/**
 * Update horizontal divisions configuration.
 */
export const updateHorizontalDivisions = mutation({
  args: {
    leagueSlug: v.string(),
    horizontalDivisions: v.optional(horizontalDivisionsValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      // Create settings with horizontal divisions
      await ctx.db.insert("leagueSettings", {
        organizationId: organization._id,
        sportType: "basketball",
        ageCategories: [],
        positions: [],
        enabledGenders: ["male", "female"],
        horizontalDivisions: args.horizontalDivisions,
      });
      return null;
    }

    await ctx.db.patch(settings._id, {
      horizontalDivisions: args.horizontalDivisions,
    });

    return null;
  },
});

/**
 * Add a position.
 */
export const addPosition = mutation({
  args: {
    leagueSlug: v.string(),
    position: positionValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      // Create settings with just this position
      await ctx.db.insert("leagueSettings", {
        organizationId: organization._id,
        sportType: "basketball",
        ageCategories: [],
        positions: [args.position],
        enabledGenders: ["male", "female"],
      });
      return null;
    }

    // Check for duplicate
    const currentPositions = settings.positions ?? [];
    const exists = currentPositions.some(
      (p) => p.id === args.position.id || p.name === args.position.name,
    );
    if (exists) {
      throw new Error("Position already exists");
    }

    await ctx.db.patch(settings._id, {
      positions: [...currentPositions, args.position],
    });

    return null;
  },
});

/**
 * Remove a position.
 */
export const removePosition = mutation({
  args: {
    leagueSlug: v.string(),
    positionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

    const settings = await ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique();

    if (!settings) {
      return null;
    }

    const currentPositions = settings.positions ?? [];
    await ctx.db.patch(settings._id, {
      positions: currentPositions.filter((p) => p.id !== args.positionId),
    });

    return null;
  },
});
