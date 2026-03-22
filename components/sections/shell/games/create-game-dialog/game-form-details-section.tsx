"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { AlertCircle, CalendarIcon, Clock2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { LocationPicker } from "../location-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CreateGameDialogController, Gender } from "./types";

export function GameFormDetailsSection({
  controller,
}: {
  controller: CreateGameDialogController;
}) {
  const t = useTranslations("Common");
  const { formState, ageCategories, enabledGenders, categoryValidation, updateField } =
    controller;

  return (
    <>
      <div>
        <FieldLabel>{t("games.dateTime")}</FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "mt-2 w-full justify-start text-left font-normal",
                !formState.date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formState.date
                ? `${format(formState.date, "PPP")} · ${formState.startTime}`
                : t("games.selectDateTime")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formState.date}
              onSelect={(date: Date | undefined) => updateField("date", date)}
            />
            <div className="border-t p-3">
              <FieldLabel htmlFor="time-from">{t("games.startTime")}</FieldLabel>
              <InputGroup className="mt-1.5">
                <InputGroupInput
                  id="time-from"
                  type="time"
                  value={formState.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
                <InputGroupAddon>
                  <Clock2Icon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>{t("games.category")}</FieldLabel>
          <Select
            value={formState.category}
            onValueChange={(value) => updateField("category", value)}
          >
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder={t("games.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {ageCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name} ({cat.minAge}-{cat.maxAge})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel>{t("games.gender")}</FieldLabel>
          <Select
            value={formState.gender}
            onValueChange={(value) => updateField("gender", value as Gender)}
          >
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder={t("games.gender")} />
            </SelectTrigger>
            <SelectContent>
              {enabledGenders.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {t(`gender.${gender}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!categoryValidation.isValid && categoryValidation.missingTeams.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("games.categoryValidationError")}</p>
            <p className="mt-1">
              {t("games.teamsMissingCategory", {
                teams: categoryValidation.missingTeams.join(", "),
                category: formState.category,
              })}
            </p>
          </div>
        </div>
      )}

      <div>
        <FieldLabel>{t("games.location")}</FieldLabel>
        <div className="mt-2 h-48 overflow-hidden rounded-md border">
          <LocationPicker
            initialLocation={
              formState.locationCoordinates &&
              formState.locationCoordinates.length === 2
                ? {
                    position: formState.locationCoordinates,
                    name: formState.locationName,
                  }
                : null
            }
            onLocationChange={(location) => {
              if (location) {
                updateField(
                  "locationCoordinates",
                  location.position as [number, number],
                );
                updateField("locationName", location.name);
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
