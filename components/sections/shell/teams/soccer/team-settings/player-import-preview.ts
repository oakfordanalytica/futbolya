import {
  createPlayerIdentityIndex,
  getPlayerInputErrors,
  normalizePlayerInput,
  type PlayerIdentity,
  type PlayerInput,
} from "@/lib/players/input";
import type { RegistrationRow } from "@/lib/players/registration-sheet";

export function buildImportPreview(
  rows: RegistrationRow[],
  existing: PlayerIdentity[],
  gender: PlayerInput["gender"],
  positions: { id: string }[],
  today: string,
) {
  const identities = createPlayerIdentityIndex(existing);
  return rows.map((row) => {
    const input = normalizePlayerInput({
      firstName: row.firstName,
      lastName: row.lastName,
      secondLastName: row.secondLastName || undefined,
      dateOfBirth: row.dateOfBirth,
      documentNumber: row.documentNumber,
      cometNumber: row.cometNumber,
      position: row.position,
      gender,
      height: row.height.trim()
        ? Number(row.height.replace(",", "."))
        : undefined,
      weight: row.weight.trim()
        ? Number(row.weight.replace(",", "."))
        : undefined,
    });
    const errors = getPlayerInputErrors(input, today);
    if (
      !positions.some((position) => position.id === input.position) &&
      !errors.includes("position")
    )
      errors.push("position");
    const match = identities.match(input);
    if (row.included && match === "new")
      identities.add({ _id: `row:${row.sourceRow}`, ...input });
    const status = !row.included
      ? "excluded"
      : match !== "new"
        ? match
        : errors.length
          ? "invalid"
          : "ready";
    return { row, input, errors, status };
  });
}

export type ImportPreviewRow = ReturnType<typeof buildImportPreview>[number];
