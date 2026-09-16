"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegistrationRow } from "@/lib/players/registration-sheet";
import type { ImportPreviewRow } from "./player-import-preview";
import type { PositionOption } from "./player-form-dialog.types";

export function ImportSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

const inputFields = [
  "firstName",
  "lastName",
  "secondLastName",
  "dateOfBirth",
  "documentNumber",
  "cometNumber",
  "height",
  "weight",
] as const;

export function PlayerImportRow({
  preview,
  positions,
  onChange,
}: {
  preview: ImportPreviewRow;
  positions: PositionOption[];
  onChange: (sourceRow: number, changes: Partial<RegistrationRow>) => void;
}) {
  const t = useTranslations("Common");
  const { row, errors, status } = preview;
  const [photoUrl, setPhotoUrl] = useState<string>();
  useEffect(() => {
    if (!row.photo) {
      setPhotoUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(row.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [row.photo]);
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm">
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={t("playerImport.photoAlt", { name: row.originalName })}
            width={40}
            height={48}
            unoptimized
            className="mr-2 inline-block h-12 w-10 rounded object-contain align-middle"
          />
        )}
        <span className="font-medium">
          {t("playerImport.row", { row: row.sourceRow })}:{" "}
          {row.originalName || t("playerImport.unnamed")}
        </span>
        <span className="ml-2 text-muted-foreground">
          {t(`playerImport.status.${status}`)}
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.included}
            onChange={(event) =>
              onChange(row.sourceRow, { included: event.target.checked })
            }
          />
          {t("playerImport.includeRow")}
        </label>
        {row.photo && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(row.includePhoto)}
              disabled={
                !row.included || status === "existing" || status === "conflict"
              }
              onChange={(event) =>
                onChange(row.sourceRow, { includePhoto: event.target.checked })
              }
            />
            {t("playerImport.includePhoto", {
              number: row.registrationNumber ?? "—",
            })}
          </label>
        )}
        <p className="text-sm text-muted-foreground">
          {t("playerImport.originalBirth", { value: row.originalBirth || "—" })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("playerImport.originalIdentifiers", {
            document: row.originalDocument || "—",
            comet: row.originalComet || "—",
          })}
        </p>
        {status === "invalid" && (
          <p role="alert" className="text-sm text-destructive">
            {t("playerImport.invalidFields", {
              fields: errors.map((field) => t(`players.${field}`)).join(", "),
            })}
          </p>
        )}
        {status === "conflict" && (
          <p role="alert" className="text-sm text-destructive">
            {t("playerImport.conflictHelp")}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {inputFields.map((field) => {
            const id = `import-${row.sourceRow}-${field}`;
            const label =
              t(`players.${field}`) +
              (field === "height"
                ? " (cm)"
                : field === "weight"
                  ? " (kg)"
                  : "");
            return (
              <Field
                key={field}
                data-invalid={errors.includes(field) || undefined}
              >
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                <Input
                  id={id}
                  value={row[field]}
                  type={field === "dateOfBirth" ? "date" : "text"}
                  aria-invalid={errors.includes(field)}
                  maxLength={150}
                  onChange={(event) =>
                    onChange(row.sourceRow, { [field]: event.target.value })
                  }
                />
              </Field>
            );
          })}
          <ImportSelect
            label={t("players.position")}
            value={row.position}
            options={positions.map((position) => ({
              value: position.id,
              label: position.name,
            }))}
            onChange={(position) => onChange(row.sourceRow, { position })}
          />
        </div>
      </div>
    </details>
  );
}
