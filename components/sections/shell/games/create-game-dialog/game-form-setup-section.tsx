"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { TeamLogo } from "./team-logo";
import { TeamPicker } from "./team-picker";
import { SeasonPicker } from "./season-picker";
import type { CreateGameDialogController } from "./types";

export function GameFormSetupSection({
  controller,
}: {
  controller: CreateGameDialogController;
}) {
  const t = useTranslations("Common");
  const {
    gameType,
    isEditMode,
    formState,
    hasPreselectedClub,
    preselectedClub,
    isPreselectedClubAffiliated,
    availableHomeTeams,
    availableAwayTeams,
    selectedHomeTeam,
    selectedAwayTeam,
    activeSeasons,
    selectedSeason,
    hasActiveSeasons,
    updateField,
  } = controller;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>{t("games.homeTeam")}</FieldLabel>
          {hasPreselectedClub ? (
            <Button
              variant="outline"
              disabled
              className="mt-2 w-full min-w-0 cursor-not-allowed justify-start"
            >
              {preselectedClub ? (
                <span className="flex min-w-0 items-center gap-2">
                  <TeamLogo club={preselectedClub} />
                  <span className="truncate">{preselectedClub.name}</span>
                </span>
              ) : (
                t("actions.loading")
              )}
            </Button>
          ) : (
            <TeamPicker
              value={formState.homeTeamId}
              selectedClub={selectedHomeTeam}
              availableClubs={availableHomeTeams}
              disabled={isEditMode}
              placeholder={t("games.selectTeam")}
              onSelect={(clubId) => updateField("homeTeamId", clubId)}
            />
          )}
        </div>

        <div>
          <FieldLabel>{t("games.awayTeam")}</FieldLabel>
          <TeamPicker
            value={formState.awayTeamId}
            selectedClub={selectedAwayTeam}
            availableClubs={availableAwayTeams}
            disabled={isEditMode}
            placeholder={t("games.selectTeam")}
            onSelect={(clubId) => updateField("awayTeamId", clubId)}
          />
        </div>
      </div>

      {hasPreselectedClub && !isPreselectedClubAffiliated && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("games.clubStatusNotEligible")}</p>
        </div>
      )}

      {gameType === "season" && (
        <div>
          <FieldLabel>{t("games.season")}</FieldLabel>
          <SeasonPicker
            value={formState.seasonId}
            selectedSeason={selectedSeason}
            seasons={activeSeasons || []}
            disabled={isEditMode}
            hasActiveSeasons={hasActiveSeasons}
            onSelect={(seasonId) => updateField("seasonId", seasonId)}
          />
        </div>
      )}
    </>
  );
}
