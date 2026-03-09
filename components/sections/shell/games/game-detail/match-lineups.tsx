"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FootballField } from "@/components/ui/football-field";
import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { GameLineupsDialog } from "./game-lineups-dialog";

interface MatchLineupsTeam {
  name: string;
  clubSlug: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface MatchLineupsProps {
  gameId: string;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  homeTeam: MatchLineupsTeam;
  awayTeam: MatchLineupsTeam;
  className?: string;
}

type GamePlayerStat = {
  _id: string;
  playerName: string;
  jerseyNumber?: number;
  cometNumber?: string;
  isStarter: boolean;
};

type PersistedLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  photoUrl?: string;
  jerseyNumber?: number;
  cometNumber?: string;
  position?: string;
};

type PersistedLineupSlot = {
  id: string;
  x: number;
  y: number;
  role: "goalkeeper" | "outfield";
  player?: PersistedLineupPlayer;
};

type PersistedLineup = {
  lineupTemplateId?: string;
  formation?: string;
  slots: PersistedLineupSlot[];
  starters: PersistedLineupPlayer[];
  substitutes: PersistedLineupPlayer[];
};

function mapStatToLineupPlayer(stat: GamePlayerStat): FootballLineupPlayer {
  return {
    id: stat._id,
    name: stat.playerName,
    number: stat.jerseyNumber !== undefined ? `${stat.jerseyNumber}` : "—",
  };
}

function mapPersistedToLineupPlayer(
  player: PersistedLineupPlayer,
): FootballLineupPlayer {
  return {
    id: player.playerId,
    name: player.playerName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function buildLineup(
  teamName: string,
  teamColor: string | undefined,
  stats: GamePlayerStat[],
): FootballLineup {
  const starters = stats
    .filter((stat) => stat.isStarter)
    .map(mapStatToLineupPlayer);
  const substitutes = stats
    .filter((stat) => !stat.isStarter)
    .map(mapStatToLineupPlayer);

  return {
    teamName,
    teamColor,
    starters,
    substitutes,
  };
}

function buildPersistedLineup(
  teamName: string,
  teamColor: string | undefined,
  lineup: PersistedLineup,
): FootballLineup {
  return {
    teamName,
    teamColor,
    formation: lineup.formation,
    slots: lineup.slots.map<FootballLineupSlot>((slot) => ({
      id: slot.id,
      x: slot.x,
      y: slot.y,
      role: slot.role,
      ...(slot.player
        ? { player: mapPersistedToLineupPlayer(slot.player) }
        : {}),
    })),
    starters: lineup.starters.map(mapPersistedToLineupPlayer),
    substitutes: lineup.substitutes.map(mapPersistedToLineupPlayer),
  };
}

function buildDisplayLineup(
  teamName: string,
  teamColor: string | undefined,
  lineup: PersistedLineup | null | undefined,
  stats: GamePlayerStat[],
) {
  if (lineup) {
    return buildPersistedLineup(teamName, teamColor, lineup);
  }

  return buildLineup(teamName, teamColor, stats);
}

function TeamBadge({ team, label }: { team: MatchLineupsTeam; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={18}
          height={18}
          className="size-[18px] object-contain"
        />
      ) : (
        <div className="flex size-[18px] items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {team.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate font-semibold">{label}</span>
    </div>
  );
}

function FieldPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-lg border-2 border-white/40",
        "bg-gradient-to-b from-green-500 to-green-600 dark:from-green-700 dark:to-green-800",
        "p-2",
      )}
    >
      <div className="absolute top-1/2 left-1/2 h-[30%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-white/40" />
      <div className="absolute top-0 left-[20%] h-[16%] w-[60%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute top-0 left-[35%] h-[8%] w-[30%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute bottom-0 left-[20%] h-[16%] w-[60%] rounded-t-sm border-2 border-b-0 border-white/40" />
      <div className="absolute bottom-0 left-[35%] h-[8%] w-[30%] rounded-t-sm border-2 border-b-0 border-white/40" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/85">
          {description}
        </p>
      </div>
    </div>
  );
}

function LineupPlayersList({
  lineup,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  noLabel,
  nameLabel,
  startersLabel,
  substitutesLabel,
  emptyLabel,
}: {
  lineup: FootballLineup;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  noLabel: string;
  nameLabel: string;
  startersLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
}) {
  const router = useRouter();
  const substitutes = lineup.substitutes ?? [];
  const hasPlayers = lineup.starters.length > 0 || substitutes.length > 0;

  const getPlayerHref = (player: FootballLineupPlayer) => {
    if (routeScope === "org") {
      return ROUTES.org.teams.playerDetail(
        orgSlug,
        teamClubSlug,
        String(player.id),
      );
    }

    if (currentClubSlug === teamClubSlug) {
      return TEAM_ROUTES.rosterPlayerDetail(
        orgSlug,
        teamClubSlug,
        String(player.id),
      );
    }

    return null;
  };

  if (!hasPlayers) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{noLabel}</span>
        <span>{nameLabel}</span>
      </div>

      {lineup.starters.map((player) => (
        <button
          type="button"
          key={player.id}
          className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
          onClick={() => {
            const href = getPlayerHref(player);
            if (href) {
              router.push(href);
            }
          }}
          disabled={!getPlayerHref(player)}
        >
          <span className="font-medium tabular-nums text-muted-foreground">
            {player.number}
          </span>
          <span
            className={cn(
              "truncate text-left font-medium",
              getPlayerHref(player) && "cursor-pointer hover:underline",
            )}
          >
            {player.name}
          </span>
        </button>
      ))}

      {substitutes.length > 0 ? (
        <>
          <div className="border-y bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {substitutesLabel}
          </div>
          {substitutes.map((player) => (
            <button
              type="button"
              key={player.id}
              className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
              onClick={() => {
                const href = getPlayerHref(player);
                if (href) {
                  router.push(href);
                }
              }}
              disabled={!getPlayerHref(player)}
            >
              <span className="font-medium tabular-nums text-muted-foreground">
                {player.number}
              </span>
              <span
                className={cn(
                  "truncate text-left font-medium",
                  getPlayerHref(player) && "cursor-pointer hover:underline",
                )}
              >
                {player.name}
              </span>
            </button>
          ))}
        </>
      ) : null}
    </div>
  );
}

