import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";
import { hasOrgAdminAccess } from "./lib/permissions";
import { Id } from "./_generated/dataModel";

const feeStatus = v.union(
  v.literal("pending"),
  v.literal("partially_paid"),
  v.literal("paid"),
);

const feeValidator = v.object({
  _id: v.id("fees"),
  _creationTime: v.number(),
  applicationId: v.id("applications"),
  name: v.string(),
  description: v.optional(v.string()),
  totalAmount: v.number(),
  downPaymentPercent: v.number(),
  isRefundable: v.boolean(),
  isIncluded: v.boolean(),
  isDefault: v.boolean(),
  isRequired: v.boolean(),
  status: feeStatus,
  paidAmount: v.number(),
  createdAt: v.number(),
  paidAt: v.optional(v.number()),
  createdBy: v.id("users"),
});

/**
 * Helper to verify user has access to an application (owner or org admin).
 */
async function verifyApplicationAccess(
  ctx: QueryCtx | MutationCtx,
  applicationId: Id<"applications">,
  userId: Id<"users">,
  requireAdmin: boolean = false,
) {
  const application = await ctx.db.get(applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  const isOwner = application.userId === userId;
  const isAdmin = await hasOrgAdminAccess(
    ctx,
    userId,
    application.organizationId,
  );

  if (requireAdmin && !isAdmin) {
    throw new Error("Admin access required");
  }

  if (!isOwner && !isAdmin) {
    throw new Error("Unauthorized");
  }

  return { application, isOwner, isAdmin };
}

/**
 * Get all fees for an application.
 */
export const getByApplication = query({
  args: { applicationId: v.id("applications") },
  returns: v.array(feeValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await verifyApplicationAccess(ctx, args.applicationId, user._id);

    return await ctx.db
      .query("fees")
      .withIndex("byApplication", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .collect();
  },
});

/**
 * Get fee summary (totals) for an application.
 */
export const getSummary = query({
  args: { applicationId: v.id("applications") },
  returns: v.object({
    totalDue: v.number(),
    totalPaid: v.number(),
    totalPending: v.number(),
    feeCount: v.number(),
    paidCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await verifyApplicationAccess(ctx, args.applicationId, user._id);

    const fees = await ctx.db
      .query("fees")
      .withIndex("byApplication", (q) =>
        q.eq("applicationId", args.applicationId),
      )
      .collect();

    const totalDue = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const paidCount = fees.filter((fee) => fee.status === "paid").length;

    return {
      totalDue,
      totalPaid,
      totalPending: totalDue - totalPaid,
      feeCount: fees.length,
      paidCount,
    };
  },
});

/**
 * Create a new fee for an application (admin only).
 */
export const create = mutation({
  args: {
    applicationId: v.id("applications"),
    name: v.string(),
    description: v.optional(v.string()),
    totalAmount: v.number(), // In cents
    downPaymentPercent: v.number(), // 0-100
    isRefundable: v.boolean(),
    isIncluded: v.boolean(),
    isRequired: v.boolean(),
  },
  returns: v.id("fees"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await verifyApplicationAccess(ctx, args.applicationId, user._id, true);

    if (args.totalAmount <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    if (args.downPaymentPercent < 0 || args.downPaymentPercent > 100) {
      throw new Error("Down payment percent must be between 0 and 100");
    }

    return await ctx.db.insert("fees", {
      applicationId: args.applicationId,
      name: args.name,
      description: args.description,
      totalAmount: args.totalAmount,
      downPaymentPercent: args.downPaymentPercent,
      isRefundable: args.isRefundable,
      isIncluded: args.isIncluded,
      isDefault: false,
      isRequired: args.isRequired,
      status: "pending",
      paidAmount: 0,
      createdAt: Date.now(),
      createdBy: user._id,
    });
  },
});

/**
 * Create default fees for an application (admin only).
 * Used when setting up fees for a new application.
 */
export const createDefaults = mutation({
  args: {
    applicationId: v.id("applications"),
    fees: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        totalAmount: v.number(),
        downPaymentPercent: v.number(),
        isRefundable: v.boolean(),
        isIncluded: v.boolean(),
        isRequired: v.boolean(),
      }),
    ),
  },
  returns: v.array(v.id("fees")),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await verifyApplicationAccess(ctx, args.applicationId, user._id, true);

    const feeIds: Id<"fees">[] = [];

    for (const fee of args.fees) {
      const feeId = await ctx.db.insert("fees", {
        applicationId: args.applicationId,
        name: fee.name,
        description: fee.description,
        totalAmount: fee.totalAmount,
        downPaymentPercent: fee.downPaymentPercent,
        isRefundable: fee.isRefundable,
        isIncluded: fee.isIncluded,
        isDefault: true,
        isRequired: fee.isRequired,
        status: "pending",
        paidAmount: 0,
        createdAt: Date.now(),
        createdBy: user._id,
      });
      feeIds.push(feeId);
    }

    return feeIds;
  },
});

