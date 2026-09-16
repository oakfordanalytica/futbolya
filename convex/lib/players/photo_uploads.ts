import { ConvexError } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireClubAccess, requireClubAccessBySlug } from "../permissions";
import { deleteImageIfUnreferenced, requireAssignableImage } from "../files";

const UPLOAD_LIFETIME_MS = 60 * 60 * 1000;

export async function preparePlayerPhotoHandler(
  ctx: MutationCtx,
  args: { clubSlug: string; sha256: string },
) {
  const { user, club } = await requireClubAccessBySlug(ctx, args.clubSlug);
  if (!/^[a-f0-9]{64}$/.test(args.sha256))
    throw new ConvexError("Invalid image digest");
  const uploadId = await ctx.db.insert("playerPhotoUploads", {
    userId: user._id,
    clubId: club._id,
    sha256: args.sha256,
  });
  await ctx.scheduler.runAfter(
    UPLOAD_LIFETIME_MS,
    internal.playerPhotos.cleanup,
    { uploadId },
  );
  return { uploadId, uploadUrl: await ctx.storage.generateUploadUrl() };
}

export async function registerPlayerPhotoHandler(
  ctx: MutationCtx,
  args: { uploadId: Id<"playerPhotoUploads">; storageId: Id<"_storage"> },
) {
  const upload = await ctx.db.get(args.uploadId);
  if (!upload || upload._creationTime + UPLOAD_LIFETIME_MS <= Date.now())
    throw new ConvexError("Photo upload expired");
  const { user } = await requireClubAccess(ctx, upload.clubId);
  if (
    user._id !== upload.userId ||
    (upload.storageId && upload.storageId !== args.storageId)
  )
    throw new ConvexError("Invalid photo upload");
  const metadata = await ctx.db.system.get(args.storageId);
  if (
    !metadata ||
    metadata._creationTime < upload._creationTime ||
    metadata.sha256 !== upload.sha256
  )
    throw new ConvexError("Invalid photo upload");
  const existing = await ctx.db
    .query("playerPhotoUploads")
    .withIndex("byStorageId", (q) => q.eq("storageId", args.storageId))
    .unique();
  if (existing && existing._id !== upload._id)
    throw new ConvexError("Photo already registered");
  await requireAssignableImage(ctx, args.storageId, {
    uploadClubId: upload.clubId,
  });
  await ctx.db.patch(upload._id, { storageId: args.storageId });
  return null;
}

export async function consumePlayerPhotoUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  clubId: Id<"clubs">,
  required = false,
) {
  const upload = await ctx.db
    .query("playerPhotoUploads")
    .withIndex("byStorageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (!upload) {
    // Older open manual forms can still finish their existing upload flow.
    if (required) throw new ConvexError("Photo upload not registered");
    return;
  }
  const { user } = await requireClubAccess(ctx, clubId);
  if (
    upload.userId !== user._id ||
    upload.clubId !== clubId ||
    upload._creationTime + UPLOAD_LIFETIME_MS <= Date.now()
  )
    throw new ConvexError("Invalid photo upload");
  await ctx.db.delete(upload._id);
}

export async function cleanupPlayerPhotoHandler(
  ctx: MutationCtx,
  args: { uploadId: Id<"playerPhotoUploads"> },
) {
  const upload = await ctx.db.get(args.uploadId);
  if (upload) {
    // ponytail: only registered IDs can be cleaned safely. If POST responses
    // are lost in practice, add a storage-wide orphan reconciliation job.
    await deleteImageIfUnreferenced(ctx, upload.storageId);
    await ctx.db.delete(upload._id);
  }
  return null;
}
