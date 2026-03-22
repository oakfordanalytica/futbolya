"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatClock, type MatchPhase } from "@/lib/games/match-timing";

interface GameCenterSummaryPanelProps {
  homeTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamName: string;
  awayTeamLogo?: string | null;
  homeScore: number;
  awayScore: number;
  elapsedSeconds: number;
  matchPhase: MatchPhase;
  liveMinute: number;
  currentHalfAddedMinutes: number;
  hasStarted: boolean;
  canStart: boolean;
  isSubmitting: boolean;
  onStartMatch: () => void;
  onOpenStoppageDialog: () => void;
  onEndFirstHalf: () => void;
  onStartSecondHalf: () => void;
  onFinishMatch: () => void;
}

function TeamIdentity({
  teamName,
  logoUrl,
}: {
  teamName: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={teamName}
          width={52}
          height={52}
          className="size-12 object-contain"
        />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
          {teamName.charAt(0)}
        </div>
      )}
      <span className="text-xs font-semibold leading-tight">{teamName}</span>
    </div>
  );
}

export function GameCenterSummaryPanel({
  homeTeamName,
  homeTeamLogo,
  awayTeamName,
  awayTeamLogo,
  homeScore,
  awayScore,
  elapsedSeconds,
  matchPhase,
  liveMinute,
  currentHalfAddedMinutes,
  hasStarted,
  canStart,
  isSubmitting,
  onStartMatch,
  onOpenStoppageDialog,
  onEndFirstHalf,
  onStartSecondHalf,
  onFinishMatch,
}: GameCenterSummaryPanelProps) {
  const t = useTranslations("Common");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamIdentity teamName={homeTeamName} logoUrl={homeTeamLogo} />

        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl font-black tabular-nums">
            {homeScore} - {awayScore}
          </div>
          <div className="rounded-full border px-3 py-1 text-xs font-semibold tabular-nums">
            {formatClock(elapsedSeconds)}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">
            {matchPhase === "finished"
              ? t("games.center.endedState")
              : matchPhase === "second_half"
                ? t("games.center.secondHalfState", {
                    minute: liveMinute,
                  })
                : matchPhase === "halftime"
                  ? t("games.center.halftimeState")
                  : matchPhase === "first_half"
                    ? t("games.center.firstHalfState", {
                        minute: liveMinute,
                      })
                    : t("games.center.waitingState")}
          </div>
          {currentHalfAddedMinutes > 0 ? (
            <div className="text-[11px] font-medium text-muted-foreground">
              {t("games.center.stoppageActive", {
                minutes: currentHalfAddedMinutes,
              })}
            </div>
          ) : null}
        </div>

        <TeamIdentity teamName={awayTeamName} logoUrl={awayTeamLogo} />
      </div>

      <div className="flex gap-2">
        {!hasStarted ? (
          <Button
            type="button"
            className="flex-1"
            onClick={onStartMatch}
            disabled={!canStart || isSubmitting}
          >
            {isSubmitting ? t("actions.loading") : t("games.center.start")}
          </Button>
        ) : matchPhase === "first_half" ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onOpenStoppageDialog}
              disabled={isSubmitting}
            >
              {t("games.center.addStoppage")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={onEndFirstHalf}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("actions.loading")
                : t("games.center.endFirstHalf")}
            </Button>
          </>
        ) : matchPhase === "halftime" ? (
          <Button
            type="button"
            className="flex-1"
            onClick={onStartSecondHalf}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("actions.loading")
              : t("games.center.startSecondHalf")}
          </Button>
        ) : matchPhase === "second_half" ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onOpenStoppageDialog}
              disabled={isSubmitting}
            >
              {t("games.center.addStoppage")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={onFinishMatch}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("actions.loading")
                : t("games.center.endSecondHalf")}
            </Button>
          </>
        ) : (
          <Button type="button" className="flex-1" disabled>
            {t("games.center.finished")}
          </Button>
        )}
      </div>
    </div>
  );
}