/**
 * Remove a fee (admin only, non-default fees only).
 */
export const remove = mutation({
  args: { feeId: v.id("fees") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const fee = await ctx.db.get(args.feeId);

    if (!fee) {
      throw new Error("Fee not found");
    }

    await verifyApplicationAccess(ctx, fee.applicationId, user._id, true);

    if (fee.isDefault) {
      throw new Error("Cannot remove default fees");
    }

    if (fee.paidAmount > 0) {
      throw new Error("Cannot remove a fee that has payments");
    }

    await ctx.db.delete(args.feeId);
    return null;
  },
});

/**
 * Record a manual payment (admin only - cash/wire).
 */
export const recordManualPayment = mutation({
  args: {
    feeId: v.id("fees"),
    amount: v.number(), // In cents
    method: v.union(v.literal("cash"), v.literal("wire")),
    reference: v.optional(v.string()),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const fee = await ctx.db.get(args.feeId);

    if (!fee) {
      throw new Error("Fee not found");
    }

    await verifyApplicationAccess(ctx, fee.applicationId, user._id, true);

    if (fee.status === "paid") {
      throw new Error("Fee is already fully paid");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const remainingAmount = fee.totalAmount - fee.paidAmount;
    if (args.amount > remainingAmount) {
      throw new Error(
        `Amount exceeds remaining balance of ${remainingAmount} cents`,
      );
    }

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      applicationId: fee.applicationId,
      feeId: args.feeId,
      amount: args.amount,
      method: args.method,
      status: "completed",
      reference: args.reference || `${args.method.toUpperCase()}-${Date.now()}`,
      registeredBy: user._id,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Update fee
    const newPaidAmount = fee.paidAmount + args.amount;
    const newStatus =
      newPaidAmount >= fee.totalAmount ? "paid" : "partially_paid";

    await ctx.db.patch(args.feeId, {
      paidAmount: newPaidAmount,
      status: newStatus,
      ...(newStatus === "paid" ? { paidAt: Date.now() } : {}),
    });

    return transactionId;
  },
});

/**
 * Update a fee (admin only).
 * Cannot update totalAmount if the fee has any payments.
 */
export const update = mutation({
  args: {
    feeId: v.id("fees"),
    name: v.string(),
    totalAmount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const fee = await ctx.db.get(args.feeId);

    if (!fee) {
      throw new Error("Fee not found");
    }

    await verifyApplicationAccess(ctx, fee.applicationId, user._id, true);

    if (fee.isDefault) {
      throw new Error("Cannot edit default fees");
    }

    // Validate name
    if (args.name.trim().length === 0) {
      throw new Error("Fee name cannot be empty");
    }

    // If trying to update totalAmount, check if there are payments
    if (args.totalAmount !== undefined) {
      if (args.totalAmount <= 0) {
        throw new Error("Total amount must be greater than 0");
      }

      if (fee.paidAmount > 0) {
        throw new Error(
          "Cannot update total amount for a fee that has payments",
        );
      }
    }

    // Prepare update
    const updates: {
      name: string;
      totalAmount?: number;
    } = {
      name: args.name.trim(),
    };

    if (args.totalAmount !== undefined) {
      updates.totalAmount = args.totalAmount;
    }

    await ctx.db.patch(args.feeId, updates);
    return null;
  },
});

/**
 * Get minimum payment amount for selected fees.
 * Returns the sum of down payments for pending fees.
 */
export const getMinimumPayment = query({
  args: {
    feeIds: v.array(v.id("fees")),
  },
  returns: v.object({
    minimumAmount: v.number(),
    totalRemaining: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    let minimumAmount = 0;
    let totalRemaining = 0;

    for (const feeId of args.feeIds) {
      const fee = await ctx.db.get(feeId);
      if (!fee) continue;

      await verifyApplicationAccess(ctx, fee.applicationId, user._id);

      const remaining = fee.totalAmount - fee.paidAmount;
      if (remaining <= 0) continue;

      totalRemaining += remaining;

      // Minimum is the down payment percentage of the remaining amount
      const downPayment = Math.ceil((remaining * fee.downPaymentPercent) / 100);
      minimumAmount += downPayment > 0 ? downPayment : remaining;
    }

    return { minimumAmount, totalRemaining };
  },
});
