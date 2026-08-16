export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const IMAGE_UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function isAllowedImageContentType(
  value: unknown,
): value is (typeof IMAGE_UPLOAD_CONTENT_TYPES)[number] {
  return (
    typeof value === "string" &&
    IMAGE_UPLOAD_CONTENT_TYPES.some((contentType) => contentType === value)
  );
}
