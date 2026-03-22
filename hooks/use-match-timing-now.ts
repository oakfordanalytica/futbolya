"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getNextMatchMinuteUpdateAt,
  type MatchTimingSource,
} from "@/lib/games/match-timing";

function buildTimingSourceKey(source: MatchTimingSource) {
  return [
    source.date,
    source.startTime,
    source.matchPhase ?? "",
    source.matchStartedAt ?? "",
    source.matchEndedAt ?? "",
    source.firstHalfStartedAt ?? "",
    source.firstHalfEndedAt ?? "",
    source.secondHalfStartedAt ?? "",
    source.secondHalfEndedAt ?? "",
  ].join(":");
}

export function useMatchTimingNow(
  sourceOrSources: MatchTimingSource | MatchTimingSource[] | null | undefined,
) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const sources = useMemo(() => {
    if (!sourceOrSources) {
      return [];
    }

    return Array.isArray(sourceOrSources)
      ? sourceOrSources.filter(Boolean)
      : [sourceOrSources];
  }, [sourceOrSources]);

  const sourceKey = useMemo(
    () => sources.map(buildTimingSourceKey).join("|"),
    [sources],
  );

  useEffect(() => {
    if (sources.length === 0) {
      return;
    }

    setNowMs(Date.now());
  }, [sourceKey, sources.length]);

  const nextUpdateAt = useMemo(() => {
    let earliestUpdateAt: number | null = null;

    for (const source of sources) {
      const nextUpdateForSource = getNextMatchMinuteUpdateAt(source, nowMs);

      if (nextUpdateForSource === null) {
        continue;
      }

      earliestUpdateAt =
        earliestUpdateAt === null
          ? nextUpdateForSource
          : Math.min(earliestUpdateAt, nextUpdateForSource);
    }

    return earliestUpdateAt;
  }, [nowMs, sources]);

  useEffect(() => {
    if (nextUpdateAt === null) {
      return;
    }

    const delayMs = Math.max(0, nextUpdateAt - Date.now() + 16);
    const timeoutId = window.setTimeout(() => {
      setNowMs(Date.now());
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [nextUpdateAt]);

  return nowMs;
}
