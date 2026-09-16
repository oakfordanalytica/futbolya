import type { Id } from "@/convex/_generated/dataModel";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  isAllowedImageContentType,
} from "./image-upload";

type PreparedPhoto = { uploadId: Id<"playerPhotoUploads">; uploadUrl: string };
export async function uploadPlayerPhoto(
  file: File,
  prepare: (sha256: string) => Promise<PreparedPhoto>,
  register: (args: {
    uploadId: Id<"playerPhotoUploads">;
    storageId: Id<"_storage">;
  }) => Promise<null>,
): Promise<Id<"_storage">> {
  if (
    !file.size ||
    file.size > IMAGE_UPLOAD_MAX_BYTES ||
    !isAllowedImageContentType(file.type)
  )
    throw new Error("Invalid photo");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  const sha256 = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const { uploadId, uploadUrl } = await prepare(sha256);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error("Failed to upload photo");
  const { storageId } = await response.json();
  if (typeof storageId !== "string") throw new Error("Invalid upload response");
  await register({ uploadId, storageId: storageId as Id<"_storage"> });
  return storageId as Id<"_storage">;
}
