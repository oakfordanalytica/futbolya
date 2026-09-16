import { consumePlayerPhotoUpload } from "./photo_uploads";
import type { Infer } from "convex/values";
import { createPlayerArgs } from "./validators";
import { ConvexError } from "convex/values";
import {
  createPlayerIdentityIndex,
  normalizePlayerIdentifier,
} from "@/lib/players/input";
import {
  getClubPlayerIdentities,
  getPlayerPositions,
  insertPlayer,
  validatePlayerInput,
  validatePlayerChanges,
} from "./write_helpers";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import {
  deleteImageIfUnreferenced,
  requireAssignableImage,
} from "../../lib/files";
import {
  deriveCategorySelectionFromExistingClubCategory,
  ensureClubCategoryForLeagueSelection,
  getClubLeagueCategoryConfig,
} from "../../lib/categories/helpers";
import {
  requireClubAccess,
  requireClubAccessBySlug,
} from "../../lib/permissions";
import { getExistingPlayer, normalizeHighlightInput } from "./helpers";

export async function generatePlayerUploadUrlHandler(
  ctx: MutationCtx,
  args: { clubSlug: string },
) {
  await requireClubAccessBySlug(ctx, args.clubSlug);
  return await ctx.storage.generateUploadUrl();
}

export async function createPlayerHandler(
  ctx: MutationCtx,
  args: Infer<typeof createPlayerArgs>,
) {
  const { clubSlug, leagueCategoryId, division, photoStorageId, ...fields } =
    args;
  const { club } = await requireClubAccessBySlug(ctx, clubSlug);
  const [existing, positions] = await Promise.all([
    getClubPlayerIdentities(ctx, club._id),
    getPlayerPositions(ctx, club.organizationId),
  ]);
  if (createPlayerIdentityIndex(existing).match(fields) !== "new") {
    throw new ConvexError({ code: "PLAYER_EXISTS" });
  }
  const input = validatePlayerInput(fields, positions);
  if (photoStorageId) {
    await requireAssignableImage(ctx, photoStorageId, {
      uploadClubId: club._id,
    });
    await consumePlayerPhotoUpload(ctx, photoStorageId, club._id);
  }
  const resolvedCategory = await ensureClubCategoryForLeagueSelection(ctx, {
    clubId: club._id,
    leagueCategoryId,
    gender: args.gender,
    division,
  });

  return await insertPlayer(
    ctx,
    club._id,
    resolvedCategory.categoryId,
    input,
    photoStorageId,
  );
}

export async function deletePlayerHandler(
  ctx: MutationCtx,
  args: { playerId: Id<"players"> },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  await ctx.db.delete(args.playerId);
  await deleteImageIfUnreferenced(ctx, player.photoStorageId);

  return null;
}

