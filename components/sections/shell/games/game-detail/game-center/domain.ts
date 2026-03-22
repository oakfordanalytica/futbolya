import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import type { GameEventType } from "@/lib/games/event-types";
import { parseLocalDateTime } from "@/lib/utils/date";
import type { PlayerPickerOption } from "../player-picker";

export type CenterTeamKey = "home" | "away";

export type MatchPhase =
  | "not_started"
  | "first_half"
  | "halftime"
  | "second_half"
  | "finished";

export type TimelineEvent = {
  id: string;
  side: CenterTeamKey;
  type: GameEventType;
  minute: number | string;
  playerId: string;
  relatedPlayerId?: string;
  primaryText?: string;
  secondaryText?: string;
};

export type CenterRosterPlayer = PlayerPickerOption & {
  lastName?: string;
  photoUrl?: string;
  position?: string;
};

export type CenterLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  jerseyNumber?: number;
  cometNumber?: string;
  photoUrl?: string;
  position?: string;
};

export type CenterLineupSlot = {
  id: string;
  x: number;
  y: number;
  role: "goalkeeper" | "outfield";
  player?: CenterLineupPlayer;
};

export type CenterResolvedTeam = {
  key: CenterTeamKey;
  clubId: string;
  teamName: string;
  teamLogoUrl?: string;
  teamColor?: string;
  formation?: string;
  lineup: FootballLineup | null;
  roster: CenterRosterPlayer[];
  onFieldPlayerIds: Set<string>;
};

type CenterTeamSourceRosterPlayer = {
  _id: string | number;
  playerName: string;
  lastName?: string;
  jerseyNumber?: number;
  cometNumber?: string;
  photoUrl?: string;
  position?: string;
};

type CenterTeamSourceLineupPlayer = {
  playerId: string | number;
  playerName: string;
  lastName: string;
  jerseyNumber?: number;
  cometNumber?: string;
  photoUrl?: string;
  position?: string;
};

type CenterTeamSource = {
  clubId: string | number;
  teamName: string;
  teamLogoUrl?: string;
  teamColor?: string;
  lineup?:
    | {
        formation?: string;
        slots: Array<{
          id: string;
          x: number;
          y: number;
          role: "goalkeeper" | "outfield";
          player?: CenterTeamSourceLineupPlayer;
        }>;
      }
    | null
    | undefined;
  roster: CenterTeamSourceRosterPlayer[];
};

type MatchPhaseSource = {
  matchPhase?: "first_half" | "halftime" | "second_half" | "finished";
  matchStartedAt?: number;
  matchEndedAt?: number;
  firstHalfEndedAt?: number;
  secondHalfStartedAt?: number;
};

type TimingSource = MatchPhaseSource & {
  date: string;
  startTime: string;
  firstHalfStartedAt?: number;
  secondHalfEndedAt?: number;
  firstHalfAddedMinutes?: number;
  secondHalfAddedMinutes?: number;
};

export type GameCenterTiming = {
  scheduledDateTime: Date | null;
  matchPhase: MatchPhase;
  hasStarted: boolean;
  hasEnded: boolean;
  canStart: boolean;
  isLive: boolean;
  elapsedSeconds: number;
  liveMinute: number;
  currentHalfAddedMinutes: number;
};

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function buildDisplayLastName(playerName: string, lastName?: string) {
  if (lastName?.trim()) {
    return lastName.trim();
  }

  const parts = playerName.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : (parts[0] ?? "");
}

