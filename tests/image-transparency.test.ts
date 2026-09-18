import assert from "node:assert/strict";
import { test } from "node:test";
import { hasTransparentPixels } from "../lib/files/image-transparency";

test("detects alpha, not background color, including partial transparency", () => {
  assert.equal(
    hasTransparentPixels(
      new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]),
    ),
    false,
  );
  for (const alpha of [0, 128, 254]) {
    assert.equal(
      hasTransparentPixels(
        new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, alpha]),
      ),
      true,
    );
  }
});
