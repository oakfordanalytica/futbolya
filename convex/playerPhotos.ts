import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import {
  cleanupPlayerPhotoHandler,
  preparePlayerPhotoHandler,
  registerPlayerPhotoHandler,
} from "./lib/players/photo_uploads";

// Both public mutations authorize the user against the target club.
export const prepare = mutation({
  args: { clubSlug: v.string(), sha256: v.string() },
  returns: v.object({
    uploadId: v.id("playerPhotoUploads"),
    uploadUrl: v.string(),
  }),
  handler: preparePlayerPhotoHandler,
});
export const register = mutation({
  args: { uploadId: v.id("playerPhotoUploads"), storageId: v.id("_storage") },
  returns: v.null(),
  handler: registerPlayerPhotoHandler,
});
export const cleanup = internalMutation({
  args: { uploadId: v.id("playerPhotoUploads") },
  returns: v.null(),
  handler: cleanupPlayerPhotoHandler,
});
