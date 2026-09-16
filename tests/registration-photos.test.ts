import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import { unzipSync, zipSync, strToU8 } from "fflate";
import { readRegistrationPhotos } from "../lib/players/registration-photos";

Object.assign(globalThis, { DOMParser });
const original = readFileSync(
  new URL(
    "../public/PLANILLAS DE INSCRIPCION Y FOTOS TORNEO DE LAS AMERICAS 2026.xlsx",
    import.meta.url,
  ),
);
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=",
    "base64",
  ),
);
const relns = "http://schemas.openxmlformats.org/package/2006/relationships";
function picture(
  number = 1,
  options: {
    type?: string;
    crop?: boolean;
    column?: number;
    size?: number;
  } = {},
) {
  const col = options.column ?? 1 + ((number - 1) % 8) * 2;
  const row = 4 + Math.floor((number - 1) / 8) * 9;
  const type = options.type ?? "oneCellAnchor";
  return `<xdr:${type}><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>${type === "twoCellAnchor" ? `<xdr:to><xdr:col>${col}</xdr:col><xdr:colOff>571500</xdr:colOff><xdr:row>${row + 4}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>` : `<xdr:ext cx="${(options.size ?? 60) * 9525}" cy="857250"/>`}<xdr:pic><xdr:blipFill><a:blip r:embed="photo"/>${options.crop ? '<a:srcRect l="20000"/>' : ""}</xdr:blipFill></xdr:pic><xdr:clientData/></xdr:${type}>`;
}
function workbook(anchors: string, extra: Record<string, Uint8Array> = {}) {
  const files = unzipSync(original);
  const sheet = new TextDecoder()
    .decode(files["xl/worksheets/sheet2.xml"])
    .replace("</worksheet>", '<drawing r:id="photos"/></worksheet>');
  files["xl/worksheets/sheet2.xml"] = strToU8(sheet);
  files["xl/worksheets/_rels/sheet2.xml.rels"] = strToU8(
    `<Relationships xmlns="${relns}"><Relationship Id="photos" Target="../drawings/photos.xml" Type="drawing"/></Relationships>`,
  );
  files["xl/drawings/photos.xml"] = strToU8(
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`,
  );
  files["xl/drawings/_rels/photos.xml.rels"] = strToU8(
    `<Relationships xmlns="${relns}"><Relationship Id="photo" Target="../media/player.png" Type="image"/></Relationships>`,
  );
  files["xl/media/player.png"] = png;
  return zipSync({ ...files, ...extra });
}

test("blank official template never imports its header logos as player photos", () => {
  const result = readRegistrationPhotos(original);
  assert.equal(result.photos.size, 0);
  assert.equal(result.warning, false);
});
test("one-cell and two-cell anchors match numbered boxes, including 25", async () => {
  const { photos, warning } = readRegistrationPhotos(
    workbook(picture(1) + picture(9, { type: "twoCellAnchor" }) + picture(25)),
  );
  assert.equal(warning, false);
  assert.deepEqual([...photos.keys()], [1, 9, 25]);
  assert.equal(photos.get(25)?.type, "image/png");
  assert.deepEqual(new Uint8Array(await photos.get(1)!.arrayBuffer()), png);
});
test("duplicate photos invalidate the whole box without guessing", () => {
  const { photos, warning } = readRegistrationPhotos(
    workbook(picture() + picture() + picture()),
  );
  assert.equal(photos.size, 0);
  assert.equal(warning, true);
});
test("out-of-box, oversized, cropped, absolute and unsupported images are omitted", () => {
  for (const anchor of [
    picture(1, { column: 0 }),
    picture(1, { size: 300 }),
    picture(1, { crop: true }),
    picture(1, { type: "absoluteAnchor" }),
  ]) {
    const result = readRegistrationPhotos(workbook(anchor));
    assert.equal(result.photos.size, 0);
    assert.equal(result.warning, true);
  }
  for (const data of [strToU8("<svg/>"), new Uint8Array(2 * 1024 * 1024 + 1)]) {
    assert.equal(
      readRegistrationPhotos(
        workbook(picture(), { "xl/media/player.png": data }),
      ).photos.size,
      0,
    );
  }
});
test("external image relationships are never fetched", () => {
  const result = readRegistrationPhotos(
    workbook(picture(), {
      "xl/drawings/_rels/photos.xml.rels": strToU8(
        `<Relationships xmlns="${relns}"><Relationship Id="photo" Target="https://example.com/image.png" TargetMode="External"/></Relationships>`,
      ),
    }),
  );
  assert.equal(result.photos.size, 0);
  assert.equal(result.warning, true);
});
test("staff photos cannot become player photos", () => {
  const result = readRegistrationPhotos(workbook(picture(26)));
  assert.equal(result.photos.size, 0);
});
test("expanded ZIP payload is bounded before reading worksheet data", () => {
  const zipped = zipSync({ bomb: new Uint8Array(65 * 1024 * 1024) });
  assert.throws(() => readRegistrationPhotos(zipped), /fileSizeError/);
});
