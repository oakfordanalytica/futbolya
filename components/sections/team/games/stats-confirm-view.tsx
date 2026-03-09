"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Clock } from "lucide-react";

interface StatsConfirmViewProps {
  gameId: Id<"games">;
  clubId: Id<"clubs">;
  opponentName: string;
  hasConfirmed: boolean;
  onSuccess?: () => void;
}

const PLAYER_COLUMNS = [
  { key: "goals", label: "G" },
  { key: "yellowCards", label: "TA" },
  { key: "redCards", label: "TR" },
  { key: "penalties", label: "PEN" },
  { key: "subIn", label: "ENTRA" },
  { key: "subOut", label: "SALE" },
] as const;

function formatPenaltySummary(scored?: number, attempted?: number) {
  const safeAttempted = attempted ?? 0;
  const safeScored = scored ?? 0;
  return safeAttempted > 0 ? `${safeScored}/${safeAttempted}` : "—";
}

export function StatsConfirmView({
  gameId,
  clubId,
  opponentName,
  hasConfirmed,
  onSuccess,
}: StatsConfirmViewProps) {
  const t = useTranslations("Common");

  const gameStats = useQuery(api.games.getGamePlayerStats, { gameId });
  const confirmStats = useMutation(api.games.confirmOpponentStats);

  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setError(null);
    setIsConfirming(true);

    try {
      await confirmStats({ gameId, clubId });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("games.statsEntry.confirmFailed"),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!gameStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-muted-foreground">{t("actions.loading")}</span>
      </div>
    );
  }

  const reviewingHome = gameStats.homeTeamStats.clubId !== clubId;
  const opponentStats = reviewingHome ? gameStats.homeStats : gameStats.awayStats;
  const opponentTeamStats = reviewingHome
    ? gameStats.homeTeamStats
    : gameStats.awayTeamStats;

  if (hasConfirmed || success) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          {t("games.statsEntry.confirmed")}
        </AlertDescription>
      </Alert>
    );
  }

  const starters = opponentStats.filter((stat) => stat.isStarter);
  const bench = opponentStats.filter((stat) => !stat.isStarter);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{t("games.statsEntry.reviewOpponent")}</h3>
          <p className="text-sm text-muted-foreground">{opponentName}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={t("games.statsEntry.teamScore")} value={opponentTeamStats.goals} />
          <SummaryCard label={t("games.gameStats.corners")} value={opponentTeamStats.corners} />
          <SummaryCard label={t("games.gameStats.freeKicks")} value={opponentTeamStats.freeKicks} />
          <SummaryCard label={t("games.gameStats.substitutions")} value={opponentTeamStats.substitutions} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ScrollArea className="w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 z-10 min-w-[180px] bg-muted/50">
                {t("games.boxScoreLabels.starters")}
              </TableHead>
              {PLAYER_COLUMNS.map((col) => (
                <TableHead key={col.key} className="w-16 text-center">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {starters.map((stat) => (
              <StatRow key={stat._id} stat={stat} />
            ))}

            {bench.length > 0 ? (
              <>
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 z-10 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                    {t("games.boxScoreLabels.bench")}
                  </TableCell>
                  {PLAYER_COLUMNS.map((col) => (
                    <TableCell key={col.key} className="text-center text-xs text-muted-foreground">
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
                {bench.map((stat) => (
                  <StatRow key={stat._id} stat={stat} />
                ))}
              </>
            ) : null}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex justify-end">
        <Button onClick={handleConfirm} disabled={isConfirming}>
          {isConfirming
            ? t("games.statsEntry.confirming")
            : t("games.statsEntry.confirmStats")}
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

interface StatRowProps {
  stat: {
    _id: string;
    playerName: string;
    cometNumber?: string;
    goals?: number;
    yellowCards?: number;
    redCards?: number;
    penaltiesAttempted?: number;
    penaltiesScored?: number;
    substitutionsIn?: number;
    substitutionsOut?: number;
  };
}

function StatRow({ stat }: StatRowProps) {
  return (
    <TableRow>
      <TableCell className="sticky left-0 z-10 bg-background font-medium whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[140px]">{stat.playerName}</span>
          {stat.cometNumber ? (
            <span className="text-xs text-muted-foreground">{stat.cometNumber}</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-center tabular-nums">{stat.goals ?? 0}</TableCell>
      <TableCell className="text-center tabular-nums">{stat.yellowCards ?? 0}</TableCell>
      <TableCell className="text-center tabular-nums">{stat.redCards ?? 0}</TableCell>
      <TableCell className="text-center tabular-nums">
        {formatPenaltySummary(stat.penaltiesScored, stat.penaltiesAttempted)}
      </TableCell>
      <TableCell className="text-center tabular-nums">{stat.substitutionsIn ?? 0}</TableCell>
      <TableCell className="text-center tabular-nums">{stat.substitutionsOut ?? 0}</TableCell>
    </TableRow>
  );
}

interface WaitingForOpponentProps {
  message?: string;
}

export function WaitingForOpponent({ message }: WaitingForOpponentProps) {
  const t = useTranslations("Common");

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        {message || t("games.statsEntry.waitingForOpponent")}
      </AlertDescription>
    </Alert>
  );
}
