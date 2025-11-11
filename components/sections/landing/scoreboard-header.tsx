"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/ui/week-strip";
import type {
  ScoreboardHeaderProps,
  StatusFilterOption,
} from "@/lib/scoreboard/types";

export function ScoreboardHeader({
  leagues,
  selectedFilter,
  onFilterChange,
  selectedLeague,
  isLeagueOpen,
  setIsLeagueOpen,
  handleLeagueSelect,
  selectedDate,
  month,
  setMonth,
  handleDateSelect,
}: ScoreboardHeaderProps) {
  const filterOptions: StatusFilterOption[] = ["All", "Live", "Finished"];

  const selectedLeagueLabel = selectedLeague
    ? (leagues.find((league) => league.value === selectedLeague)?.label ??
      "Choose League")
    : "Choose League";

  return (
    <Card className="w-full p-3 gap-2 rounded-none md:rounded-lg">
      <CardHeader className="px-0">
        <CardDescription>
          {/* Mobile: Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline" className="w-full justify-between">
                {selectedFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full" align="start">
              <DropdownMenuGroup>
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => onFilterChange(option)}
                  >
                    {option}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedFilter === option ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop: Button Group */}
          <ButtonGroup className="hidden md:flex">
            {filterOptions.map((option) => (
              <Button
                key={option}
                variant={selectedFilter === option ? "default" : "outline"}
                onClick={() => onFilterChange(option)}
              >
                {option}
              </Button>
            ))}
          </ButtonGroup>
        </CardDescription>
        <CardAction>
          <Popover open={isLeagueOpen} onOpenChange={setIsLeagueOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isLeagueOpen}
                className="w-[200px] justify-between"
              >
                {selectedLeagueLabel}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search league..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No league found.</CommandEmpty>
                  <CommandGroup>
                    {leagues.map((league) => (
                      <CommandItem
                        key={league.value}
                        value={league.value}
                        onSelect={handleLeagueSelect}
                      >
                        {league.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedLeague === league.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <WeekStrip
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
        />
      </CardContent>
    </Card>
  );
}
