import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Create a player profile (with or without email).
 * If email provided, Clerk account will be created automatically.
 */
export const createPlayer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    categoryId: v.id("categories"),
    // Player-specific fields
    position: v.optional(
      v.union(
        v.literal("goalkeeper"),
        v.literal("defender"),
        v.literal("midfielder"),
        v.literal("forward")
      )
    ),
    jerseyNumber: v.optional(v.number()),
    nationality: v.optional(v.string()),
  },
  returns: v.object({
    profileId: v.id("profiles"),
    playerId: v.id("players"),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify category exists and get club
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    const club = await ctx.db.get(category.clubId);
    if (!club) throw new Error("Club not found");

    // TODO: Add authorization check - only club admins can create players

    // If email provided, check if it's already in use
    if (args.email) {
      const email = args.email;
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existing) {
        throw new Error("User with this email already exists");
      }
    }

    // Create profile
    const profileId = await ctx.db.insert("profiles", {
      clerkId: "",
      email: args.email ?? "",
      firstName: args.firstName,
      lastName: args.lastName,
      displayName: `${args.firstName} ${args.lastName}`,
      phoneNumber: args.phoneNumber,
      dateOfBirth: args.dateOfBirth,
    });

    // Create player record
    const playerId = await ctx.db.insert("players", {
      profileId,
      currentCategoryId: args.categoryId,
      position: args.position,
      jerseyNumber: args.jerseyNumber,
      nationality: args.nationality,
      status: "active",
      joinedDate: new Date().toISOString(),
    });

    // Assign Player role
    await ctx.db.insert("roleAssignments", {
      profileId,
      role: "Player",
      organizationId: club._id,
      organizationType: "club",
      assignedAt: Date.now(),
    });

    // If email was provided, create Clerk account
    if (args.email && args.firstName && args.lastName) {
      await ctx.scheduler.runAfter(0, internal.players.createClerkAccountForPlayer, {
        profileId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      });
    }

    return { profileId, playerId };
  },
});

/**
 * Update player email and trigger Clerk account creation if needed.
 */
export const updatePlayerEmail = mutation({
  args: {
    playerId: v.id("players"),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const profile = await ctx.db.get(player.profileId);
    if (!profile) throw new Error("Profile not found");

    // Check if email is already taken
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing && existing._id !== profile._id) {
      throw new Error("Email already in use");
    }

    // Update email
    await ctx.db.patch(player.profileId, {
      email: args.email,
    });

    // If profile doesn't have Clerk account yet, create it
    if (!profile.clerkId && profile.firstName && profile.lastName) {
      await ctx.scheduler.runAfter(0, internal.players.createClerkAccountForPlayer, {
        profileId: player.profileId,
        email: args.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    }

    return null;
  },
});

/**
 * Update player details
 */
export const updatePlayer = mutation({
  args: {
    playerId: v.id("players"),
    position: v.optional(
      v.union(
        v.literal("goalkeeper"),
        v.literal("defender"),
        v.literal("midfielder"),
        v.literal("forward")
      )
    ),
    jerseyNumber: v.optional(v.number()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    preferredFoot: v.optional(v.union(v.literal("left"), v.literal("right"), v.literal("both"))),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("injured"),
        v.literal("on_loan"),
        v.literal("inactive")
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check

    const { playerId, ...updates } = args;

    await ctx.db.patch(playerId, updates);

    return null;
  },
});

/**
 * Transfer player to another category
 */
export const transferPlayer = mutation({
  args: {
    playerId: v.id("players"),
    toCategoryId: v.id("categories"),
    transferType: v.union(
      v.literal("promotion"),
      v.literal("transfer"),
      v.literal("loan"),
      v.literal("trial")
    ),
    fee: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("playerTransfers"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add authorization check

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const toCategory = await ctx.db.get(args.toCategoryId);
    if (!toCategory) throw new Error("Target category not found");

    // Create transfer record
    const transferId = await ctx.db.insert("playerTransfers", {
      playerId: args.playerId,
      fromCategoryId: player.currentCategoryId,
      toCategoryId: args.toCategoryId,
      transferDate: new Date().toISOString(),
      transferType: args.transferType,
      fee: args.fee,
      notes: args.notes,
    });

    // Update player's current category
    await ctx.db.patch(args.playerId, {
      currentCategoryId: args.toCategoryId,
    });

    return transferId;
  },
});

/**
 * List players by club slug
 */
export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      fullName: v.string(),
      avatarUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      position: v.optional(
        v.union(
          v.literal("goalkeeper"),
          v.literal("defender"),
          v.literal("midfielder"),
          v.literal("forward")
        )
      ),
      jerseyNumber: v.optional(v.number()),
      status: v.union(
        v.literal("active"),
        v.literal("injured"),
        v.literal("on_loan"),
        v.literal("inactive")
      ),
      currentCategoryId: v.optional(v.id("categories")),
      categoryName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return [];
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_clubId", (q) => q.eq("clubId", club._id))
      .collect();

    const categoryIds = categories.map((c) => c._id);

    const allPlayers: Array<{
      _id: Id<"players">;
      _creationTime: number;
      profileId: Id<"profiles">;
      fullName: string;
      avatarUrl: string | undefined;
      dateOfBirth: string | undefined;
      position: "goalkeeper" | "defender" | "midfielder" | "forward" | undefined;
      jerseyNumber: number | undefined;
      status: "active" | "injured" | "on_loan" | "inactive";
      currentCategoryId: Id<"categories"> | undefined;
      categoryName: string | undefined;
    }> = [];

    for (const categoryId of categoryIds) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_currentCategoryId", (q) =>
          q.eq("currentCategoryId", categoryId)
        )
        .collect();

      for (const player of players) {
        const profile = await ctx.db.get(player.profileId);
        const category = await ctx.db.get(categoryId);

        allPlayers.push({
          _id: player._id,
          _creationTime: player._creationTime,
          profileId: player.profileId,
          fullName: profile?.displayName || profile?.email || "Unknown",
          avatarUrl: profile?.avatarUrl,
          dateOfBirth: profile?.dateOfBirth,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          status: player.status,
          currentCategoryId: player.currentCategoryId,
          categoryName: category ? category.name : undefined,
        });
      }
    }

    return allPlayers;
  },
});

