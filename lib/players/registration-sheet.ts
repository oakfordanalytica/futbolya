import { isPlayerBirthDate } from "./input";
import { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_PLAYERS } from "./import-limits";

type Cell = unknown;
export interface RegistrationRow {
  sourceRow: number;
  registrationNumber?: number;
  photo?: File;
  includePhoto?: boolean;
  originalName: string;
  originalBirth: string;
  originalPosition: string;
  originalDocument: string;
  originalComet: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  dateOfBirth: string;
  documentNumber: string;
  cometNumber: string;
  position: string;
  height: string;
  weight: string;
  included: boolean;
}
export interface RegistrationSheet {
  club: string;
  category: string;
  gender: string;
  rows: RegistrationRow[];
  photoWarning?: boolean;
}

export function normalizeSheetLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function text(value: Cell | undefined): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "excelNumber" in value)
    return String(value.excelNumber);
  if (["string", "number", "boolean"].includes(typeof value))
    return String(value).trim();
  throw new Error("templateError");
}

function identifier(value: Cell): string {
  const numeric =
    typeof value === "number" ||
    (typeof value === "object" && value !== null && "excelNumber" in value);
  const raw = text(value);
  // Excel numeric cells have limited precision. Do not silently accept a
  // potentially rounded identity; text cells retain long identifiers safely.
  if (numeric && !/^\d{1,15}$/.test(raw)) return "";
  return raw;
}

export function parseRegistrationDate(value: string, today: string): string {
  // Ambiguous dates use the template's Colombian day/month/year convention.
  // Never pass free-form text to Date.parse (browser/locale dependent).
  const iso = value.match(
    /(?:^|\s)(\d{4})-(\d{2})-(\d{2})(?=$|[\s,;]|[-–—]\s*(?:\p{L}|$))/u,
  );
  const local = value.match(
    /(?:^|\s)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?=$|[\s,;]|[-–—]\s*(?:\p{L}|$))/u,
  );
  let result = "";
  if (iso) result = `${iso[1]}-${iso[2]}-${iso[3]}`;
  else if (local) {
    let [, day, month, year] = local;
    // Accept month/day only when it cannot be mistaken for day/month.
    if (Number(month) > 12 && Number(day) <= 12) [day, month] = [month, day];
    result = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return isPlayerBirthDate(result, today) ? result : "";
}

export function parseRegistrationMeasure(
  value: string,
  kind: "height" | "weight",
): string {
  if (!value.trim()) return "";
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:[.,]\d+)?)\s*(cm|m|kg)?$/);
  if (!match) return value; // Keep invalid input visible for correction.
  const amount = Number(match[1].replace(",", "."));
  const unit = match[2];
  if (
    kind === "height" &&
    (unit === "m" || (!unit && amount > 0 && amount < 3))
  ) {
    return String(Math.round(amount * 10000) / 100);
  }
  if (
    (kind === "height" && (!unit || unit === "cm")) ||
    (kind === "weight" && (!unit || unit === "kg"))
  )
    return String(amount);
  return value;
}

export function parseRegistrationSheet(
  data: Cell[][],
  today: string,
): RegistrationSheet {
  const headers = [
    "No.",
    "Nombres y Apellidos",
    "Fecha y lugar de Nacimiento",
    "No.Documento de Identidad",
    "Posicion en el Campo",
    "Estatura",
    "Peso",
    "No.Comet",
  ].map(normalizeSheetLabel);
  const header = data.findIndex((row) =>
    headers.every(
      (expected, index) => normalizeSheetLabel(text(row[index])) === expected,
    ),
  );
  const end = data.findIndex(
    (row, index) =>
      index > header &&
      row.some((cell) => normalizeSheetLabel(text(cell)) === "cuerpotecnico"),
  );
  if (header < 0 || end < 0) throw new Error("templateError");
  const readMetadata = (label: string, untilColumn: number) => {
    for (const row of data.slice(0, header)) {
      const column = row.findIndex(
        (cell) =>
          normalizeSheetLabel(text(cell)) === normalizeSheetLabel(label),
      );
      if (column >= 0)
        return row
          .slice(column + 1, untilColumn)
          .map(text)
          .filter(Boolean)
          .join(" ");
    }
    return "";
  };
  const rows: RegistrationRow[] = [];
  for (let index = header + 1; index < end; index++) {
    const row = data[index];
    if (!row.slice(1, 8).some((cell) => text(cell))) continue;
    const originalName = text(row[1]);
    const names = originalName.split(/\s+/).filter(Boolean);
    // Suggestions only: the user must review the names before confirming.
    const surnameCount = names.length >= 4 ? 2 : Math.min(1, names.length - 1);
    const firstName = names.slice(0, names.length - surnameCount).join(" ");
    const surnames = names.slice(names.length - surnameCount);
    rows.push({
      sourceRow: index + 1,
      registrationNumber: /^\d+$/.test(text(row[0]))
        ? Number(text(row[0]))
        : undefined,
      originalName,
      originalBirth: text(row[2]),
      originalPosition: text(row[4]),
      originalDocument: text(row[3]),
      originalComet: text(row[7]),
      firstName,
      lastName: surnames[0] ?? "",
      secondLastName: surnames[1] ?? "",
      dateOfBirth: parseRegistrationDate(text(row[2]), today),
      documentNumber: identifier(row[3]),
      cometNumber: identifier(row[7]),
      position: "",
      height: parseRegistrationMeasure(text(row[5]), "height"),
      weight: parseRegistrationMeasure(text(row[6]), "weight"),
      included: true,
    });
  }
  if (rows.length > MAX_IMPORT_PLAYERS) throw new Error("tooManyRows");
  return {
    club: readMetadata("Nombre del Club", 4),
    category: readMetadata("Categoria", 4),
    gender: readMetadata("Rama", 10),
    rows,
  };
}

export async function readRegistrationFile(
  file: File,
): Promise<RegistrationSheet> {
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    throw new Error("fileTypeError");
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("fileSizeError");
  const [{ readSheet }, { readRegistrationPhotos }] = await Promise.all([
    import("read-excel-file/browser"),
    import("./registration-photos"),
  ]);
  const { photos, warning } = readRegistrationPhotos(
    new Uint8Array(await file.arrayBuffer()),
  );
  const data = await readSheet(file, "Planilla de Inscripcion", {
    parseNumber: (value) => ({ excelNumber: value }),
  });
  const sheet = parseRegistrationSheet(
    data,
    new Date().toISOString().slice(0, 10),
  );
  sheet.photoWarning = warning;
  for (const [number, photo] of photos) {
    const matches = sheet.rows.filter(
      (row) => row.registrationNumber === number,
    );
    if (matches.length !== 1) {
      sheet.photoWarning = true;
      continue;
    }
    // Decode one image at a time to bound browser bitmap memory.
    try {
      const bitmap = await createImageBitmap(photo);
      bitmap.close();
    } catch {
      sheet.photoWarning = true;
      continue;
    }
    matches[0].photo = photo;
    matches[0].includePhoto = true;
  }
  return sheet;
}
