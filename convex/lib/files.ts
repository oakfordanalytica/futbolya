import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  isAllowedImageContentType,
} from "@/lib/files/image-upload";

type ImageOwner = {
  clubId?: Id<"clubs">;
  playerId?: Id<"players">;
};

async function getImageReferences(ctx: MutationCtx, storageId: Id<"_storage">) {
  return await Promise.all([
    ctx.db
      .query("clubs")
      .withIndex("byLogoStorageId", (q) => q.eq("logoStorageId", storageId))
      .take(2),
    ctx.db
      .query("players")
      .withIndex("byPhotoStorageId", (q) => q.eq("photoStorageId", storageId))
      .take(2),
  ]);
}

export async function requireAssignableImage(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  owner: ImageOwner = {},
) {
  const metadata = await ctx.db.system.get(storageId);
  if (!metadata) {
    throw new Error("Uploaded image not found");
  }
  if (
    metadata.size <= 0 ||
    metadata.size > IMAGE_UPLOAD_MAX_BYTES ||
    !isAllowedImageContentType(metadata.contentType)
  ) {
    throw new Error(
      "Uploaded image must be a JPEG, PNG, WebP, or GIF up to 2 MB",
    );
  }

  const [clubs, players] = await getImageReferences(ctx, storageId);
  if (clubs.some((club) => club._id !== owner.clubId)) {
    throw new Error("Uploaded image is already assigned to another entity");
  }
  if (players.some((player) => player._id !== owner.playerId)) {
    throw new Error("Uploaded image is already assigned to another entity");
  }
}

export async function deleteImageIfUnreferenced(
  ctx: MutationCtx,
  storageId?: Id<"_storage">,
) {
  if (!storageId) {
    return;
  }

  const [clubs, players] = await getImageReferences(ctx, storageId);
  if (clubs.length === 0 && players.length === 0) {
    await ctx.storage.delete(storageId);
  }
}
