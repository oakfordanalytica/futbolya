import { parseLocalDateTime } from "@/lib/utils/date";

export type MatchPhase =
  | "not_started"
  | "first_half"
  | "halftime"
  | "second_half"
  | "finished";

export type MatchTimingSource = {
  date: string;
  startTime: string;
  matchPhase?: "first_half" | "halftime" | "second_half" | "finished";
  matchStartedAt?: number;
  matchEndedAt?: number;
  firstHalfStartedAt?: number;
  firstHalfEndedAt?: number;
  secondHalfStartedAt?: number;
  secondHalfEndedAt?: number;
  firstHalfAddedMinutes?: number;
  secondHalfAddedMinutes?: number;
};

export type MatchTiming = {
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

function getElapsedMilliseconds(
  startAt?: number,
  endAt?: number,
  nowMs?: number,
) {
  if (!startAt) {
    return 0;
  }

  const resolvedEndAt = endAt ?? nowMs ?? startAt;
  return Math.max(0, resolvedEndAt - startAt);
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function resolveMatchPhase(
  game: Omit<MatchTimingSource, "date" | "startTime">,
): MatchPhase {
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

  return Math.floor(getElapsedMilliseconds(startAt, endAt, nowMs) / 1000);
}

export function getNextMatchMinuteUpdateAt(
  game: MatchTimingSource,
  nowMs: number,
): number | null {
  const matchPhase = resolveMatchPhase(game);

  if (matchPhase !== "first_half" && matchPhase !== "second_half") {
    return null;
  }

  const firstHalfStartAt = game.firstHalfStartedAt ?? game.matchStartedAt;
  const firstHalfEndAt =
    game.firstHalfEndedAt ?? game.secondHalfStartedAt ?? game.matchEndedAt;
  const secondHalfStartAt = game.secondHalfStartedAt;

  const completedFirstHalfMs =
    matchPhase === "second_half"
      ? getElapsedMilliseconds(firstHalfStartAt, firstHalfEndAt, nowMs)
      : 0;
  const currentHalfStartAt =
    matchPhase === "first_half" ? firstHalfStartAt : secondHalfStartAt;

  if (!currentHalfStartAt) {
    return null;
  }

  const totalElapsedMs =
    completedFirstHalfMs + Math.max(0, nowMs - currentHalfStartAt);
  const nextBoundaryElapsedMs =
    (Math.floor(totalElapsedMs / 60000) + 1) * 60000;

  return nowMs + Math.max(0, nextBoundaryElapsedMs - totalElapsedMs);
}

export function getMatchTiming(
  game: MatchTimingSource,
  nowMs: number,
): MatchTiming {
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
