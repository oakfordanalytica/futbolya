import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";

export type MatchLineupsGamePlayerStat = {
  _id: string;
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  isStarter: boolean;
};

export type MatchLineupsTimelineEvent = {
  id: string;
  side: "home" | "away";
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "penalty_scored"
    | "penalty_missed";
  playerId: string;
  relatedPlayerId?: string;
};

export type PlayerSubstitutionLink = {
  outgoingPlayerId: string;
  incomingPlayerId: string;
};

export type PlayerSubstitutionData = {
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>;
  substitutionsByIncomingPlayer: Map<string, PlayerSubstitutionLink[]>;
  incomingPlayerIds: Set<string>;
};

type PersistedLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  photoUrl?: string;
  jerseyNumber?: number;
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

export function mapStatToLineupPlayer(
  stat: MatchLineupsGamePlayerStat,
): FootballLineupPlayer {
  return {
    id: stat.playerId,
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
  stats: MatchLineupsGamePlayerStat[],
): FootballLineup {
  return {
    teamName,
    teamColor,
    starters: stats.filter((stat) => stat.isStarter).map(mapStatToLineupPlayer),
    substitutes: stats
      .filter((stat) => !stat.isStarter)
      .map(mapStatToLineupPlayer),
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

export function buildDisplayLineup(
  teamName: string,
  teamColor: string | undefined,
  lineup: PersistedLineup | null | undefined,
  stats: MatchLineupsGamePlayerStat[],
) {
  if (lineup) {
    return buildPersistedLineup(teamName, teamColor, lineup);
  }

  return buildLineup(teamName, teamColor, stats);
}

export function buildFallbackPlayers(
  stats: MatchLineupsGamePlayerStat[],
): FootballLineupPlayer[] {
  return stats.map(mapStatToLineupPlayer);
}

export function buildPlayersById(
  players: FootballLineupPlayer[],
): Map<string, FootballLineupPlayer> {
  return new Map(players.map((player) => [String(player.id), player]));
}

export function getPlayerEventMarkers(events: MatchLineupsTimelineEvent[]) {
  const markers = new Map<string, string[]>();

  const pushMarker = (playerId: string, marker: string) => {
    const current = markers.get(playerId) ?? [];
    current.push(marker);
    markers.set(playerId, current);
  };

  for (const event of events) {
    switch (event.type) {
      case "goal":
        pushMarker(event.playerId, "⚽");
        break;
      case "yellow_card":
        pushMarker(event.playerId, "🟨");
        break;
      case "red_card":
        pushMarker(event.playerId, "🟥");
        break;
      case "penalty_scored":
        pushMarker(event.playerId, "🎯");
        break;
      case "penalty_missed":
        pushMarker(event.playerId, "❌");
        break;
      case "substitution":
      default:
        break;
    }
  }

  return markers;
}

export function getPlayerSubstitutionLinks(
  events: MatchLineupsTimelineEvent[],
  starterIds: Set<string>,
): PlayerSubstitutionData {
  const substitutionsByOutgoingPlayer = new Map<
    string,
    PlayerSubstitutionLink[]
  >();
  const substitutionsByIncomingPlayer = new Map<
    string,
    PlayerSubstitutionLink[]
  >();
  const incomingPlayerIds = new Set<string>();

  for (const event of events) {
    if (event.type !== "substitution" || !event.relatedPlayerId) {
      continue;
    }

    const playerIsStarter = starterIds.has(String(event.playerId));
    const relatedPlayerIsStarter = starterIds.has(
      String(event.relatedPlayerId),
    );

    let outgoingPlayerId = String(event.playerId);
    let incomingPlayerId = String(event.relatedPlayerId);

    if (!playerIsStarter && relatedPlayerIsStarter) {
      outgoingPlayerId = String(event.relatedPlayerId);
      incomingPlayerId = String(event.playerId);
    }

    const outgoingLinks =
      substitutionsByOutgoingPlayer.get(outgoingPlayerId) ?? [];
    outgoingLinks.push({ outgoingPlayerId, incomingPlayerId });
    substitutionsByOutgoingPlayer.set(outgoingPlayerId, outgoingLinks);

    const incomingLinks =
      substitutionsByIncomingPlayer.get(incomingPlayerId) ?? [];
    incomingLinks.push({ outgoingPlayerId, incomingPlayerId });
    substitutionsByIncomingPlayer.set(incomingPlayerId, incomingLinks);

    incomingPlayerIds.add(incomingPlayerId);
  }

  return {
    substitutionsByOutgoingPlayer,
    substitutionsByIncomingPlayer,
    incomingPlayerIds,
  };
}

export function getPlayerSubstitutionTooltipLines(
  playerId: string,
  substitutionData: Pick<
    PlayerSubstitutionData,
    "substitutionsByOutgoingPlayer" | "substitutionsByIncomingPlayer"
  >,
  playersById: Map<string, FootballLineupPlayer>,
  substitutedByLabel: string,
  enteredForLabel: string,
): string[] {
  const outgoingLinks =
    substitutionData.substitutionsByOutgoingPlayer.get(playerId) ?? [];
  const incomingLinks =
    substitutionData.substitutionsByIncomingPlayer.get(playerId) ?? [];

  return [
    ...outgoingLinks
      .map((link) => playersById.get(link.incomingPlayerId))
      .filter((player): player is FootballLineupPlayer => Boolean(player))
      .map((player) => `${substitutedByLabel}: ${player.name}`),
    ...incomingLinks
      .map((link) => playersById.get(link.outgoingPlayerId))
      .filter((player): player is FootballLineupPlayer => Boolean(player))
      .map((player) => `${enteredForLabel}: ${player.name}`),
  ];
}
