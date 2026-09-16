"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDivisionOptions } from "@/lib/soccer/categories";
import { normalizeSheetLabel } from "@/lib/players/registration-sheet";
import type { PlayerGender } from "./player-form-dialog.types";
import { ImportSelect, PlayerImportRow } from "./player-import-fields";
import { PlayerImportUpload } from "./player-import-upload";

import {
  usePlayerImportController,
  type PlayerImportProps,
} from "./use-player-import-controller";

export function PlayerImportDialog(props: PlayerImportProps) {
  const {
    clubName,
    ageCategories,
    enabledGenders,
    horizontalDivisions,
    positions,
  } = props;
  const t = useTranslations("Common");
  const {
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
  } = usePlayerImportController(props);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>{t("playerImport.title")}</DialogTitle>
          <DialogDescription>
            {t("playerImport.description", { club: clubName })}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {result ? (
            <Alert variant="success">
              <AlertDescription role="status">
                {t("playerImport.result", result)}
                {result.conflicts > 0 && (
                  <p>
                    {t("playerImport.resultConflicts", {
                      count: result.conflicts,
                    })}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
              {(!ageCategories.length ||
                !positions.length ||
                !enabledGenders.length) && (
                <Alert variant="warning">
                  <AlertDescription>
                    {t("playerImport.missingConfig")}
                  </AlertDescription>
                </Alert>
              )}
              <PlayerImportUpload
                fileName={fileName}
                busy={busy}
                hasSheet={Boolean(sheet)}
                error={error}
                onChooseFile={chooseFile}
              />
              {sheet && (
                <>
                  <Alert variant="secondary">
                    <AlertDescription>
                      {t("playerImport.sheetContext", {
                        club: sheet.club || "—",
                        category: sheet.category || "—",
                        gender: sheet.gender || "—",
                      })}
                      <p>{t("playerImport.reviewHelp")}</p>
                      <p>{t("playerImport.photoHelp")}</p>
                    </AlertDescription>
                  </Alert>
                  {sheet.photoWarning && (
                    <Alert variant="warning">
                      <AlertDescription>
                        {t("playerImport.photoWarning")}
                      </AlertDescription>
                    </Alert>
                  )}
                  {sheet.club &&
                    normalizeSheetLabel(sheet.club) !==
                      normalizeSheetLabel(clubName) && (
                      <Alert variant="warning">
                        <AlertDescription>
                          {t("playerImport.clubMismatch", { club: clubName })}
                        </AlertDescription>
                      </Alert>
                    )}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ImportSelect
                      label={t("players.category")}
                      value={category}
                      onChange={(value) => {
                        setCategory(value);
                        setReviewed(false);
                      }}
                      options={ageCategories.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                    />
                    <ImportSelect
                      label={t("players.gender")}
                      value={gender}
                      onChange={(value) => {
                        setGender(value as PlayerGender);
                        setReviewed(false);
                      }}
                      options={enabledGenders.map((value) => ({
                        value,
                        label: t(`players.genderOptions.${value}`),
                      }))}
                    />
                    {horizontalDivisions.enabled && (
                      <ImportSelect
                        label={t("categories.horizontalDivision")}
                        value={division}
                        onChange={(value) => {
                          setDivision(value);
                          setReviewed(false);
                        }}
                        options={getDivisionOptions(
                          horizontalDivisions.type,
                        ).map((value) => ({ value, label: value }))}
                      />
                    )}
                  </div>
                  {unknownPositions.map((original) => (
                    <ImportSelect
                      key={original}
                      label={t("playerImport.mapPosition", {
                        value: original || "—",
                      })}
                      value=""
                      options={positions.map((position) => ({
                        value: position.id,
                        label: position.name,
                      }))}
                      onChange={(position) => mapPosition(original, position)}
                    />
                  ))}
                  <p role="status" className="text-sm font-medium">
                    {t("playerImport.summary", {
                      ready: ready.length,
                      skipped,
                      invalid,
                      excluded,
                    })}
                  </p>
                  {!sheet.rows.length && <p>{t("playerImport.empty")}</p>}
                  {preview.map((item) => (
                    <PlayerImportRow
                      key={item.row.sourceRow}
                      preview={item}
                      positions={positions}
                      onChange={changeRow}
                    />
                  ))}
                  {ready.length > 0 && (
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={reviewed}
                        onChange={(event) => setReviewed(event.target.checked)}
                      />
                      {t("playerImport.confirmReview", { club: clubName })}
                    </label>
                  )}
                </>
              )}
            </fieldset>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription role="alert">
                {t(`playerImport.${error}`)}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t px-4 py-3 sm:px-6">
          <Button variant="outline" disabled={busy} onClick={close}>
            {t(result ? "playerImport.close" : "actions.cancel")}
          </Button>
          {!result && (
            <Button disabled={busy || !canSubmit} onClick={submit}>
              {busy
                ? t("actions.loading")
                : t("playerImport.submit", { count: ready.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
