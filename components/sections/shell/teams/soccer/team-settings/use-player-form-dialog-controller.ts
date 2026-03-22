"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { FileWithPreview } from "@/lib/files/upload";
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
  player,
}: Pick<
  PlayerFormDialogProps,
  "open" | "onOpenChange" | "clubSlug" | "player"
>) {
  const createPlayer = useMutation(api.players.createPlayer);
  const updatePlayer = useMutation(api.players.updatePlayer);
  const generateUploadUrl = useMutation(api.players.generateUploadUrl);
  const categories =
    useQuery(api.categories.listByClubSlug, open ? { clubSlug } : "skip") ?? [];

  const isEditMode = Boolean(player);
  const [values, setValues] = useState<PlayerFormValues>(() =>
    createPlayerFormValues(player),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setValues(createPlayerFormValues(player));
    setIsSubmitting(false);
  }, [clearResetTimeout, open, player]);

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

  const isFormValid = useMemo(() => isPlayerFormValid(values), [values]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (
        !isFormValid ||
        !values.dateOfBirth ||
        !values.gender ||
        !values.dominantProfile
      ) {
        return;
      }

      setIsSubmitting(true);

      try {
        const photoStorageId = await uploadPlayerPhoto(
          values.photoFile,
          generateUploadUrl,
        );
        const payload = buildPlayerMutationPayload(values);

        if (isEditMode) {
          await updatePlayer({
            playerId: player!._id as Id<"players">,
            ...payload,
            ...(photoStorageId ? { photoStorageId } : {}),
          });
        } else {
          await createPlayer({
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
    categories,
    handleFileChange,
    handleOpenChange,
    handleSubmit,
    isEditMode,
    isFormValid,
    isSubmitting,
    setField,
    values,
  };
}
