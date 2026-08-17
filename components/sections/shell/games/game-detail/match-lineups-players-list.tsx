import { useMemo, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import type {
  FootballLineup,
  FootballLineupPlayer,
} from "@/components/ui/football-field.types";
import { cn } from "@/lib/utils";
import type { PlayerSubstitutionLink } from "./match-lineups-domain";

function PlayerMarkers({ markers }: { markers?: string[] }) {
  if (!markers?.length) {
    return null;
  }

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-sm leading-none"
      aria-hidden="true"
    >
      {markers.map((marker, index) => (
        <span key={`${marker}-${index}`}>{marker}</span>
      ))}
    </span>
  );
}

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
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
    <span className="flex min-w-0 items-center gap-2 text-left">
      <Avatar
        src={player.photoUrl}
        initials={buildInitials(player.name)}
        className="size-8 bg-muted text-muted-foreground"
      />
      <span className="min-w-0">
        <span
          className={cn(
            "flex min-w-0 items-center gap-2 font-medium",
            clickable && "hover:underline",
          )}
        >
          <span className="truncate">{player.name}</span>
          <PlayerMarkers markers={markers} />
        </span>
        {player.position ? (
          <span className="block truncate text-[11px] text-muted-foreground">
            {player.position}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function PlayerRow({
  href,
  className,
  children,
}: {
  href: string | null;
  className: string;
  children: ReactNode;
}) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function MatchLineupsPlayersList({
  lineup,
  playersById,
  getPlayerHref,
  eventMarkers,
  substitutionsByOutgoingPlayer,
  incomingPlayerIds,
  noLabel,
  nameLabel,
  substitutesLabel,
  emptyLabel,
  enteredForLabel,
}: {
  lineup: FootballLineup;
  playersById: Map<string, FootballLineupPlayer>;
  getPlayerHref?: (player: FootballLineupPlayer) => string | null;
  eventMarkers: Map<string, string[]>;
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>;
  incomingPlayerIds: Set<string>;
  noLabel: string;
  nameLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
  enteredForLabel: string;
}) {
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

  if (visibleStarters.length === 0 && substitutes.length === 0) {
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
        const playerHref = getPlayerHref?.(player) ?? null;
        const playerMarkers = eventMarkers.get(String(player.id));

        return (
          <div key={player.id} className="border-b last:border-b-0">
            <PlayerRow
              href={playerHref}
              className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 px-3 py-2 text-xs"
            >
              <span className="font-medium tabular-nums text-muted-foreground">
                {player.number}
              </span>
              <PlayerNameCell
                player={player}
                markers={playerMarkers}
                clickable={Boolean(playerHref)}
              />
            </PlayerRow>

            {substitutionsByOutgoingPlayer
              .get(String(player.id))
              ?.map((substitution, index) => {
                const incomingPlayer = playersById.get(
                  substitution.incomingPlayerId,
                );
                if (!incomingPlayer) {
                  return null;
                }

                const incomingHref = getPlayerHref?.(incomingPlayer) ?? null;
                const incomingMarkers = eventMarkers.get(
                  String(incomingPlayer.id),
                );

                return (
                  <PlayerRow
                    key={`${player.id}-sub-${substitution.incomingPlayerId}-${index}`}
                    href={incomingHref}
                    className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium tabular-nums text-muted-foreground">
                      {incomingPlayer.number}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 pl-1">
                      <span
                        className="shrink-0 text-[11px] leading-none text-muted-foreground"
                        aria-hidden="true"
                      >
                        ↕
                      </span>
                      <span className="sr-only">
                        {enteredForLabel} {player.name}.
                      </span>
                      <PlayerNameCell
                        player={incomingPlayer}
                        markers={incomingMarkers}
                        clickable={Boolean(incomingHref)}
                      />
                    </span>
                  </PlayerRow>
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
            const playerHref = getPlayerHref?.(player) ?? null;
            return (
              <PlayerRow
                href={playerHref}
                key={player.id}
                className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
              >
                <span className="font-medium tabular-nums text-muted-foreground">
                  {player.number}
                </span>
                <PlayerNameCell
                  player={player}
                  markers={eventMarkers.get(String(player.id))}
                  clickable={Boolean(playerHref)}
                />
              </PlayerRow>
            );
          })}
        </>
      ) : null}
    </div>
  );
}
