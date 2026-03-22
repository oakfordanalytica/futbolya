"use client";

import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ActiveSeason } from "./types";

export function SeasonPicker({
  value,
  selectedSeason,
  seasons,
  disabled,
  hasActiveSeasons,
  onSelect,
}: {
  value: string;
  selectedSeason?: ActiveSeason;
  seasons: ActiveSeason[];
  disabled?: boolean;
  hasActiveSeasons: boolean;
  onSelect: (seasonId: string) => void;
}) {
  const t = useTranslations("Common");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={!hasActiveSeasons || disabled}
          className={cn(
            "mt-2 w-full min-w-0 justify-between",
            !value && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-70",
          )}
        >
          {value && selectedSeason ? (
            <span className="truncate">{selectedSeason.name}</span>
          ) : hasActiveSeasons ? (
            t("games.selectSeason")
          ) : (
            t("games.noActiveSeasons")
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t("actions.search")} />
          <CommandList>
            <CommandEmpty>{t("table.noResults")}</CommandEmpty>
            <CommandGroup>
              {seasons.map((season) => (
                <CommandItem
                  key={season.id}
                  value={season.name}
                  disabled={disabled}
                  onSelect={() => {
                    if (disabled) {
                      return;
                    }
                    onSelect(season.id);
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{season.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {season.startDate} - {season.endDate}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === season.id ? "opacity-100" : "opacity-0",
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
