"use client";

import * as React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
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
import { leagues } from "@/lib/mocks/data";
import { cn } from "@/lib/utils";
import { WeekStrip } from "../week-strip";
import { useScoreboardFilters } from "@/hooks/use-scoreboard-filters";

export function ScoreboardHeader() {
  const {
    selectedLeague,
    isLeagueOpen,
    setIsLeagueOpen,
    handleLeagueSelect,
    selectedDate,
    isCalendarOpen,
    setIsCalendarOpen,
    month,
    setMonth,
    handleDateSelect,
  } = useScoreboardFilters();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardDescription>
          <ButtonGroup>
            <Button variant="outline">All</Button>
            <Button variant="outline">Live</Button>
            <Button variant="outline">Finished</Button>
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
      <CardContent>
        <div className="relative">
          <WeekStrip
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant="ghost"
                className="absolute top-1/2 right-0 size-8 -translate-y-1/2"
              >
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
