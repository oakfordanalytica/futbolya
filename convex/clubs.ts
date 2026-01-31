import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireOrgAdmin } from "./lib/permissions";

// ============================================================================
// VALIDATORS
// ============================================================================

const clubStatus = v.union(
  v.literal("affiliated"),
  v.literal("invited"),
  v.literal("suspended"),
);

const clubValidator = v.object({
  _id: v.id("clubs"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  name: v.string(),
  slug: v.string(),
  nickname: v.optional(v.string()),
  logoStorageId: v.optional(v.id("_storage")),
  logoUrl: v.optional(v.string()),
  colors: v.optional(v.array(v.string())),
  colorNames: v.optional(v.array(v.string())),
  status: clubStatus,
  delegateUserId: v.optional(v.id("users")),
});

const clubListItemValidator = v.object({
  _id: v.id("clubs"),
  name: v.string(),
  nickname: v.string(),
  logoUrl: v.optional(v.string()),
  conference: v.string(),
  delegate: v.object({
    name: v.string(),
    avatarUrl: v.string(),
  }),
  status: clubStatus,
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all clubs for a league (organization).
 * Returns data formatted for the teams table.
 */
export const listByLeague = query({
  args: { orgSlug: v.string() },
  returns: v.array(clubListItemValidator),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("bySlug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!org) {
      return [];
    }

    const clubs = await ctx.db
      .query("clubs")
      .withIndex("byOrganization", (q) => q.eq("organizationId", org._id))
      .collect();

    const result: Array<{
      _id: Id<"clubs">;
      name: string;
      nickname: string;
      logoUrl?: string;
      conference: string;
      delegate: { name: string; avatarUrl: string };
      status: "affiliated" | "invited" | "suspended";
    }> = [];

    for (const club of clubs) {
      let logoUrl: string | undefined;
      if (club.logoStorageId) {
        logoUrl = (await ctx.storage.getUrl(club.logoStorageId)) ?? undefined;
      }

      let delegateName = "";
      let delegateAvatarUrl = "";
      if (club.delegateUserId) {
        const delegate = await ctx.db.get(club.delegateUserId);
        if (delegate) {
          delegateName = `${delegate.firstName} ${delegate.lastName}`.trim();
        }
      }

      result.push({
        _id: club._id,
        name: club.name,
        nickname: club.nickname ?? "",
        logoUrl,
        conference: "",
        delegate: {
          name: delegateName,
          avatarUrl: delegateAvatarUrl,
        },
        status: club.status,
      });
    }

    return result;
  },
});

/**
 * Get a club by its slug.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(clubValidator, v.null()),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!club) {
      return null;
    }

    let logoUrl: string | undefined;
    if (club.logoStorageId) {
      logoUrl = (await ctx.storage.getUrl(club.logoStorageId)) ?? undefined;
    }

    return {
      ...club,
      logoUrl,
    };
  },
});

/**
 * Get a club by its ID.
 */
export const getById = query({
  args: { clubId: v.id("clubs") },
  returns: v.union(clubValidator, v.null()),
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);

    if (!club) {
      return null;
    }

    let logoUrl: string | undefined;
    if (club.logoStorageId) {
      logoUrl = (await ctx.storage.getUrl(club.logoStorageId)) ?? undefined;
    }

    return {
      ...club,
      logoUrl,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new club with optional delegate.
 */
export const createWithDelegate = mutation({
  args: {
    name: v.string(),
    nickname: v.optional(v.string()),
    orgSlug: v.string(),
    status: clubStatus,
    logoStorageId: v.optional(v.id("_storage")),
    colors: v.optional(v.array(v.string())),
    colorNames: v.optional(v.array(v.string())),
    delegateEmail: v.optional(v.string()),
  },
  returns: v.id("clubs"),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.orgSlug);

    // Use nickname as slug if provided, otherwise generate from name
    const slug = args.nickname
      ? args.nickname
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "")
          .replace(/^-|-$/g, "")
      : args.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

    if (!slug) {
      throw new Error("A valid nickname/slug is required");
    }

    // Check slug uniqueness within organization
    const existing = await ctx.db
      .query("clubs")
      .withIndex("byOrgAndSlug", (q) =>
        q.eq("organizationId", organization._id).eq("slug", slug),
      )
      .unique();

    if (existing) {
      throw new Error(`Club with slug "${slug}" already exists in this league`);
    }

    // Find delegate by email if provided
    let delegateUserId: Id<"users"> | undefined;
    if (args.delegateEmail) {
      const delegateUser = await ctx.db
        .query("users")
        .withIndex("byEmail", (q) => q.eq("email", args.delegateEmail!))
        .unique();

      if (delegateUser) {
        delegateUserId = delegateUser._id;
      }
    }

    const clubId = await ctx.db.insert("clubs", {
      organizationId: organization._id,
      name: args.name,
      slug,
      nickname: args.nickname,
      logoStorageId: args.logoStorageId,
      colors: args.colors,
      colorNames: args.colorNames,
      status: args.status,
      delegateUserId,
    });

    return clubId;
  },
});

/**
 * Update a club's information.
 */
export const update = mutation({
  args: {
    clubId: v.id("clubs"),
    name: v.optional(v.string()),
    nickname: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    colors: v.optional(v.array(v.string())),
    colorNames: v.optional(v.array(v.string())),
    status: v.optional(clubStatus),
    delegateUserId: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Club not found");
    }

    const org = await ctx.db.get(club.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    await requireOrgAdmin(ctx, org.slug);

    const { clubId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // Update slug if nickname changed (nickname is used as slug)
    if (
      filteredUpdates.nickname &&
      typeof filteredUpdates.nickname === "string"
    ) {
      const newSlug = filteredUpdates.nickname
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "")
        .replace(/^-|-$/g, "");

      if (newSlug) {
        // Check uniqueness
        const existing = await ctx.db
          .query("clubs")
          .withIndex("byOrgAndSlug", (q) =>
            q.eq("organizationId", club.organizationId).eq("slug", newSlug),
          )
          .unique();

        if (existing && existing._id !== clubId) {
          throw new Error(`Club with slug "${newSlug}" already exists`);
        }

        filteredUpdates.slug = newSlug;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(clubId, filteredUpdates);
    }

    return null;
  },
});

/**
 * Delete a club.
 */
export const remove = mutation({
  args: { clubId: v.id("clubs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Club not found");
    }

    const org = await ctx.db.get(club.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    await requireOrgAdmin(ctx, org.slug);

    // Delete related data
    const categories = await ctx.db
      .query("categories")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .collect();

    for (const category of categories) {
      // Delete players in this category
      const players = await ctx.db
        .query("players")
        .withIndex("byCategory", (q) => q.eq("categoryId", category._id))
        .collect();
      for (const player of players) {
        await ctx.db.delete(player._id);
      }
      await ctx.db.delete(category._id);
    }

    // Delete staff
    const staffMembers = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .collect();
    for (const staff of staffMembers) {
      await ctx.db.delete(staff._id);
    }

    // Delete the club
    await ctx.db.delete(args.clubId);

    return null;
  },
});
