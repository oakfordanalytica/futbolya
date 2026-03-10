"use client";

import { useMemo } from "react";
import {
  Combobox,
  ComboboxDescription,
  ComboboxLabel,
  ComboboxOption,
} from "@/components/ui/combobox";

export interface PlayerPickerOption {
  _id: string;
  clubId?: string;
  teamName?: string;
  playerName: string;
  jerseyNumber?: number;
  cometNumber?: string;
}

interface PlayerPickerProps {
  players: PlayerPickerOption[];
  value: string;
  onChange: (playerId: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled?: boolean;
  anchor?: "top" | "bottom";
}

export function PlayerPicker({
  players,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  anchor = "bottom",
}: PlayerPickerProps) {
  const selectedPlayer = useMemo(
    () => players.find((player) => player._id === value) ?? null,
    [players, value],
  );

  return (
    <Combobox
      value={selectedPlayer}
      onChange={(player) => onChange(player?._id ?? "")}
      options={players}
      displayValue={(player) => player?.playerName}
      filter={(player, query) =>
        player
          ? `${player.playerName} ${player.teamName ?? ""} ${
              player.jerseyNumber ?? ""
            } ${player.cometNumber ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase())
          : false
      }
      placeholder={placeholder}
      aria-label={searchPlaceholder || placeholder || "Select player"}
      disabled={disabled}
      anchor={anchor}
      immediate
      className="w-full"
    >
      {(player) => (
        <ComboboxOption value={player}>
          <ComboboxLabel>{player.playerName}</ComboboxLabel>
          <ComboboxDescription>
            {player.teamName ?? ""}
            {player.jerseyNumber !== undefined
              ? ` · #${player.jerseyNumber}`
              : player.cometNumber
                ? ` · ${player.cometNumber}`
                : ""}
          </ComboboxDescription>
        </ComboboxOption>
      )}
    </Combobox>
  );
}