export async function updatePlayerHandler(
  ctx: MutationCtx,
  args: {
    playerId: Id<"players">;
    firstName?: string;
    lastName?: string;
    secondLastName?: string;
    photoStorageId?: Id<"_storage">;
    dateOfBirth?: string;
    documentNumber?: string;
    gender?: "male" | "female" | "mixed";
    jerseyNumber?: number;
    cometNumber?: string;
    fifaId?: string;
    position?: string;
    dominantProfile?: "left" | "right" | "both";
    height?: number;
    weight?: number;
    country?: string;
    status?: "active" | "inactive";
    leagueCategoryId?: string;
    division?: string;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  await validatePlayerChanges(ctx, player, args);

  if (args.documentNumber !== undefined || args.cometNumber !== undefined) {
    const identity = {
      documentNumber: args.documentNumber ?? player.documentNumber,
      cometNumber: args.cometNumber ?? player.cometNumber,
    };
    const existing = await getClubPlayerIdentities(ctx, player.clubId);
    if (
      createPlayerIdentityIndex(
        existing.filter((other) => other._id !== player._id),
      ).match(identity) !== "new"
    ) {
      throw new ConvexError({ code: "PLAYER_EXISTS" });
    }
    for (const key of ["documentNumber", "cometNumber"] as const) {
      if (args[key] !== undefined) {
        args[key] = normalizePlayerIdentifier(args[key]);
      }
    }
  }

  const nextPhotoStorageId = args.photoStorageId;
  const isPhotoReplacement =
    nextPhotoStorageId !== undefined &&
    nextPhotoStorageId !== player.photoStorageId;
  if (isPhotoReplacement) {
    await requireAssignableImage(ctx, nextPhotoStorageId, {
      playerId: player._id,
      uploadClubId: player.clubId,
    });
    await consumePlayerPhotoUpload(ctx, nextPhotoStorageId, player.clubId);
  }

  const { playerId, leagueCategoryId, division, ...updates } = args;
  const filteredUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      filteredUpdates[key] = value;
    }
  }

  const shouldResyncCategory =
    Boolean(leagueCategoryId) ||
    division !== undefined ||
    (args.gender !== undefined && args.gender !== player.gender);

  if (shouldResyncCategory) {
    const currentCategory = await ctx.db.get(player.categoryId);
    if (!currentCategory) {
      throw new Error("Current player category not found");
    }

    const { ageCategories } = await getClubLeagueCategoryConfig(
      ctx,
      player.clubId,
    );
    const currentSelection = deriveCategorySelectionFromExistingClubCategory({
      ageCategories,
      category: currentCategory,
    });

    const targetLeagueCategoryId =
      leagueCategoryId ?? currentSelection.leagueCategoryId;
    if (!targetLeagueCategoryId) {
      throw new Error(
        "Current player category is no longer available in league settings. Select a new category.",
      );
    }

    const resolvedCategory = await ensureClubCategoryForLeagueSelection(ctx, {
      clubId: player.clubId,
      leagueCategoryId: targetLeagueCategoryId,
      gender: args.gender ?? player.gender ?? currentCategory.gender,
      division: division ?? currentSelection.division,
    });
    filteredUpdates.categoryId = resolvedCategory.categoryId;
    filteredUpdates.clubId = player.clubId;
  }

  if (Object.keys(filteredUpdates).length > 0) {
    await ctx.db.patch(playerId, filteredUpdates);
  }
  if (isPhotoReplacement) {
    await deleteImageIfUnreferenced(ctx, player.photoStorageId);
  }

  return null;
}

export async function updatePlayerBioHandler(
  ctx: MutationCtx,
  args: {
    playerId: Id<"players">;
    bioTitle: string;
    bioContent: string;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  await ctx.db.patch(args.playerId, {
    bioTitle: args.bioTitle.trim(),
    bioContent: args.bioContent.trim(),
  });

  return null;
}

export async function addPlayerHighlightHandler(
  ctx: MutationCtx,
  args: {
    playerId: Id<"players">;
    title: string;
    url: string;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  const { trimmedTitle, normalizedUrl, videoId } =
    normalizeHighlightInput(args);
  const currentHighlights = player.highlights ?? [];

  if (currentHighlights.some((highlight) => highlight.videoId === videoId)) {
    throw new Error("This highlight already exists for the player");
  }
  if (currentHighlights.length >= 20) {
    throw new Error("Maximum number of highlights reached");
  }

  await ctx.db.patch(args.playerId, {
    highlights: [
      ...currentHighlights,
      {
        id: `${Date.now()}-${videoId}`,
        title: trimmedTitle,
        url: normalizedUrl,
        videoId,
      },
    ],
  });

  return null;
}

export async function updatePlayerHighlightHandler(
  ctx: MutationCtx,
  args: {
    playerId: Id<"players">;
    highlightId: string;
    title: string;
    url: string;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  const { trimmedTitle, normalizedUrl, videoId } =
    normalizeHighlightInput(args);
  const currentHighlights = player.highlights ?? [];
  const highlightIndex = currentHighlights.findIndex(
    (highlight) => highlight.id === args.highlightId,
  );

  if (highlightIndex === -1) {
    throw new Error("Highlight not found");
  }
  if (
    currentHighlights.some(
      (highlight) =>
        highlight.id !== args.highlightId && highlight.videoId === videoId,
    )
  ) {
    throw new Error("This highlight already exists for the player");
  }

  const updatedHighlights = [...currentHighlights];
  updatedHighlights[highlightIndex] = {
    ...updatedHighlights[highlightIndex],
    title: trimmedTitle,
    url: normalizedUrl,
    videoId,
  };

  await ctx.db.patch(args.playerId, {
    highlights: updatedHighlights,
  });

  return null;
}

export async function removePlayerHighlightHandler(
  ctx: MutationCtx,
  args: {
    playerId: Id<"players">;
    highlightId: string;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  const currentHighlights = player.highlights ?? [];
  if (
    !currentHighlights.some((highlight) => highlight.id === args.highlightId)
  ) {
    throw new Error("Highlight not found");
  }

  await ctx.db.patch(args.playerId, {
    highlights: currentHighlights.filter(
      (highlight) => highlight.id !== args.highlightId,
    ),
  });

  return null;
}
