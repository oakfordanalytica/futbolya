export function hasTransparentPixels(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true;
  }
  return false;
}

/** Inspect an already-loaded image without downloading or modifying it. */
export function imageHasTransparency(image: HTMLImageElement): boolean {
  if (!image.naturalWidth || !image.naturalHeight) return false;
  // ponytail: a bounded thumbnail is enough for presentation; this is not
  // background segmentation or metadata used to re-encode the original.
  const scale = Math.min(
    1,
    256 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return false;
  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return hasTransparentPixels(
      context.getImageData(0, 0, canvas.width, canvas.height).data,
    );
  } catch {
    // If canvas access is restricted, keep the photo visible in its frame.
    return false;
  }
}
