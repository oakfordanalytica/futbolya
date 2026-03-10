"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
}

export function PlayerPicker({
  players,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
}: PlayerPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedPlayer = useMemo(
    () => players.find((player) => player._id === value) ?? null,
    [players, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedPlayer ? (
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="truncate font-medium">
                {selectedPlayer.playerName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {selectedPlayer.teamName ?? ""}
                {selectedPlayer.jerseyNumber !== undefined
                  ? ` · #${selectedPlayer.jerseyNumber}`
                  : selectedPlayer.cometNumber
                    ? ` · ${selectedPlayer.cometNumber}`
                    : ""}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {players.map((player) => (
                <CommandItem
                  key={player._id}
                  value={`${player.playerName} ${player.teamName ?? ""} ${
                    player.jerseyNumber ?? ""
                  } ${player.cometNumber ?? ""}`}
                  onSelect={() => {
                    onChange(player._id);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {player.playerName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {player.teamName ?? ""}
                      {player.jerseyNumber !== undefined
                        ? ` · #${player.jerseyNumber}`
                        : player.cometNumber
                          ? ` · ${player.cometNumber}`
                          : ""}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 size-4 shrink-0",
                      value === player._id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
