"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateGameDialogController } from "./types";
import { GameFormDetailsSection } from "./game-form-details-section";
import { GameFormSetupSection } from "./game-form-setup-section";

export function GameForm({
  controller,
}: {
  controller: CreateGameDialogController;
}) {
  const t = useTranslations("Common");
  const {
    gameType,
    isEditMode,
    isSubmitting,
    isFormValid,
    handleBack,
    handleOpenChange,
    handleSubmit,
  } = controller;

  return (
    <>
      <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
            disabled={isEditMode}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-left">
            {isEditMode
              ? t("games.editTitle")
              : gameType === "season"
                ? t("games.seasonGame")
                : t("games.quickGame")}
          </DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <GameFormSetupSection controller={controller} />
            <GameFormDetailsSection controller={controller} />
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting
              ? t("actions.loading")
              : isEditMode
                ? t("actions.save")
                : t("actions.create")}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
