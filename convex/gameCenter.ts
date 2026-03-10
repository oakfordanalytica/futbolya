import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { hasOrgAdminAccess } from "./lib/permissions";

const gameMatchPhase = v.union(
  v.literal("first_half"),
  v.literal("halftime"),
  v.literal("second_half"),
  v.literal("finished"),
);

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

function resolveMatchPhase(game: {
  matchPhase?: "first_half" | "halftime" | "second_half" | "finished";
  matchEndedAt?: number;
  secondHalfStartedAt?: number;
  firstHalfEndedAt?: number;
  matchStartedAt?: number;
}) {
  if (game.matchPhase) {
    return game.matchPhase;
  }
  if (game.matchEndedAt) {
    return "finished" as const;
  }
  if (game.secondHalfStartedAt) {
    return "second_half" as const;
  }
  if (game.firstHalfEndedAt) {
    return "halftime" as const;
  }
  if (game.matchStartedAt) {
    return "first_half" as const;
  }
  return null;
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
      firstHalfStartedAt: Date.now(),
      matchPhase: "first_half",
      firstHalfAddedMinutes: game.firstHalfAddedMinutes ?? 0,
      secondHalfAddedMinutes: game.secondHalfAddedMinutes ?? 0,
      status: "in_progress",
    });

    return null;
  },
});

export const endFirstHalf = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);
    const phase = resolveMatchPhase(game);

    if (!game.matchStartedAt) {
      throw new Error("The match has not started yet");
    }
    if (game.matchEndedAt) {
      throw new Error("The match has already finished");
    }
    if (game.status === "cancelled") {
      throw new Error("Cancelled games cannot be updated");
    }
    if (phase !== "first_half") {
      throw new Error("Only first-half matches can be sent to halftime");
    }

    await ctx.db.patch(args.gameId, {
      firstHalfEndedAt: Date.now(),
      matchPhase: "halftime",
      status: "halftime",
    });

    return null;
  },
});

export const startSecondHalf = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);
    const phase = resolveMatchPhase(game);

    if (!game.matchStartedAt) {
      throw new Error("The match has not started yet");
    }
    if (game.matchEndedAt) {
      throw new Error("The match has already finished");
    }
    if (game.status === "cancelled") {
      throw new Error("Cancelled games cannot be updated");
    }
    if (phase !== "halftime") {
      throw new Error("Only halftime matches can start the second half");
    }

    await ctx.db.patch(args.gameId, {
      secondHalfStartedAt: Date.now(),
      matchPhase: "second_half",
      status: "in_progress",
    });

    return null;
  },
});

export const addStoppageTime = mutation({
  args: {
    gameId: v.id("games"),
    minutes: v.number(),
  },
  returns: gameMatchPhase,
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);
    const phase = resolveMatchPhase(game);

    if (
      !Number.isInteger(args.minutes) ||
      args.minutes <= 0 ||
      args.minutes > 30
    ) {
      throw new Error("Stoppage time must be an integer between 1 and 30");
    }
    if (game.status === "cancelled" || game.matchEndedAt) {
      throw new Error("This match cannot receive stoppage time");
    }
    if (phase !== "first_half" && phase !== "second_half") {
      throw new Error("Stoppage time can only be added during active halves");
    }

    if (phase === "first_half") {
      await ctx.db.patch(args.gameId, {
        firstHalfAddedMinutes: (game.firstHalfAddedMinutes ?? 0) + args.minutes,
      });
      return phase;
    }
    await ctx.db.patch(args.gameId, {
      secondHalfAddedMinutes: (game.secondHalfAddedMinutes ?? 0) + args.minutes,
    });
    return phase;
  },
});

export const finishMatch = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { game } = await requireGameCenterAdmin(ctx, args.gameId);
    const phase = resolveMatchPhase(game);

    if (!game.matchStartedAt) {
      throw new Error("The match has not started yet");
    }
    if (game.matchEndedAt) {
      throw new Error("The match has already finished");
    }
    if (game.status === "cancelled") {
      throw new Error("Cancelled games cannot be finished");
    }
    if (phase !== "second_half") {
      throw new Error("Only second-half matches can be finished");
    }

    await ctx.db.patch(args.gameId, {
      secondHalfEndedAt: Date.now(),
      matchEndedAt: Date.now(),
      matchPhase: "finished",
      status: "completed",
    });

    return null;
  },
});
