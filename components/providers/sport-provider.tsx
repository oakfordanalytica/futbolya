"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  getSportConfig,
  type SportType,
  type SportConfig,
  type SportTerminology,
} from "@/lib/sports";

interface SportContextValue {
  sportType: SportType;
  config: SportConfig;
  terminology: SportTerminology;
}

const SportContext = React.createContext<SportContextValue | null>(null);

function useSport() {
  const context = React.useContext(SportContext);
  if (!context) {
    throw new Error("useSport must be used within a SportProvider");
  }
  return context;
}

export function useSportTerminology(): SportTerminology {
  return useSport().terminology;
}

interface SportProviderProps {
  sportType: SportType;
  children: React.ReactNode;
}

export function SportProvider({ sportType, children }: SportProviderProps) {
  const config = React.useMemo(() => getSportConfig(sportType), [sportType]);
  // Aparentemente lo que se está haciendo es obtener las traducciones para el tipo de deporte actual
  // para luego utilizarlas en el contexto del proveedor de deportes, pero traduciendo dos veces
  // lo cual es innecesario y puede afectar el rendimiento. Se debe revisar
  const t = useTranslations(`Sports.${config.terminologyKey}.terminology`);

  const terminology: SportTerminology = React.useMemo(
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

  const value = React.useMemo(
    () => ({ sportType, config, terminology }),
    [sportType, config, terminology],
  );

  return (
    <SportContext.Provider value={value}>{children}</SportContext.Provider>
  );
}
