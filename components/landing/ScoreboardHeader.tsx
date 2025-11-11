"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import * as React from "react";
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
import { cn, formatDate } from "@/lib/utils";
import { parseDate } from "chrono-node";
import { WeekStrip } from "../week-strip";

export function ScoreboardHeader() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [openCalendar, setOpenCalendar] = React.useState(false);
  // const [valueCalendar, setValueCalendar] = React.useState("In 2 days");
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(value) || undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

  const handleWeekStripDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setMonth(selectedDate);
    setValue(formatDate(selectedDate));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardDescription>
          <ButtonGroup>
            <ButtonGroup>
              <Button variant="outline">All</Button>
              <Button variant="outline">Live</Button>
              <Button variant="outline">Finished</Button>
            </ButtonGroup>
          </ButtonGroup>
        </CardDescription>
        <CardAction>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {value
                  ? leagues.find((league) => league.value === value)?.label
                  : "Choose League"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search framework..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No framework found.</CommandEmpty>
                  <CommandGroup>
                    {leagues.map((league) => (
                      <CommandItem
                        key={league.value}
                        value={league.value}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? "" : currentValue);
                          setOpen(false);
                        }}
                      >
                        {league.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            value === league.value
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
        <div className="relative flex gap-2">
          <WeekStrip
            className="flex-1 pr-10"
            selectedDate={date}
            onDateSelect={handleWeekStripDateSelect}
          />
          <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant="ghost"
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              >
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  setDate(date);
                  setValue(formatDate(date));
                  setOpenCalendar(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