function LineupTabPanel({
  lineup,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  pendingFormationDescription,
  noLabel,
  nameLabel,
  startersLabel,
  substitutesLabel,
  emptyLabel,
}: {
  lineup: FootballLineup;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  pendingFormationDescription: string;
  noLabel: string;
  nameLabel: string;
  startersLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-4">
      {lineup.formation ? (
        <FootballField lineup={lineup} />
      ) : (
        <FieldPlaceholder
          title={lineup.teamName}
          description={pendingFormationDescription}
        />
      )}

      <LineupPlayersList
        lineup={lineup}
        orgSlug={orgSlug}
        routeScope={routeScope}
        currentClubSlug={currentClubSlug}
        teamClubSlug={teamClubSlug}
        noLabel={noLabel}
        nameLabel={nameLabel}
        startersLabel={startersLabel}
        substitutesLabel={substitutesLabel}
        emptyLabel={emptyLabel}
      />
    </div>
  );
}

export function MatchLineups({
  gameId,
  orgSlug,
  routeScope,
  currentClubSlug,
  homeTeam,
  awayTeam,
  className,
}: MatchLineupsProps) {
  const t = useTranslations("Common");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const gameLineups = useQuery(api.gameLineups.getByGameId, {
    gameId: gameId as Id<"games">,
  });
  const gameStats = useQuery(api.games.getGamePlayerStats, {
    gameId: gameId as Id<"games">,
  });

  const homeLineup = buildDisplayLineup(
    homeTeam.name,
    homeTeam.primaryColor,
    gameLineups?.homeLineup,
    gameStats?.homeStats ?? [],
  );
  const awayLineup = buildDisplayLineup(
    awayTeam.name,
    awayTeam.primaryColor,
    gameLineups?.awayLineup,
    gameStats?.awayStats ?? [],
  );
  const canEditLineups =
    Boolean(gameLineups?.canEditHome) || Boolean(gameLineups?.canEditAway);

  return (
    <>
      <Card className={cn("gap-0 rounded-xl pt-2 pb-0", className)}>
        {canEditLineups ? (
          <CardHeader className="grid-rows-[auto] gap-0 border-b px-4 pt-0 pb-2 md:px-5 [.border-b]:pb-2">
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setIsEditorOpen(true)}
              >
                {t("games.lineups.configure")}
              </Button>
            </CardAction>
          </CardHeader>
        ) : null}
        <CardContent
          className={cn(
            "px-4 py-4 md:px-5 md:py-5",
            canEditLineups && "pt-2 md:pt-3",
          )}
        >
          <Tabs defaultValue="home" className="w-full">
            <TabsList
              className="grid h-auto w-full grid-cols-2 rounded-full border bg-muted/30 px-1 pt-1 pb-0"
              style={
                {
                  "--tabs-indicator-bottom": "0px",
                } as CSSProperties
              }
            >
              <TabsTrigger
                value="home"
                className="mr-0 min-w-0 rounded-full px-3 pt-1.5 pb-2 text-sm"
              >
                <TeamBadge
                  team={homeTeam}
                  label={homeLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
              <TabsTrigger
                value="away"
                className="mr-0 min-w-0 rounded-full px-3 pt-1.5 pb-2 text-sm"
              >
                <TeamBadge
                  team={awayTeam}
                  label={awayLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-4">
              <LineupTabPanel
                lineup={homeLineup}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={homeTeam.clubSlug}
                pendingFormationDescription={t(
                  "games.lineups.pendingFormationDescription",
                )}
                noLabel={t("games.lineups.number")}
                nameLabel={t("games.lineups.name")}
                startersLabel={t("games.lineups.starters")}
                substitutesLabel={t("games.lineups.substitutes")}
                emptyLabel={t("games.lineups.empty")}
              />
            </TabsContent>

            <TabsContent value="away" className="mt-4">
              <LineupTabPanel
                lineup={awayLineup}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={awayTeam.clubSlug}
                pendingFormationDescription={t(
                  "games.lineups.pendingFormationDescription",
                )}
                noLabel={t("games.lineups.number")}
                nameLabel={t("games.lineups.name")}
                startersLabel={t("games.lineups.starters")}
                substitutesLabel={t("games.lineups.substitutes")}
                emptyLabel={t("games.lineups.empty")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <GameLineupsDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        gameId={gameId}
      />
    </>
  );
}