export function buildPlayerInitials(playerName: string) {
  const parts = playerName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function normalizeTimelineEvents(
  events:
    | Array<{
        id: string;
        side: CenterTeamKey;
        type: GameEventType;
        minute: number | string;
        playerId: string | number;
        relatedPlayerId?: string | number;
        primaryText?: string;
        secondaryText?: string;
      }>
    | undefined,
): TimelineEvent[] {
  return (
    events?.map((event) => ({
      ...event,
      playerId: String(event.playerId),
      relatedPlayerId: event.relatedPlayerId
        ? String(event.relatedPlayerId)
        : undefined,
    })) ?? []
  );
}

function mapLineupPlayer(player: CenterLineupPlayer): FootballLineupPlayer {
  return {
    id: player.playerId,
    name: player.playerName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function mapRosterPlayer(player: CenterRosterPlayer): FootballLineupPlayer {
  return {
    id: player._id,
    name: player.playerName,
    lastName: buildDisplayLastName(player.playerName, player.lastName),
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function sortTimelineEvents(events: TimelineEvent[]) {
  return [...events].sort((left, right) => {
    const leftMinute =
      typeof left.minute === "number" ? left.minute : Number(left.minute);
    const rightMinute =
      typeof right.minute === "number" ? right.minute : Number(right.minute);

    if (leftMinute !== rightMinute) {
      return leftMinute - rightMinute;
    }

    return left.id.localeCompare(right.id);
  });
}

function resolveLiveLineup(args: {
  teamKey: CenterTeamKey;
  teamName: string;
  teamColor?: string;
  teamLineup:
    | {
        formation?: string;
        slots: CenterLineupSlot[];
      }
    | null
    | undefined;
  roster: CenterRosterPlayer[];
  events: TimelineEvent[];
}) {
  if (!args.teamLineup || args.teamLineup.slots.length === 0) {
    return {
      lineup: null,
      onFieldPlayerIds: new Set<string>(),
    };
  }

  const rosterById = new Map(
    args.roster.map((player) => [String(player._id), player]),
  );

  const currentSlots: FootballLineupSlot[] = args.teamLineup.slots.map(
    (slot) => ({
      id: slot.id,
      x: slot.x,
      y: slot.y,
      role: slot.role,
      ...(slot.player ? { player: mapLineupPlayer(slot.player) } : {}),
    }),
  );

  const currentOnFieldIds = new Set<string>(
    currentSlots
      .map((slot) => (slot.player ? String(slot.player.id) : null))
      .filter((playerId): playerId is string => Boolean(playerId)),
  );

  const substitutionEvents = sortTimelineEvents(
    args.events.filter(
      (event) =>
        event.side === args.teamKey &&
        event.type === "substitution" &&
        event.relatedPlayerId,
    ),
  );

  for (const event of substitutionEvents) {
    if (!event.relatedPlayerId) {
      continue;
    }

    let outgoingPlayerId = String(event.playerId);
    let incomingPlayerId = String(event.relatedPlayerId);

    // Support current semantics and older inverted substitution events.
    if (
      !currentOnFieldIds.has(outgoingPlayerId) &&
      currentOnFieldIds.has(incomingPlayerId)
    ) {
      outgoingPlayerId = String(event.relatedPlayerId);
      incomingPlayerId = String(event.playerId);
    }

    const targetSlot = currentSlots.find(
      (slot) => String(slot.player?.id) === outgoingPlayerId,
    );
    if (!targetSlot) {
      continue;
    }

    const incomingPlayer = rosterById.get(incomingPlayerId);
    currentOnFieldIds.delete(outgoingPlayerId);
    currentOnFieldIds.add(incomingPlayerId);
    targetSlot.player = incomingPlayer
      ? mapRosterPlayer(incomingPlayer)
      : {
          id: incomingPlayerId,
          name: event.secondaryText ?? "Jugador",
          lastName: buildDisplayLastName(event.secondaryText ?? "Jugador"),
          number: "—",
        };
  }

  return {
    lineup: {
      teamName: args.teamName,
      teamColor: args.teamColor,
      formation: args.teamLineup.formation,
      slots: currentSlots,
      starters: currentSlots
        .map((slot) => slot.player)
        .filter((player): player is FootballLineupPlayer => Boolean(player)),
      substitutes: args.roster
        .filter((player) => !currentOnFieldIds.has(String(player._id)))
        .map(mapRosterPlayer),
    } satisfies FootballLineup,
    onFieldPlayerIds: currentOnFieldIds,
  };
}

function toCenterRosterPlayer(
  player: CenterTeamSourceRosterPlayer,
  team: CenterTeamSource,
): CenterRosterPlayer {
  return {
    _id: String(player._id),
    clubId: String(team.clubId),
    teamName: team.teamName,
    playerName: player.playerName,
    lastName: player.lastName,
    jerseyNumber: player.jerseyNumber,
    cometNumber: player.cometNumber,
    photoUrl: player.photoUrl,
    position: player.position,
  };
}

function toCenterLineupSlot(
  slot: NonNullable<CenterTeamSource["lineup"]>["slots"][number],
): CenterLineupSlot {
  return {
    id: slot.id,
    x: slot.x,
    y: slot.y,
    role: slot.role,
    player: slot.player
      ? {
          playerId: String(slot.player.playerId),
          playerName: slot.player.playerName,
          lastName: slot.player.lastName,
          jerseyNumber: slot.player.jerseyNumber,
          cometNumber: slot.player.cometNumber,
          photoUrl: slot.player.photoUrl,
          position: slot.player.position,
        }
      : undefined,
  };
}

export function buildResolvedTeam(
  teamKey: CenterTeamKey,
  team: CenterTeamSource,
  events: TimelineEvent[],
): CenterResolvedTeam {
  const roster = team.roster.map((player) => toCenterRosterPlayer(player, team));
  const resolved = resolveLiveLineup({
    teamKey,
    teamName: team.teamName,
    teamColor: team.teamColor,
    teamLineup: team.lineup
      ? {
          formation: team.lineup.formation,
          slots: team.lineup.slots.map(toCenterLineupSlot),
        }
      : null,
    roster,
    events,
  });

  return {
    key: teamKey,
    clubId: String(team.clubId),
    teamName: team.teamName,
    teamLogoUrl: team.teamLogoUrl,
    teamColor: team.teamColor,
    formation: team.lineup?.formation,
    lineup: resolved.lineup,
    roster,
    onFieldPlayerIds: resolved.onFieldPlayerIds,
  };
}

export function resolveMatchPhase(game: MatchPhaseSource): MatchPhase {
  if (game.matchPhase) {
    return game.matchPhase;
  }
  if (game.matchEndedAt) {
    return "finished";
  }
  if (game.secondHalfStartedAt) {
    return "second_half";
  }
  if (game.firstHalfEndedAt) {
    return "halftime";
  }
  if (game.matchStartedAt) {
    return "first_half";
  }
  return "not_started";
}

function getElapsedSeconds(startAt?: number, endAt?: number, nowMs?: number) {
  if (!startAt) {
    return 0;
  }

  const resolvedEndAt = endAt ?? nowMs ?? startAt;
  return Math.max(0, Math.floor((resolvedEndAt - startAt) / 1000));
}

export function getGameCenterTiming(
  game: TimingSource,
  nowMs: number,
): GameCenterTiming {
  const scheduledDateTime = parseLocalDateTime(game.date, game.startTime);
  const matchPhase = resolveMatchPhase(game);
  const hasStarted = matchPhase !== "not_started";
  const hasEnded = matchPhase === "finished";
  const canStart =
    !hasStarted &&
    !hasEnded &&
    Boolean(scheduledDateTime) &&
    nowMs >= (scheduledDateTime?.getTime() ?? Number.POSITIVE_INFINITY);
  const isLive = matchPhase === "first_half" || matchPhase === "second_half";

  const firstHalfStartAt = game.firstHalfStartedAt ?? game.matchStartedAt;
  const firstHalfEndAt =
    game.firstHalfEndedAt ?? game.secondHalfStartedAt ?? game.matchEndedAt;
  const secondHalfStartAt = game.secondHalfStartedAt;
  const secondHalfEndAt = game.secondHalfEndedAt ?? game.matchEndedAt;

  const firstHalfElapsedSeconds =
    matchPhase === "first_half"
      ? getElapsedSeconds(firstHalfStartAt, undefined, nowMs)
      : getElapsedSeconds(firstHalfStartAt, firstHalfEndAt, nowMs);
  const secondHalfElapsedSeconds =
    matchPhase === "second_half"
      ? getElapsedSeconds(secondHalfStartAt, undefined, nowMs)
      : getElapsedSeconds(secondHalfStartAt, secondHalfEndAt, nowMs);
  const elapsedSeconds = firstHalfElapsedSeconds + secondHalfElapsedSeconds;
  const liveMinute = Math.max(
    1,
    Math.min(130, Math.floor(elapsedSeconds / 60) + 1),
  );
  const currentHalfAddedMinutes =
    matchPhase === "first_half"
      ? (game.firstHalfAddedMinutes ?? 0)
      : matchPhase === "second_half"
        ? (game.secondHalfAddedMinutes ?? 0)
        : 0;

  return {
    scheduledDateTime,
    matchPhase,
    hasStarted,
    hasEnded,
    canStart,
    isLive,
    elapsedSeconds,
    liveMinute,
    currentHalfAddedMinutes,
  };
}
