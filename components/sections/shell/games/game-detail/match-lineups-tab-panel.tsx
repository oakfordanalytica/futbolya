"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import { FootballField } from "@/components/ui/football-field";
import { cn } from "@/lib/utils";
import {
  buildPlayersById,
  getPlayerSubstitutionTooltipLines,
  type PlayerSubstitutionData,
} from "./match-lineups-domain";
import { MatchLineupsPlayersList } from "./match-lineups-players-list";
import { MatchLineupsSlotSubstitutionAccessory } from "./match-lineups-slot-substitution-accessory";

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

export function MatchLineupsTabPanel({
  lineup,
  fallbackPlayers,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  eventMarkers,
  substitutionData,
  pendingFormationDescription,
  noLabel,
  nameLabel,
  substitutesLabel,
  emptyLabel,
  substitutedByLabel,
  enteredForLabel,
}: {
  lineup: FootballLineup;
  fallbackPlayers: FootballLineupPlayer[];
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  eventMarkers: Map<string, string[]>;
  substitutionData: PlayerSubstitutionData;
  pendingFormationDescription: string;
  noLabel: string;
  nameLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
  substitutedByLabel: string;
  enteredForLabel: string;
}) {
  const playersById = useMemo(
    () =>
      buildPlayersById([
        ...lineup.starters,
        ...(lineup.substitutes ?? []),
        ...fallbackPlayers,
      ]),
    [fallbackPlayers, lineup.starters, lineup.substitutes],
  );

  const renderSlotAccessory = useCallback(
    (slot: FootballLineupSlot): ReactNode => {
      if (!slot.player) {
        return null;
      }

      const tooltipLines = getPlayerSubstitutionTooltipLines(
        String(slot.player.id),
        substitutionData,
        playersById,
        substitutedByLabel,
        enteredForLabel,
      );

      return (
        <MatchLineupsSlotSubstitutionAccessory
          slotId={slot.id}
          tooltipLines={tooltipLines}
        />
      );
    },
    [enteredForLabel, playersById, substitutedByLabel, substitutionData],
  );

  return (
    <div className="space-y-4">
      {lineup.formation ? (
        <FootballField
          lineup={lineup}
          className="mx-auto max-w-[272px] sm:max-w-[320px]"
          renderSlotAccessory={renderSlotAccessory}
        />
      ) : (
        <FieldPlaceholder
          title={lineup.teamName}
          description={pendingFormationDescription}
        />
      )}

      <MatchLineupsPlayersList
        lineup={lineup}
        playersById={playersById}
        orgSlug={orgSlug}
        routeScope={routeScope}
        currentClubSlug={currentClubSlug}
        teamClubSlug={teamClubSlug}
        eventMarkers={eventMarkers}
        substitutionsByOutgoingPlayer={
          substitutionData.substitutionsByOutgoingPlayer
        }
        incomingPlayerIds={substitutionData.incomingPlayerIds}
        noLabel={noLabel}
        nameLabel={nameLabel}
        substitutesLabel={substitutesLabel}
        emptyLabel={emptyLabel}
      />
    </div>
  );
}
