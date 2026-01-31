import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";

// ============================================================================
// VALIDATORS
// ============================================================================

const staffRole = v.union(
  v.literal("head_coach"),
  v.literal("technical_director"),
  v.literal("assistant_coach"),
);

const staffMemberValidator = v.object({
  _id: v.id("staff"),
  _creationTime: v.number(),
  userId: v.id("users"),
  fullName: v.string(),
  email: v.string(),
  avatarUrl: v.optional(v.string()),
  role: staffRole,
  categoryName: v.optional(v.string()),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all staff members for a club by slug.
 */
export const listAllByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.object({
    staff: v.array(staffMemberValidator),
  }),
  handler: async (ctx, args) => {
    const club = await ctx.db
      .query("clubs")
      .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
      .unique();

    if (!club) {
      return { staff: [] };
    }

    const staffMembers = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", club._id))
      .collect();

    // Batch fetch users and categories
    const userIds = [...new Set(staffMembers.map((s) => s.userId))];
    const categoryIds = [
      ...new Set(
        staffMembers.filter((s) => s.categoryId).map((s) => s.categoryId!),
      ),
    ];

    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const categories = await Promise.all(
      categoryIds.map((id) => ctx.db.get(id)),
    );

    const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u!]));
    const categoryMap = new Map(
      categories.filter(Boolean).map((c) => [c!._id, c!]),
    );

    const result: Array<{
      _id: Id<"staff">;
      _creationTime: number;
      userId: Id<"users">;
      fullName: string;
      email: string;
      avatarUrl?: string;
      role: "head_coach" | "technical_director" | "assistant_coach";
      categoryName?: string;
    }> = [];

    for (const staff of staffMembers) {
      const user = userMap.get(staff.userId);
      const category = staff.categoryId
        ? categoryMap.get(staff.categoryId)
        : undefined;

      if (!user) continue;

      result.push({
        _id: staff._id,
        _creationTime: staff._creationTime,
        userId: staff.userId,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        avatarUrl: user.imageUrl,
        role: staff.role,
        categoryName: category?.name,
      });
    }

    return { staff: result };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (called from webhooks)
// ============================================================================

/**
 * Create staff member from Clerk organization membership webhook.
 * Called when a user accepts an invitation that had staff metadata.
 */
export const createFromClerkMembership = internalMutation({
  args: {
    userId: v.id("users"),
    clubId: v.string(), // Convex ID as string from metadata
    staffRole: v.string(),
    categoryId: v.optional(v.string()), // Convex ID as string from metadata
  },
  returns: v.union(v.id("staff"), v.null()),
  handler: async (ctx, args) => {
    // Validate clubId
    const club = await ctx.db.get(args.clubId as Id<"clubs">);
    if (!club) {
      console.error(
        `[staff.createFromClerkMembership] Club not found: ${args.clubId}`,
      );
      return null;
    }

    // Validate staffRole
    const validRoles = ["head_coach", "technical_director", "assistant_coach"];
    if (!validRoles.includes(args.staffRole)) {
      console.error(
        `[staff.createFromClerkMembership] Invalid staffRole: ${args.staffRole}`,
      );
      return null;
    }

    // Validate categoryId if provided
    let categoryId: Id<"categories"> | undefined;
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId as Id<"categories">);
      if (!category) {
        console.error(
          `[staff.createFromClerkMembership] Category not found: ${args.categoryId}`,
        );
        // Continue without category, don't fail
      } else {
        categoryId = category._id;
      }
    }

    // Check if staff already exists for this user/club/role combination
    const existingStaff = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", club._id))
      .collect();

    const duplicate = existingStaff.find(
      (s) => s.userId === args.userId && s.role === args.staffRole,
    );

    if (duplicate) {
      console.log(
        `[staff.createFromClerkMembership] Staff already exists for user ${args.userId} with role ${args.staffRole}`,
      );
      return duplicate._id;
    }

    // Create the staff record
    const staffId = await ctx.db.insert("staff", {
      userId: args.userId,
      clubId: club._id,
      categoryId,
      role: args.staffRole as
        | "head_coach"
        | "technical_director"
        | "assistant_coach",
    });

    console.log(
      `[staff.createFromClerkMembership] Created staff ${staffId} for user ${args.userId}`,
    );
    return staffId;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Remove a staff member.
 */
export const removeStaff = mutation({
  args: { staffId: v.id("staff") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    await ctx.db.delete(args.staffId);

    return null;
  },
});
