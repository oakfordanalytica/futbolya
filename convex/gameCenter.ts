import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { hasOrgAdminAccess } from "./lib/permissions";

function parseScheduledDateTime(date: string, startTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);

  return Number.isNaN(scheduledDateTime.getTime()) ? null : scheduledDateTime;
}

async function requireGameCenterAdmin(ctx: MutationCtx, gameId: Id<"games">) {
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const user = await getCurrentUser(ctx);
  if (user.isSuperAdmin) {
    return { user, game };
  }

  const isOrgAdmin = await hasOrgAdminAccess(
    ctx,
    user._id,
    game.organizationId,
  );
  if (!isOrgAdmin) {
    throw new Error("Admin access required");
  }

  return { user, game };
}

export const startMatch = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);

    if (game.status === "cancelled") {
      throw new Error("Cancelled games cannot be started");
    }
    if (game.matchEndedAt || game.status === "completed") {
      throw new Error("Completed matches cannot be restarted");
    }
    if (game.status !== "scheduled") {
      throw new Error("Only scheduled matches can be started");
    }
    if (game.matchStartedAt) {
      throw new Error("Match has already started");
    }

    const scheduledDateTime = parseScheduledDateTime(game.date, game.startTime);
    if (!scheduledDateTime) {
      throw new Error("Game schedule is invalid");
    }
    if (Date.now() < scheduledDateTime.getTime()) {
      throw new Error("The match cannot start before its scheduled time");
    }

    await ctx.db.patch(args.gameId, {
      matchStartedAt: Date.now(),
      status: "in_progress",
    });

    return null;
  },
});

export const finishMatch = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);

    if (!game.matchStartedAt) {
      throw new Error("The match has not started yet");
    }
    if (game.matchEndedAt) {
      throw new Error("The match has already finished");
    }
    if (game.status === "cancelled") {
      throw new Error("Cancelled games cannot be finished");
    }

    await ctx.db.patch(args.gameId, {
      matchEndedAt: Date.now(),
      status: "completed",
    });

    return null;
  },
});
