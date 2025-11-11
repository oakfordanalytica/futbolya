"use client";

import * as React from "react";
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
import { leagues } from "@/lib/mocks/data";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/ui/week-strip";
import { useScoreboardFilters } from "@/hooks/use-scoreboard-filters";

export function ScoreboardHeader() {
  const {
    selectedLeague,
    isLeagueOpen,
    setIsLeagueOpen,
    handleLeagueSelect,
    selectedDate,
    month,
    setMonth,
    handleDateSelect,
  } = useScoreboardFilters();

  const [selectedFilter, setSelectedFilter] = React.useState("All");

  const filterOptions = ["All", "Live", "Finished"];

  return (
    <Card className="w-full max-w-4xl p-3 gap-2 ">
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
                    onClick={() => setSelectedFilter(option)}
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
                onClick={() => setSelectedFilter(option)}
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
                {selectedLeague
                  ? leagues.find((league) => league.value === selectedLeague)
                      ?.label
                  : "Choose League"}
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
