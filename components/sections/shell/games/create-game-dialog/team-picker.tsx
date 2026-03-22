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
import { TeamLogo } from "./team-logo";
import type { Club } from "./types";

export function TeamPicker({
  value,
  selectedClub,
  availableClubs,
  disabled,
  placeholder,
  onSelect,
}: {
  value: string;
  selectedClub: Club | null;
  availableClubs: Club[];
  disabled?: boolean;
  placeholder: string;
  onSelect: (clubId: string) => void;
}) {
  const t = useTranslations("Common");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "mt-2 w-full min-w-0 justify-between",
            !value && "text-muted-foreground",
          )}
        >
          {selectedClub ? (
            <span className="flex min-w-0 items-center gap-2">
              <TeamLogo club={selectedClub} />
              <span className="truncate">{selectedClub.name}</span>
            </span>
          ) : value ? (
            t("actions.loading")
          ) : (
            placeholder
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
              {availableClubs.map((club) => (
                <CommandItem
                  key={club._id}
                  value={club.name}
                  disabled={disabled}
                  onSelect={() => {
                    if (disabled) {
                      return;
                    }
                    onSelect(club._id);
                  }}
                >
                  <TeamLogo club={club} />
                  <span className="ml-2">{club.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === club._id ? "opacity-100" : "opacity-0",
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
