import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import { requireClubAccess } from "../../lib/permissions";
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
    firstName: string;
    lastName: string;
    secondLastName: string;
    photoStorageId?: Id<"_storage">;
    dateOfBirth: string;
    documentNumber: string;
    gender: "male" | "female" | "mixed";
    jerseyNumber?: number;
    categoryId: Id<"categories">;
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

  const category = await ctx.db.get(args.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  await requireClubAccess(ctx, category.clubId);

  return await ctx.db.insert("players", {
    firstName: args.firstName,
    lastName: args.lastName,
    secondLastName: args.secondLastName,
    photoStorageId: args.photoStorageId,
    dateOfBirth: args.dateOfBirth,
    documentNumber: args.documentNumber,
    gender: args.gender,
    jerseyNumber: args.jerseyNumber,
    clubId: category.clubId,
    categoryId: args.categoryId,
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
    categoryId?: Id<"categories">;
  },
) {
  await getCurrentUser(ctx);

  const player = await getExistingPlayer(ctx, args.playerId);
  await requireClubAccess(ctx, player.clubId);

  const { playerId, ...updates } = args;
  const filteredUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      filteredUpdates[key] = value;
    }
  }

  if (args.categoryId) {
    const targetCategory = await ctx.db.get(args.categoryId);
    if (!targetCategory) {
      throw new Error("Category not found");
    }

    await requireClubAccess(ctx, targetCategory.clubId);
    filteredUpdates.clubId = targetCategory.clubId;
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

  const { trimmedTitle, normalizedUrl, videoId } = normalizeHighlightInput(args);
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

  const { trimmedTitle, normalizedUrl, videoId } = normalizeHighlightInput(args);
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
  if (!currentHighlights.some((highlight) => highlight.id === args.highlightId)) {
    throw new Error("Highlight not found");
  }

  await ctx.db.patch(args.playerId, {
    highlights: currentHighlights.filter(
      (highlight) => highlight.id !== args.highlightId,
    ),
  });

  return null;
}
