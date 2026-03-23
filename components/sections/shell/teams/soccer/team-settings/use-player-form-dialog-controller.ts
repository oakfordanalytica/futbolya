"use client";

import { format } from "date-fns";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { FileWithPreview } from "@/lib/files/upload";
import { findLeagueAgeCategoryByDateOfBirth } from "@/lib/soccer/categories";
import {
  buildPlayerMutationPayload,
  createPlayerFormValues,
  isPlayerFormValid,
  uploadPlayerPhoto,
} from "./player-form-dialog.helpers";
import type {
  PlayerFormDialogProps,
  PlayerFormValues,
  SetPlayerFormField,
} from "./player-form-dialog.types";

const FORM_RESET_DELAY_MS = 150;

export function usePlayerFormDialogController({
  open,
  onOpenChange,
  clubSlug,
  ageCategories,
  enabledGenders,
  horizontalDivisions,
  player,
}: Pick<
  PlayerFormDialogProps,
  | "open"
  | "onOpenChange"
  | "clubSlug"
  | "ageCategories"
  | "enabledGenders"
  | "horizontalDivisions"
  | "player"
>) {
  const createPlayer = useMutation(api.players.createPlayer);
  const updatePlayer = useMutation(api.players.updatePlayer);
  const generateUploadUrl = useMutation(api.players.generateUploadUrl);

  const isEditMode = Boolean(player);
  const [values, setValues] = useState<PlayerFormValues>(() =>
    createPlayerFormValues(player),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryManuallySelected, setIsCategoryManuallySelected] = useState(
    Boolean(player),
  );
  const resetTimeoutRef = useRef<number | null>(null);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    setValues(createPlayerFormValues(null));
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    clearResetTimeout();
    setValues(createPlayerFormValues(player, ageCategories));
    setIsSubmitting(false);
    setIsCategoryManuallySelected(Boolean(player));
  }, [clearResetTimeout, open, player]);

  useEffect(() => {
    if (
      !open ||
      !player ||
      ageCategories.length === 0 ||
      values.leagueCategoryId
    ) {
      return;
    }

    const nextValues = createPlayerFormValues(player, ageCategories);

    if (!nextValues.leagueCategoryId && !nextValues.division) {
      return;
    }

    setValues((current) => ({
      ...current,
      leagueCategoryId: current.leagueCategoryId || nextValues.leagueCategoryId,
      division: current.division || nextValues.division,
    }));
  }, [
    ageCategories,
    horizontalDivisions.enabled,
    open,
    player,
    values.leagueCategoryId,
  ]);

  useEffect(() => {
    if (
      !open ||
      isEditMode ||
      isCategoryManuallySelected ||
      !values.dateOfBirth ||
      values.leagueCategoryId ||
      ageCategories.length === 0
    ) {
      return;
    }

    const leagueCategory = findLeagueAgeCategoryByDateOfBirth(
      ageCategories,
      format(values.dateOfBirth, "yyyy-MM-dd"),
    );

    if (!leagueCategory) {
      return;
    }

    setValues((current) => ({
      ...current,
      leagueCategoryId: current.leagueCategoryId || leagueCategory.id,
    }));
  }, [
    ageCategories,
    isCategoryManuallySelected,
    isEditMode,
    open,
    values.dateOfBirth,
    values.leagueCategoryId,
  ]);

  useEffect(() => clearResetTimeout, [clearResetTimeout]);

  const setField = useCallback<SetPlayerFormField>((field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleFileChange = useCallback(
    (file: FileWithPreview | null) => {
      setField("photoFile", file);
    },
    [setField],
  );

  const handleDateOfBirthChange = useCallback(
    (date: Date | undefined) => {
      setField("dateOfBirth", date);

      if (isEditMode || isCategoryManuallySelected || !date) {
        if (!date && !isEditMode && !isCategoryManuallySelected) {
          setField("leagueCategoryId", "");
        }
        return;
      }

      const leagueCategory = findLeagueAgeCategoryByDateOfBirth(
        ageCategories,
        format(date, "yyyy-MM-dd"),
      );
      setField("leagueCategoryId", leagueCategory?.id ?? "");
    },
    [ageCategories, isCategoryManuallySelected, isEditMode, setField],
  );

  const handleLeagueCategoryChange = useCallback(
    (leagueCategoryId: string) => {
      setIsCategoryManuallySelected(true);
      setField("leagueCategoryId", leagueCategoryId);
    },
    [setField],
  );

  const isFormValid = useMemo(
    () => isPlayerFormValid(values, horizontalDivisions.enabled),
    [horizontalDivisions.enabled, values],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (
        !isFormValid ||
        !values.dateOfBirth ||
        !values.gender ||
        !values.dominantProfile ||
        !values.leagueCategoryId
      ) {
        return;
      }

      setIsSubmitting(true);

      try {
        const photoStorageId = await uploadPlayerPhoto(
          values.photoFile,
          generateUploadUrl,
        );
        if (isEditMode) {
          const payload = buildPlayerMutationPayload({
            values,
          });

          await updatePlayer({
            playerId: player!._id as Id<"players">,
            ...payload,
            ...(photoStorageId ? { photoStorageId } : {}),
          });
        } else {
          const payload = buildPlayerMutationPayload({
            values,
          });

          await createPlayer({
            clubSlug,
            ...payload,
            photoStorageId,
          });
        }

        resetForm();
        onOpenChange(false);
      } catch (error) {
        console.error(
          `[PlayerFormDialog] Failed to ${isEditMode ? "update" : "create"} player:`,
          error,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createPlayer,
      generateUploadUrl,
      isEditMode,
      isFormValid,
      onOpenChange,
      player,
      resetForm,
      clubSlug,
      horizontalDivisions.enabled,
      updatePlayer,
      values,
    ],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);

      if (!nextOpen) {
        clearResetTimeout();
        resetTimeoutRef.current = window.setTimeout(() => {
          resetForm();
          setIsSubmitting(false);
        }, FORM_RESET_DELAY_MS);
      }
    },
    [clearResetTimeout, onOpenChange, resetForm],
  );

  return {
    ageCategories,
    enabledGenders,
    handleDateOfBirthChange,
    handleFileChange,
    handleLeagueCategoryChange,
    handleOpenChange,
    handleSubmit,
    horizontalDivisions,
    isEditMode,
    isFormValid,
    isSubmitting,
    setField,
    values,
  };
}
