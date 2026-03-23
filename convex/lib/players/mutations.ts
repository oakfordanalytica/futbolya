import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import {
  deriveCategorySelectionFromExistingClubCategory,
  ensureClubCategoryForLeagueSelection,
  getClubLeagueCategoryConfig,
} from "../../lib/categories/helpers";
import {
  requireClubAccess,
  requireClubAccessBySlug,
} from "../../lib/permissions";
import {
  deleteStoredFileIfPresent,
  getExistingPlayer,
  normalizeHighlightInput,
} from "./helpers";

export async function generatePlayerUploadUrlHandler(ctx: MutationCtx) {
  await getCurrentUser(ctx);
  return await ctx.storage.generateUploadUrl();
}

export async function createPlayerHandler(
  ctx: MutationCtx,
  args: {
    clubSlug: string;
    firstName: string;
    lastName: string;
    secondLastName: string;
    photoStorageId?: Id<"_storage">;
    dateOfBirth: string;
    documentNumber: string;
    gender: "male" | "female" | "mixed";
    jerseyNumber?: number;
    leagueCategoryId: string;
    division?: string;
    cometNumber: string;
    fifaId?: string;
    position?: string;
    dominantProfile: "left" | "right" | "both";
    height?: number;
    weight?: number;
    country?: string;
  },
) {
  await getCurrentUser(ctx);

  const { club } = await requireClubAccessBySlug(ctx, args.clubSlug);
  const resolvedCategory = await ensureClubCategoryForLeagueSelection(ctx, {
    clubId: club._id,
    leagueCategoryId: args.leagueCategoryId,
    gender: args.gender,
    division: args.division,
  });

  return await ctx.db.insert("players", {
    firstName: args.firstName,
    lastName: args.lastName,
    secondLastName: args.secondLastName,
    photoStorageId: args.photoStorageId,
    dateOfBirth: args.dateOfBirth,
    documentNumber: args.documentNumber,
    gender: args.gender,
    jerseyNumber: args.jerseyNumber,
    clubId: club._id,
    categoryId: resolvedCategory.categoryId,
    sportType: "soccer",
    cometNumber: args.cometNumber,
    fifaId: args.fifaId,
    position: args.position,
    dominantProfile: args.dominantProfile,
    height: args.height,
    weight: args.weight,
    country: args.country,
    status: "active",
  });
}

export async function deletePlayerHandler(
  ctx: MutationCtx,
  args: { playerId: Id<"players"> },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  await deleteStoredFileIfPresent(ctx, player.photoStorageId);
  await ctx.db.delete(args.playerId);

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

  if (
    filteredUpdates.photoStorageId &&
    player.photoStorageId &&
    filteredUpdates.photoStorageId !== player.photoStorageId
  ) {
    await deleteStoredFileIfPresent(ctx, player.photoStorageId);
  }

  if (Object.keys(filteredUpdates).length > 0) {
    await ctx.db.patch(playerId, filteredUpdates);
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
