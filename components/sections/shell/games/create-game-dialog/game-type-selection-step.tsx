"use client";

import { useTranslations } from "next-intl";
import { CalendarIcon, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GameType } from "./types";

export function GameTypeSelectionStep({
  hasActiveSeasons,
  onSelect,
  onCancel,
}: {
  hasActiveSeasons: boolean;
  onSelect: (gameType: Exclude<GameType, null>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Common");

  return (
    <>
      <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <DialogTitle className="text-left">{t("games.createTitle")}</DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="h-auto w-full items-start justify-start gap-3 px-4 py-4 whitespace-normal"
            onClick={() => onSelect("quick")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <div className="font-medium">{t("games.quickGame")}</div>
              <div className="text-sm text-muted-foreground whitespace-normal break-words">
                {t("games.quickGameDescription")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className={cn(
              "h-auto w-full items-start justify-start gap-3 px-4 py-4 whitespace-normal",
              !hasActiveSeasons && "cursor-not-allowed opacity-50",
            )}
            onClick={() => onSelect("season")}
            disabled={!hasActiveSeasons}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                hasActiveSeasons ? "bg-primary/10" : "bg-muted",
              )}
            >
              <CalendarIcon
                className={cn(
                  "h-5 w-5",
                  hasActiveSeasons ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="min-w-0 text-left">
              <div className="font-medium">{t("games.seasonGame")}</div>
              <div className="text-sm text-muted-foreground whitespace-normal break-words">
                {hasActiveSeasons
                  ? t("games.seasonGameDescription")
                  : t("games.noActiveSeasons")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto w-full cursor-not-allowed items-start justify-start gap-3 px-4 py-4 opacity-50 whitespace-normal"
            disabled
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 text-left">
              <div className="font-medium">{t("games.tournament")}</div>
              <div className="text-sm text-muted-foreground whitespace-normal break-words">
                {t("games.tournamentDescription")}
              </div>
            </div>
          </Button>
        </div>
      </div>

      <DialogFooter className="border-t px-4 py-3 sm:px-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}
