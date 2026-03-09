"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
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
import { AlertCircle, Check } from "lucide-react";
import { buildPlayerFullName } from "@/lib/players/name";

interface PlayerStatEntry {
  playerId: Id<"players">;
  playerName: string;
  cometNumber?: string;
  isStarter: boolean;
  goals: number;
  yellowCards: number;
  redCards: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  substitutionsIn: number;
  substitutionsOut: number;
}

interface TeamStatEntry {
  corners: number;
  freeKicks: number;
  substitutions: number;
}

interface StatsEntryFormProps {
  gameId: Id<"games">;
  clubId: Id<"clubs">;
  clubSlug: string;
  onSuccess?: () => void;
}

const PLAYER_STAT_FIELDS = [
  { key: "goals", label: "G", width: "w-14" },
  { key: "yellowCards", label: "TA", width: "w-14" },
  { key: "redCards", label: "TR", width: "w-14" },
  { key: "penaltiesAttempted", label: "PEN A", width: "w-16" },
  { key: "penaltiesScored", label: "PEN C", width: "w-16" },
  { key: "substitutionsIn", label: "ENTRA", width: "w-16" },
  { key: "substitutionsOut", label: "SALE", width: "w-16" },
] as const;

type PlayerStatKey = (typeof PLAYER_STAT_FIELDS)[number]["key"];

const TEAM_STAT_FIELDS = [
  { key: "corners", labelKey: "games.gameStats.corners" },
  { key: "freeKicks", labelKey: "games.gameStats.freeKicks" },
  { key: "substitutions", labelKey: "games.gameStats.substitutions" },
] as const;

type TeamStatKey = (typeof TEAM_STAT_FIELDS)[number]["key"];

export function StatsEntryForm({
  gameId,
  clubId,
  clubSlug,
  onSuccess,
}: StatsEntryFormProps) {
  const t = useTranslations("Common");

  const players = useQuery(api.players.listSoccerPlayersByClubSlug, {
    clubSlug,
  });

  const submitStats = useMutation(api.games.submitTeamStats);

  const [teamScore, setTeamScore] = useState(0);
  const [teamStats, setTeamStats] = useState<TeamStatEntry>({
    corners: 0,
    freeKicks: 0,
    substitutions: 0,
  });
  const [playerStats, setPlayerStats] = useState<PlayerStatEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!players || players.length === 0 || playerStats.length > 0) {
      return;
    }

    setPlayerStats(
      players.map((player, index) => ({
        playerId: player._id as Id<"players">,
        playerName: buildPlayerFullName(
          player.firstName,
          player.lastName,
          player.secondLastName,
        ),
        cometNumber: player.cometNumber,
        isStarter: index < 11,
        goals: 0,
        yellowCards: 0,
        redCards: 0,
        penaltiesAttempted: 0,
        penaltiesScored: 0,
        substitutionsIn: 0,
        substitutionsOut: 0,
      })),
    );
  }, [playerStats.length, players]);

  const updatePlayerStat = (
    playerId: Id<"players">,
    field: PlayerStatKey | "isStarter",
    value: number | boolean,
  ) => {
    setPlayerStats((prev) =>
      prev.map((stat) =>
        stat.playerId === playerId ? { ...stat, [field]: value } : stat,
      ),
    );
  };

  const updateTeamStat = (field: TeamStatKey, value: number) => {
    setTeamStats((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await submitStats({
        gameId,
        clubId,
        teamScore,
        teamStats: {
          corners: teamStats.corners || undefined,
          freeKicks: teamStats.freeKicks || undefined,
          substitutions: teamStats.substitutions || undefined,
        },
        playerStats: playerStats.map((stat) => ({
          playerId: stat.playerId,
          isStarter: stat.isStarter,
          goals: stat.goals || undefined,
          yellowCards: stat.yellowCards || undefined,
          redCards: stat.redCards || undefined,
          penaltiesAttempted: stat.penaltiesAttempted || undefined,
          penaltiesScored: stat.penaltiesScored || undefined,
          substitutionsIn: stat.substitutionsIn || undefined,
          substitutionsOut: stat.substitutionsOut || undefined,
        })),
      });

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("games.statsEntry.submitFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!players) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-muted-foreground">{t("actions.loading")}</span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("games.statsEntry.noPlayers")}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          {t("games.statsEntry.submitted")}
        </AlertDescription>
      </Alert>
    );
  }

  const starters = playerStats.filter((player) => player.isStarter);
  const bench = playerStats.filter((player) => !player.isStarter);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{t("games.statsEntry.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("games.statsEntry.description")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 rounded-md border bg-card p-3">
            <FieldLabel>{t("games.statsEntry.teamScore")}</FieldLabel>
            <Input
              type="number"
              min={0}
              value={teamScore}
              onChange={(event) => setTeamScore(parseInt(event.target.value, 10) || 0)}
            />
          </div>

          {TEAM_STAT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2 rounded-md border bg-card p-3">
              <FieldLabel>{t(field.labelKey)}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={teamStats[field.key]}
                onChange={(event) =>
                  updateTeamStat(
                    field.key,
                    parseInt(event.target.value, 10) || 0,
                  )
                }
              />
            </div>
          ))}
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
              <TableHead className="w-12 text-center">XI</TableHead>
              {PLAYER_STAT_FIELDS.map((field) => (
                <TableHead
                  key={field.key}
                  className={`text-center ${field.width}`}
                >
                  {field.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {starters.map((stat) => (
              <PlayerStatRow
                key={stat.playerId}
                stat={stat}
                onUpdate={(field, value) =>
                  updatePlayerStat(stat.playerId, field, value)
                }
              />
            ))}

            {bench.length > 0 ? (
              <>
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 z-10 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                    {t("games.boxScoreLabels.bench")}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    XI
                  </TableCell>
                  {PLAYER_STAT_FIELDS.map((field) => (
                    <TableCell
                      key={field.key}
                      className="text-center text-xs text-muted-foreground"
                    >
                      {field.label}
                    </TableCell>
                  ))}
                </TableRow>
                {bench.map((stat) => (
                  <PlayerStatRow
                    key={stat.playerId}
                    stat={stat}
                    onUpdate={(field, value) =>
                      updatePlayerStat(stat.playerId, field, value)
                    }
                  />
                ))}
              </>
            ) : null}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? t("games.statsEntry.submitting")
            : t("games.statsEntry.submitStats")}
        </Button>
      </div>
    </div>
  );
}

interface PlayerStatRowProps {
  stat: PlayerStatEntry;
  onUpdate: (field: PlayerStatKey | "isStarter", value: number | boolean) => void;
}

function PlayerStatRow({ stat, onUpdate }: PlayerStatRowProps) {
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
      <TableCell className="text-center">
        <Checkbox
          checked={stat.isStarter}
          onCheckedChange={(checked) => onUpdate("isStarter", !!checked)}
          className="mx-auto"
        />
      </TableCell>
      {PLAYER_STAT_FIELDS.map((field) => (
        <TableCell key={field.key} className="p-1.5">
          <Input
            type="number"
            min={0}
            value={stat[field.key]}
            onChange={(event) =>
              onUpdate(field.key, parseInt(event.target.value, 10) || 0)
            }
            className="h-8 text-center tabular-nums"
          />
        </TableCell>
      ))}
    </TableRow>
  );
}
