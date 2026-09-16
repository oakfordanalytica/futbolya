import { strFromU8, unzipSync } from "fflate";
import { IMAGE_UPLOAD_MAX_BYTES } from "@/lib/files/image-upload";

const REL_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const elements = (node: Document | Element, name: string) =>
  Array.from(node.getElementsByTagNameNS("*", name));
const children = (node: Element) =>
  Array.from(node.childNodes).filter(
    (child): child is Element => child.nodeType === 1,
  );
const first = (node: Document | Element, name: string) =>
  elements(node, name)[0];

/** Only the numbered photo boxes of the supplied template are supported. */
export function readRegistrationPhotos(bytes: Uint8Array) {
  let expanded = 0;
  let entries = 0;
  const files = unzipSync(bytes, {
    filter(entry) {
      expanded += entry.originalSize;
      if (++entries > 512 || expanded > 64 * 1024 * 1024)
        throw new Error("fileSizeError");
      return (
        entry.name.startsWith("xl/") &&
        entry.originalSize <=
          (entry.name.includes("/media/")
            ? IMAGE_UPLOAD_MAX_BYTES
            : 2 * 1024 * 1024)
      );
    },
  });
  const xml = (path: string) => {
    if (!files[path]) throw new Error("photoFormat");
    const source = strFromU8(files[path]);
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("photoFormat");
    const doc = new DOMParser().parseFromString(source, "application/xml");
    if (elements(doc, "parsererror").length) throw new Error("photoFormat");
    return doc;
  };
  const relationships = (path: string) => {
    const parts = path.split("/");
    const name = parts.pop()!;
    const relPath = [...parts, "_rels", `${name}.rels`].join("/");
    return files[relPath] ? elements(xml(relPath), "Relationship") : [];
  };
  const target = (path: string, id: string | null) => {
    const rel = relationships(path).find(
      (item) => item.getAttribute("Id") === id,
    );
    if (!rel || rel.getAttribute("TargetMode") === "External")
      throw new Error("photoFormat");
    const url = new URL(
      rel.getAttribute("Target")!,
      `https://xlsx.invalid/${path}`,
    );
    if (
      url.origin !== "https://xlsx.invalid" ||
      !url.pathname.startsWith("/xl/")
    )
      throw new Error("photoFormat");
    return decodeURIComponent(url.pathname.slice(1));
  };
  const photos = new Map<number, File>();
  let warning = false;
  try {
    const sheet = elements(xml("xl/workbook.xml"), "sheet").find(
      (item) => item.getAttribute("name") === "Fotografias",
    );
    if (!sheet) return { photos, warning: true };
    const path = target("xl/workbook.xml", sheet.getAttributeNS(REL_NS, "id"));
    const doc = xml(path);
    const drawings = elements(doc, "drawing");
    if (!drawings.length) {
      // New Excel in-cell images do not use drawing anchors.
      return {
        photos,
        warning:
          Boolean(first(doc, "legacyDrawing") || first(doc, "picture")) ||
          Object.keys(files).some((name) => /richData|cellimages/i.test(name)),
      };
    }
    const strings = files["xl/sharedStrings.xml"]
      ? elements(xml("xl/sharedStrings.xml"), "si").map((item) =>
          elements(item, "t")
            .map((t) => t.textContent)
            .join(""),
        )
      : [];
    const cells = new Map(
      elements(doc, "c").map((cell) => [
        cell.getAttribute("r"),
        cell.getAttribute("t") === "s"
          ? strings[Number(first(cell, "v")?.textContent)]
          : (first(cell, "t") ?? first(cell, "v"))?.textContent,
      ]),
    );
    const cols = elements(doc, "col");
    const rows = elements(doc, "row");
    const format = first(doc, "sheetFormatPr");
    const columnWidth = (col: number) => {
      const definition = cols.find(
        (item) =>
          Number(item.getAttribute("min")) <= col + 1 &&
          Number(item.getAttribute("max")) >= col + 1,
      );
      const width = Number(
        definition?.getAttribute("width") ??
          format?.getAttribute("defaultColWidth") ??
          8.43,
      );
      return Math.floor(((256 * width + Math.floor(128 / 7)) / 256) * 7);
    };
    const rowHeight = (row: number) =>
      (Number(
        rows
          .find((item) => Number(item.getAttribute("r")) === row + 1)
          ?.getAttribute("ht") ??
          format?.getAttribute("defaultRowHeight") ??
          15,
      ) *
        96) /
      72;
    const sum = (count: number, size: (index: number) => number) =>
      Array.from({ length: count }, (_, i) => size(i)).reduce(
        (a, b) => a + b,
        0,
      );
    const marker = (node: Element) => {
      const col = Number(first(node, "col")?.textContent);
      const row = Number(first(node, "row")?.textContent);
      if (
        !Number.isInteger(col) ||
        col < 0 ||
        col > 32 ||
        !Number.isInteger(row) ||
        row < 0 ||
        row > 50
      )
        throw new Error("photoFormat");
      return {
        x:
          sum(col, columnWidth) +
          Number(first(node, "colOff")?.textContent ?? 0) / 9525,
        y:
          sum(row, rowHeight) +
          Number(first(node, "rowOff")?.textContent ?? 0) / 9525,
      };
    };
    const boxes = Array.from({ length: 25 }, (_, index) => {
      const row = 3 + Math.floor(index / 8) * 9;
      const col = 1 + (index % 8) * 2;
      const label =
        cells.get(`${String.fromCharCode(65 + col)}${row + 1}`) ?? "";
      if (
        !new RegExp(`^Jugador\\s*No[.°º]?\\s*0*${index + 1}$`, "i").test(
          label.trim(),
        )
      )
        throw new Error("photoFormat");
      return {
        number: index + 1,
        left: sum(col, columnWidth),
        right: sum(col + 1, columnWidth),
        top: sum(row + 1, rowHeight),
        bottom: sum(row + 8, rowHeight),
      };
    });
    const seen = new Set<number>();
    for (const drawing of drawings) {
      const drawingPath = target(path, drawing.getAttributeNS(REL_NS, "id"));
      for (const anchor of children(xml(drawingPath).documentElement)) {
        let number: number | undefined;
        try {
          const from = first(anchor, "from");
          if (
            !from ||
            !["oneCellAnchor", "twoCellAnchor"].includes(anchor.localName)
          )
            throw new Error("photoFormat");
          const start = marker(from);
          const box = boxes.find(
            (item) =>
              start.x >= item.left - 2 &&
              start.x < item.right &&
              start.y >= item.top - 2 &&
              start.y < item.bottom,
          );
          if (!box) {
            warning = true;
            continue;
          }
          number = box.number;
          if (seen.has(number)) {
            photos.delete(number);
            warning = true;
            continue;
          }
          seen.add(number);
          const to = first(anchor, "to");
          const extent = children(anchor).find(
            (item) => item.localName === "ext",
          );
          const end = to
            ? marker(to)
            : {
                x: start.x + Number(extent?.getAttribute("cx")) / 9525,
                y: start.y + Number(extent?.getAttribute("cy")) / 9525,
              };
          if (
            !(
              end.x > start.x &&
              end.y > start.y &&
              end.x <= box.right + 2 &&
              end.y <= box.bottom + 2
            )
          )
            throw new Error("photoFormat");
          const pictures = elements(anchor, "pic");
          const crop = first(anchor, "srcRect");
          const transform = first(anchor, "xfrm");
          if (
            pictures.length !== 1 ||
            first(anchor, "grpSp") ||
            (crop &&
              Array.from(crop.attributes).some((a) => Number(a.value) !== 0)) ||
            ["rot", "flipH", "flipV"].some((key) => {
              const value = transform?.getAttribute(key);
              return value && value !== "0" && value !== "false";
            })
          )
            throw new Error("photoFormat");
          const imagePath = target(
            drawingPath,
            first(pictures[0], "blip")?.getAttributeNS(REL_NS, "embed") ?? null,
          );
          const data = files[imagePath];
          const type = data && imageContentType(data);
          if (!data?.length || !type) throw new Error("photoFormat");
          photos.set(
            number,
            new File(
              [Uint8Array.from(data)],
              `player-${number}.${type.split("/")[1]}`,
              { type },
            ),
          );
        } catch {
          if (number) photos.delete(number);
          warning = true;
        }
      }
    }
  } catch {
    photos.clear();
    warning = true;
  }
  return { photos, warning };
}

function imageContentType(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value))
    return "image/png";
  const signature = strFromU8(bytes.subarray(0, 12));
  if (signature.startsWith("GIF87a") || signature.startsWith("GIF89a"))
    return "image/gif";
  if (signature.startsWith("RIFF") && signature.slice(8) === "WEBP")
    return "image/webp";
}
