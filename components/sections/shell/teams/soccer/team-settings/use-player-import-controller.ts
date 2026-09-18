"use client";
import { uploadPlayerPhoto } from "@/lib/files/upload-player-photo";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PlayerIdentity } from "@/lib/players/input";
import {
  normalizeSheetLabel,
  readRegistrationFile,
  type RegistrationRow,
  type RegistrationSheet,
} from "@/lib/players/registration-sheet";
import type {
  PlayerFormDialogProps,
  PlayerGender,
} from "./player-form-dialog.types";
import { buildImportPreview } from "./player-import-preview";

export type PlayerImportProps = Pick<
  PlayerFormDialogProps,
  "ageCategories" | "enabledGenders" | "horizontalDivisions" | "positions"
> & {
  clubId: Id<"clubs">;
  clubSlug: string;
  clubName: string;
  organizationSlug: string;
  existingPlayers: PlayerIdentity[];
  onClose: () => void;
};

export function usePlayerImportController({
  clubId,
  clubSlug,
  organizationSlug,
  existingPlayers,
  ageCategories,
  enabledGenders,
  horizontalDivisions,
  positions,
  onClose,
}: PlayerImportProps) {
  const importPlayers = useMutation(api.players.importPlayers);
  const preparePhoto = useMutation(api.playerPhotos.prepare);
  const registerPhoto = useMutation(api.playerPhotos.register);
  const [sheet, setSheet] = useState<RegistrationSheet | null>(null);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState<PlayerGender | "">(
    enabledGenders.length === 1 ? enabledGenders[0] : "",
  );
  const [division, setDivision] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    conflicts: number;
  } | null>(null);

  const preview = buildImportPreview(
    sheet?.rows ?? [],
    existingPlayers,
    gender || "male",
    positions,
    new Date().toISOString().slice(0, 10),
  );
  const ready = preview.filter((item) => item.status === "ready");
  const skipped = preview.filter((item) => item.status === "existing").length;
  const invalid = preview.filter(
    (item) => item.status === "invalid" || item.status === "conflict",
  ).length;
  const excluded = preview.filter((item) => item.status === "excluded").length;
  const canSubmit =
    ready.length > 0 &&
    !invalid &&
    reviewed &&
    !!category &&
    !!gender &&
    (!horizontalDivisions.enabled || !!division);
  const unknownPositions = [
    ...new Set(
      (sheet?.rows ?? [])
        .filter((row) => row.included && !row.position)
        .map((row) => row.originalPosition),
    ),
  ];

  async function chooseFile(file?: File) {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFileName(file.name);
    setError("");
    setSheet(null);
    setReviewed(false);
    setResult(null);
    try {
      const next = await readRegistrationFile(file);
      next.rows = next.rows.map((row) => {
        const label = normalizeSheetLabel(row.originalPosition);
        const matches = positions.filter(
          (position) =>
            label &&
            [position.name, position.abbreviation].some(
              (value) => normalizeSheetLabel(value) === label,
            ),
        );
        return { ...row, position: matches.length === 1 ? matches[0].id : "" };
      });
      setSheet(next);
      const categories = ageCategories.filter(
        (item) =>
          normalizeSheetLabel(item.name) === normalizeSheetLabel(next.category),
      );
      setCategory(categories.length === 1 ? categories[0].id : "");
      const genderLabel = normalizeSheetLabel(next.gender);
      const parsedGender = (
        {
          masculino: "male",
          femenina: "female",
          femenino: "female",
          mixta: "mixed",
          mixto: "mixed",
        } as Record<string, PlayerGender>
      )[genderLabel];
      setGender(
        parsedGender && enabledGenders.includes(parsedGender)
          ? parsedGender
          : enabledGenders.length === 1
            ? enabledGenders[0]
            : "",
      );
      setDivision("");
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setError(
        [
          "templateError",
          "tooManyRows",
          "fileTypeError",
          "fileSizeError",
        ].includes(code)
          ? code
          : "readError",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function changeRow(sourceRow: number, changes: Partial<RegistrationRow>) {
    setSheet(
      (current) =>
        current && {
          ...current,
          rows: current.rows.map((row) =>
            row.sourceRow === sourceRow ? { ...row, ...changes } : row,
          ),
        },
    );
    setReviewed(false);
    setError("");
  }

  async function submit() {
    if (!canSubmit || busyRef.current || !gender) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const players = [];
      // Bound concurrent uploads to avoid flooding storage on larger sheets.
      for (let offset = 0; offset < ready.length; offset += 3) {
        const batch = await Promise.allSettled(
          ready.slice(offset, offset + 3).map(async ({ row, input }) => {
            const { gender: _gender, ...fields } = input;
            const photoStorageId =
              row.photo && row.includePhoto
                ? await uploadPlayerPhoto(
                    row.photo,
                    (sha256) => preparePhoto({ clubSlug, sha256 }),
                    registerPhoto,
                  )
                : undefined;
            return { sourceRow: row.sourceRow, ...fields, photoStorageId };
          }),
        );
        const failed = batch.find((result) => result.status === "rejected");
        if (failed) {
          setError("photoUploadError");
          return;
        }
        players.push(
          ...batch.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : [],
          ),
        );
      }
      const response = await importPlayers({
        clubId,
        organizationSlug,
        leagueCategoryId: category,
        gender,
        division: division || undefined,
        players,
      });
      setResult({
        imported: response.imported,
        skipped: skipped + response.skipped.length,
        conflicts: response.skipped.filter((row) => row.reason === "conflict")
          .length,
      });
    } catch {
      setError("saveError");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function mapPosition(original: string, position: string) {
    setSheet(
      (current) =>
        current && {
          ...current,
          rows: current.rows.map((row) =>
            row.originalPosition === original && !row.position
              ? { ...row, position }
              : row,
          ),
        },
    );
    setReviewed(false);
  }
  function close() {
    if (!busyRef.current) onClose();
  }
  return {
    sheet,
    fileName,
    category,
    gender,
    division,
    reviewed,
    busy,
    error,
    result,
    preview,
    ready,
    skipped,
    invalid,
    excluded,
    canSubmit,
    unknownPositions,
    chooseFile,
    changeRow,
    submit,
    setCategory,
    setGender,
    setDivision,
    setReviewed,
    mapPosition,
    close,
  };
}
