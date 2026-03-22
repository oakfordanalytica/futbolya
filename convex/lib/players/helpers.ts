import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { StoredGameStatus } from "@/lib/games/status";

export type PlayerCtx = QueryCtx | MutationCtx;

export function shouldIncludePlayerStatGame(game: {
  status: StoredGameStatus;
}) {
  return game.status !== "cancelled";
}

export function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    let candidate = "";

    if (host === "youtu.be") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      candidate = parts[0] ?? "";
    } else if (host.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") {
        candidate = parsed.searchParams.get("v") ?? "";
      } else {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts[0] === "shorts" || parts[0] === "embed") {
          candidate = parts[1] ?? "";
        }
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export async function getPlayerPhotoUrl(
  ctx: PlayerCtx,
  photoStorageId?: Id<"_storage">,
) {
  if (!photoStorageId) {
    return undefined;
  }

  return (await ctx.storage.getUrl(photoStorageId)) ?? undefined;
}

export async function getExistingPlayer(
  ctx: PlayerCtx,
  playerId: Id<"players">,
) {
  const player = await ctx.db.get(playerId);
  if (!player) {
    throw new Error("Player not found");
  }
  return player;
}

export async function deleteStoredFileIfPresent(
  ctx: MutationCtx,
  storageId?: Id<"_storage">,
) {
  if (storageId) {
    await ctx.storage.delete(storageId);
  }
}

export function buildPlayerBase(player: Doc<"players">, photoUrl?: string) {
  return {
    _id: player._id,
    _creationTime: player._creationTime,
    firstName: player.firstName,
    lastName: player.lastName,
    secondLastName: player.secondLastName,
    photoUrl,
    dateOfBirth: player.dateOfBirth,
    documentNumber: player.documentNumber,
    gender: player.gender,
    jerseyNumber: player.jerseyNumber,
    cometNumber: player.cometNumber,
    fifaId: player.fifaId,
    position: player.position,
    dominantProfile: player.dominantProfile,
    status: player.status,
    height: player.height,
    weight: player.weight,
    bioTitle: player.bioTitle,
    bioContent: player.bioContent,
    country: player.country,
    categoryId: player.categoryId,
  };
}

export async function buildCategoryMap(
  ctx: PlayerCtx,
  categoryIds: Array<Id<"categories">>,
) {
  const uniqueCategoryIds = [...new Set(categoryIds)];
  const categories = await Promise.all(
    uniqueCategoryIds.map((categoryId) => ctx.db.get(categoryId)),
  );

  return new Map(
    categories.filter(Boolean).map((category) => [category!._id, category!]),
  );
}

export function normalizeHighlightInput(args: { title: string; url: string }) {
  const trimmedTitle = args.title.trim();
  const trimmedUrl = args.url.trim();

  if (!trimmedTitle) {
    throw new Error("Highlight title is required");
  }
  if (!trimmedUrl) {
    throw new Error("Highlight URL is required");
  }

  const videoId = extractYouTubeVideoId(trimmedUrl);
  if (!videoId) {
    throw new Error("Only valid YouTube URLs are allowed");
  }

  return {
    trimmedTitle,
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