/**
 * Get player by ID with full details
 */
export const getById = query({
  args: { playerId: v.id("players") },
  returns: v.union(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      currentCategoryId: v.optional(v.id("categories")),
      position: v.optional(
        v.union(
          v.literal("goalkeeper"),
          v.literal("defender"),
          v.literal("midfielder"),
          v.literal("forward")
        )
      ),
      jerseyNumber: v.optional(v.number()),
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      preferredFoot: v.optional(v.union(v.literal("left"), v.literal("right"), v.literal("both"))),
      status: v.union(
        v.literal("active"),
        v.literal("injured"),
        v.literal("on_loan"),
        v.literal("inactive")
      ),
      nationality: v.optional(v.string()),
      secondNationality: v.optional(v.string()),
      joinedDate: v.optional(v.string()),
      profileData: v.optional(
        v.object({
          displayName: v.optional(v.string()),
          email: v.string(),
          avatarUrl: v.optional(v.string()),
          dateOfBirth: v.optional(v.string()),
          phoneNumber: v.optional(v.string()),
        })
      ),
      categoryData: v.optional(
        v.object({
          name: v.string(),
          clubName: v.string(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return null;
    }

    const profile = await ctx.db.get(player.profileId);

    let categoryData;
    if (player.currentCategoryId) {
      const category = await ctx.db.get(player.currentCategoryId);
      if (category) {
        const club = await ctx.db.get(category.clubId);
        categoryData = {
          name: category.name,
          clubName: club?.name || "Unknown",
        };
      }
    }

    return {
      ...player,
      profileData: profile
        ? {
            displayName: profile.displayName,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            dateOfBirth: profile.dateOfBirth,
            phoneNumber: profile.phoneNumber,
          }
        : undefined,
      categoryData,
    };
  },
});

/**
 * List players by category ID
 */
export const listByCategoryId = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      fullName: v.string(),
      avatarUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      position: v.optional(
        v.union(
          v.literal("goalkeeper"),
          v.literal("defender"),
          v.literal("midfielder"),
          v.literal("forward")
        )
      ),
      jerseyNumber: v.optional(v.number()),
      status: v.union(
        v.literal("active"),
        v.literal("injured"),
        v.literal("on_loan"),
        v.literal("inactive")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_currentCategoryId", (q) =>
        q.eq("currentCategoryId", args.categoryId)
      )
      .collect();

    const enrichedPlayers: Array<{
      _id: Id<"players">;
      _creationTime: number;
      profileId: Id<"profiles">;
      fullName: string;
      avatarUrl: string | undefined;
      dateOfBirth: string | undefined;
      position: "goalkeeper" | "defender" | "midfielder" | "forward" | undefined;
      jerseyNumber: number | undefined;
      status: "active" | "injured" | "on_loan" | "inactive";
    }> = await Promise.all(
      players.map(async (player) => {
        const profile = await ctx.db.get(player.profileId);

        return {
          _id: player._id,
          _creationTime: player._creationTime,
          profileId: player.profileId,
          fullName: profile?.displayName || profile?.email || "Unknown",
          avatarUrl: profile?.avatarUrl,
          dateOfBirth: profile?.dateOfBirth,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          status: player.status,
        };
      })
    );

    return enrichedPlayers;
  },
});

/**
 * Internal mutation to link Clerk account to player profile
 */
export const linkClerkAccountToPlayer = internalMutation({
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
 * Internal action to create Clerk account for player
 */
export const createClerkAccountForPlayer = internalMutation({
  args: {
    profileId: v.id("profiles"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // This will be called by the action created in users.ts
    // Just a placeholder for now
    return null;
  },
});