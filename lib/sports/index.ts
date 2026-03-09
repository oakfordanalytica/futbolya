"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

export interface SportTerminology {
  team: string;
  teams: string;
  match: string;
  matches: string;
  score: string;
  division: string;
  divisions: string;
  club: string;
  clubs: string;
  tournament: string;
  tournaments: string;
  player: string;
  players: string;
  group: string;
  groups: string;
}

export function useSportTerminology(): SportTerminology {
  const t = useTranslations("Sports.soccer.terminology");

  return React.useMemo(
    () => ({
      team: t("team"),
      teams: t("teams"),
      match: t("match"),
      matches: t("matches"),
      score: t("score"),
      division: t("division"),
      divisions: t("divisions"),
      club: t("club"),
      clubs: t("clubs"),
      tournament: t("tournament"),
      tournaments: t("tournaments"),
      player: t("player"),
      players: t("players"),
      group: t("group"),
      groups: t("groups"),
    }),
    [t],
  );
}
