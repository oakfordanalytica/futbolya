import type { GameEventType } from "@/lib/games/event-types";

export type ParticipationStat = {
  isStarter: boolean;
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesAttempted?: number;
  penaltiesScored?: number;
  substitutionsIn?: number;
  substitutionsOut?: number;
};

export type PlayerStatIncrements = {
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesAttempted?: number;
  penaltiesScored?: number;
  substitutionsIn?: number;
  substitutionsOut?: number;
};

export type TeamStatIncrements = {
  substitutions?: number;
};

export type SubstitutionDirection<PlayerId> = {
  outgoingPlayerId: PlayerId;
  incomingPlayerId: PlayerId;
};

type SubstitutionResolutionEvent<PlayerId> = {
  playerId: PlayerId;
  relatedPlayerId?: PlayerId;
};

type CountableSubstitutionEvent<PlayerId, ClubId> = {
  _creationTime: number;
  clubId: ClubId;
  eventType: string;
  playerId: PlayerId;
  relatedPlayerId?: PlayerId;
  minute: number;
};

export function didPlayerParticipate(stat: ParticipationStat): boolean {
  return (
    stat.isStarter ||
    (stat.goals ?? 0) > 0 ||
    (stat.yellowCards ?? 0) > 0 ||
    (stat.redCards ?? 0) > 0 ||
    (stat.penaltiesAttempted ?? 0) > 0 ||
    (stat.penaltiesScored ?? 0) > 0 ||
    (stat.substitutionsIn ?? 0) > 0 ||
    (stat.substitutionsOut ?? 0) > 0
  );
}

export function resolveSubstitutionDirection<PlayerId>(
  currentOnField: ReadonlySet<PlayerId>,
  event: SubstitutionResolutionEvent<PlayerId>,
): SubstitutionDirection<PlayerId> | null {
  if (!event.relatedPlayerId) {
    return null;
  }

  const playerIsOnField = currentOnField.has(event.playerId);
  const relatedPlayerIsOnField = currentOnField.has(event.relatedPlayerId);

  if (playerIsOnField && !relatedPlayerIsOnField) {
    return {
      outgoingPlayerId: event.playerId,
      incomingPlayerId: event.relatedPlayerId,
    };
  }

  if (!playerIsOnField && relatedPlayerIsOnField) {
    return {
      outgoingPlayerId: event.relatedPlayerId,
      incomingPlayerId: event.playerId,
    };
  }

  return {
    outgoingPlayerId: event.playerId,
    incomingPlayerId: event.relatedPlayerId,
  };
}

export function applySubstitutionEvent<PlayerId>(
  currentOnField: Set<PlayerId>,
  event: SubstitutionResolutionEvent<PlayerId>,
): SubstitutionDirection<PlayerId> | null {
  const direction = resolveSubstitutionDirection(currentOnField, event);
  if (!direction) {
    return null;
  }

  currentOnField.delete(direction.outgoingPlayerId);
  currentOnField.add(direction.incomingPlayerId);
  return direction;
}

export function buildSubstitutionCountsFromEvents<PlayerId, ClubId>(args: {
  events: Array<CountableSubstitutionEvent<PlayerId, ClubId>>;
  initialOnFieldByClub: Map<ClubId, Set<PlayerId>>;
}) {
  const counts = new Map<
    PlayerId,
    { substitutionsIn: number; substitutionsOut: number }
  >();
  const currentOnFieldByClub = new Map<ClubId, Set<PlayerId>>(
    Array.from(args.initialOnFieldByClub.entries(), ([clubId, players]) => [
      clubId,
      new Set(players),
    ]),
  );

  const increment = (
    playerId: PlayerId,
    field: "substitutionsIn" | "substitutionsOut",
  ) => {
    const current = counts.get(playerId) ?? {
      substitutionsIn: 0,
      substitutionsOut: 0,
    };
    current[field] += 1;
    counts.set(playerId, current);
  };

  const sortedEvents = [...args.events].sort((left, right) => {
    if (left.minute !== right.minute) {
      return left.minute - right.minute;
    }
    return left._creationTime - right._creationTime;
  });

  for (const event of sortedEvents) {
    if (event.eventType !== "substitution" || !event.relatedPlayerId) {
      continue;
    }

    const currentOnField =
      currentOnFieldByClub.get(event.clubId) ?? new Set<PlayerId>();
    const direction = applySubstitutionEvent(currentOnField, {
      playerId: event.playerId,
      relatedPlayerId: event.relatedPlayerId,
    });

    if (!direction) {
      continue;
    }

    increment(direction.outgoingPlayerId, "substitutionsOut");
    increment(direction.incomingPlayerId, "substitutionsIn");
    currentOnFieldByClub.set(event.clubId, currentOnField);
  }

  return counts;
}

export function getEventStatEffects(eventType: GameEventType): {
  primaryPlayer?: PlayerStatIncrements;
  relatedPlayer?: PlayerStatIncrements;
  team?: TeamStatIncrements;
  scoreDelta?: number;
} {
  switch (eventType) {
    case "goal":
      return {
        primaryPlayer: { goals: 1 },
        scoreDelta: 1,
      };
    case "yellow_card":
      return {
        primaryPlayer: { yellowCards: 1 },
      };
    case "red_card":
      return {
        primaryPlayer: { redCards: 1 },
      };
    case "penalty_scored":
      return {
        primaryPlayer: {
          goals: 1,
          penaltiesAttempted: 1,
          penaltiesScored: 1,
        },
        scoreDelta: 1,
      };
    case "penalty_missed":
      return {
        primaryPlayer: { penaltiesAttempted: 1 },
      };
    case "substitution":
      return {
        primaryPlayer: { substitutionsOut: 1 },
        relatedPlayer: { substitutionsIn: 1 },
        team: { substitutions: 1 },
      };
    default:
      return {};
  }
}
