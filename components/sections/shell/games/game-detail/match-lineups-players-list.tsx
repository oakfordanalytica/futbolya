"use client";

import { useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import type {
  FootballLineup,
  FootballLineupPlayer,
} from "@/components/ui/football-field.types";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import type { PlayerSubstitutionLink } from "./match-lineups-domain";

function PlayerMarkers({ markers }: { markers?: string[] }) {
  if (!markers?.length) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-sm leading-none">
      {markers.map((marker, index) => (
        <span key={`${marker}-${index}`}>{marker}</span>
      ))}
    </span>
  );
}

function PlayerNameCell({
  player,
  markers,
  clickable,
}: {
  player: FootballLineupPlayer;
  markers?: string[];
  clickable: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2 truncate text-left font-medium",
        clickable && "cursor-pointer hover:underline",
      )}
    >
      <span className="truncate">{player.name}</span>
      <PlayerMarkers markers={markers} />
    </span>
  );
}

export function MatchLineupsPlayersList({
  lineup,
  playersById,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  eventMarkers,
  substitutionsByOutgoingPlayer,
  incomingPlayerIds,
  noLabel,
  nameLabel,
  substitutesLabel,
  emptyLabel,
}: {
  lineup: FootballLineup;
  playersById: Map<string, FootballLineupPlayer>;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  eventMarkers: Map<string, string[]>;
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>;
  incomingPlayerIds: Set<string>;
  noLabel: string;
  nameLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
}) {
  const router = useRouter();

  const visibleStarters = useMemo(() => {
    const starterMap = new Map<string, FootballLineupPlayer>();

    for (const player of lineup.starters) {
      if (!incomingPlayerIds.has(String(player.id))) {
        starterMap.set(String(player.id), player);
      }
    }

    for (const [outgoingPlayerId] of substitutionsByOutgoingPlayer) {
      if (!starterMap.has(outgoingPlayerId)) {
        const fallbackPlayer = playersById.get(outgoingPlayerId);
        if (fallbackPlayer) {
          starterMap.set(outgoingPlayerId, fallbackPlayer);
        }
      }
    }

    return Array.from(starterMap.values());
  }, [
    incomingPlayerIds,
    lineup.starters,
    playersById,
    substitutionsByOutgoingPlayer,
  ]);

  const substitutes = useMemo(
    () =>
      (lineup.substitutes ?? []).filter(
        (player) =>
          !incomingPlayerIds.has(String(player.id)) &&
          !visibleStarters.some(
            (visibleStarter) => String(visibleStarter.id) === String(player.id),
          ),
      ),
    [incomingPlayerIds, lineup.substitutes, visibleStarters],
  );

  const hasPlayers = visibleStarters.length > 0 || substitutes.length > 0;

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

  const handlePlayerClick = (player: FootballLineupPlayer) => {
    const href = getPlayerHref(player);
    if (href) {
      router.push(href);
    }
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
      <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{noLabel}</span>
        <span>{nameLabel}</span>
      </div>

      {visibleStarters.map((player) => {
        const playerHref = getPlayerHref(player);
        const playerMarkers = eventMarkers.get(String(player.id));

        return (
          <div key={player.id} className="border-b last:border-b-0">
            <button
              type="button"
              className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 px-3 py-2 text-xs"
              onClick={() => handlePlayerClick(player)}
              disabled={!playerHref}
            >
              <span className="font-medium tabular-nums text-muted-foreground">
                {player.number}
              </span>
              <PlayerNameCell
                player={player}
                markers={playerMarkers}
                clickable={Boolean(playerHref)}
              />
            </button>

            {substitutionsByOutgoingPlayer
              .get(String(player.id))
              ?.map((substitution, index) => {
                const incomingPlayer = playersById.get(
                  substitution.incomingPlayerId,
                );
                if (!incomingPlayer) {
                  return null;
                }

                const incomingHref = getPlayerHref(incomingPlayer);
                const incomingMarkers = eventMarkers.get(
                  String(incomingPlayer.id),
                );

                return (
                  <button
                    type="button"
                    key={`${player.id}-sub-${substitution.incomingPlayerId}-${index}`}
                    className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-1.5 text-xs"
                    onClick={() => handlePlayerClick(incomingPlayer)}
                    disabled={!incomingHref}
                  >
                    <span />
                    <span
                      className={cn(
                        "flex min-w-0 items-center gap-1.5 truncate pl-1 text-left font-medium",
                        incomingHref && "cursor-pointer hover:underline",
                      )}
                    >
                      <span className="shrink-0 text-[11px] leading-none text-muted-foreground">
                        ↕
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {incomingPlayer.number}
                      </span>
                      <span className="truncate">{incomingPlayer.name}</span>
                      <PlayerMarkers markers={incomingMarkers} />
                    </span>
                  </button>
                );
              })}
          </div>
        );
      })}

      {substitutes.length > 0 ? (
        <>
          <div className="border-y bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {substitutesLabel}
          </div>
          {substitutes.map((player) => {
            const playerHref = getPlayerHref(player);
            const playerMarkers = eventMarkers.get(String(player.id));

            return (
              <button
                type="button"
                key={player.id}
                className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
                onClick={() => handlePlayerClick(player)}
                disabled={!playerHref}
              >
                <span className="font-medium tabular-nums text-muted-foreground">
                  {player.number}
                </span>
                <PlayerNameCell
                  player={player}
                  markers={playerMarkers}
                  clickable={Boolean(playerHref)}
                />
              </button>
            );
          })}
        </>
      ) : null}
    </div>
  );
}
