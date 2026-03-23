"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import AvatarUpload from "@/components/ui/avatar-upload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { getDivisionOptions } from "@/lib/soccer/categories";
import { cn } from "@/lib/utils";
import type {
  HorizontalDivisionsConfig,
  LeagueCategoryOption,
  PlayerFormValues,
  PositionOption,
  PlayerGender,
  SetPlayerFormField,
} from "./player-form-dialog.types";

interface PlayerFormDialogFieldsProps {
  ageCategories: LeagueCategoryOption[];
  enabledGenders: PlayerGender[];
  horizontalDivisions: HorizontalDivisionsConfig;
  onDateOfBirthChange: (date: Date | undefined) => void;
  onFileChange: (file: PlayerFormValues["photoFile"]) => void;
  onLeagueCategoryChange: (leagueCategoryId: string) => void;
  positions: PositionOption[];
  setField: SetPlayerFormField;
  values: PlayerFormValues;
}

export function PlayerFormDialogFields({
  ageCategories,
  enabledGenders,
  horizontalDivisions,
  onDateOfBirthChange,
  onFileChange,
  onLeagueCategoryChange,
  positions,
  setField,
  values,
}: PlayerFormDialogFieldsProps) {
  const t = useTranslations("Common");
  const divisionOptions = getDivisionOptions(horizontalDivisions.type);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="mx-auto lg:mx-0">
          <AvatarUpload
            onFileChange={onFileChange}
            defaultAvatar={values.currentPhotoUrl ?? undefined}
            cropOptions={{
              aspect: 1040 / 760,
              outputWidth: 1040,
              outputHeight: 760,
              cropShape: "rect",
            }}
          />
        </div>

        <FieldGroup className="w-full flex-1 gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field>
              <FieldLabel>{t("players.firstName")}</FieldLabel>
              <Input
                value={values.firstName}
                onChange={(event) => setField("firstName", event.target.value)}
                required
                placeholder={t("players.firstName")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("players.lastName")}</FieldLabel>
              <Input
                value={values.lastName}
                onChange={(event) => setField("lastName", event.target.value)}
                required
                placeholder={t("players.lastName")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("players.secondLastName")}</FieldLabel>
              <Input
                value={values.secondLastName}
                onChange={(event) =>
                  setField("secondLastName", event.target.value)
                }
                required
                placeholder={t("players.secondLastName")}
              />
            </Field>
          </div>
        </FieldGroup>
      </div>

      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field>
            <FieldLabel>{t("players.cometNumber")}</FieldLabel>
            <Input
              value={values.cometNumber}
              onChange={(event) => setField("cometNumber", event.target.value)}
              required
              placeholder={t("players.cometNumber")}
            />
          </Field>

          <Field>
            <FieldLabel>{t("players.fifaId")}</FieldLabel>
            <Input
              value={values.fifaId}
              onChange={(event) => setField("fifaId", event.target.value)}
              placeholder={t("players.fifaId")}
            />
          </Field>

          <Field>
            <FieldLabel>{t("players.documentNumber")}</FieldLabel>
            <Input
              value={values.documentNumber}
              onChange={(event) =>
                setField("documentNumber", event.target.value)
              }
              required
              placeholder={t("players.documentNumber")}
            />
          </Field>

          <Field>
            <FieldLabel>{t("players.gender")}</FieldLabel>
            <Select
              value={values.gender}
              onValueChange={(value) =>
                setField("gender", value as PlayerFormValues["gender"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("players.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                {enabledGenders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {t(`players.genderOptions.${gender}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("players.jerseyNumber")}</FieldLabel>
            <Input
              type="number"
              min="0"
              max="99"
              value={values.jerseyNumber}
              onChange={(event) => setField("jerseyNumber", event.target.value)}
              required
              placeholder={t("players.jerseyNumber")}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>{t("players.dateOfBirth")}</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !values.dateOfBirth && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values.dateOfBirth ? (
                    format(values.dateOfBirth, "PPP")
                  ) : (
                    <span>{t("players.dateOfBirth")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={values.dateOfBirth}
                  onSelect={onDateOfBirthChange}
                  captionLayout="dropdown"
                  fromYear={1960}
                  toYear={new Date().getFullYear()}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Field>
            <FieldLabel>{t("players.country")}</FieldLabel>
            <CountryCombobox
              value={values.country}
              onValueChange={(value) => setField("country", value)}
              placeholder={t("players.selectCountry")}
              searchPlaceholder={`${t("actions.search")} ${t("players.country").toLowerCase()}...`}
              emptyText={t("table.noResults")}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div
          className={cn(
            "grid gap-4 md:grid-cols-2",
            horizontalDivisions.enabled ? "xl:grid-cols-4" : "xl:grid-cols-3",
          )}
        >
          <Field>
            <FieldLabel>{t("players.position")}</FieldLabel>
            <Select
              value={values.position}
              onValueChange={(value) => setField("position", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("players.selectPosition")} />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.name} ({pos.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("players.dominantProfile")}</FieldLabel>
            <Select
              value={values.dominantProfile}
              onValueChange={(value) =>
                setField(
                  "dominantProfile",
                  value as PlayerFormValues["dominantProfile"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("players.selectDominantProfile")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{t("foot.left")}</SelectItem>
                <SelectItem value="right">{t("foot.right")}</SelectItem>
                <SelectItem value="both">{t("foot.both")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("players.category")}</FieldLabel>
            <Select
              value={values.leagueCategoryId}
              onValueChange={onLeagueCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("players.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {ageCategories.length > 0 ? (
                  ageCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.minAge}-{category.maxAge})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    {t("categories.emptyMessage")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>

          {horizontalDivisions.enabled && (
            <Field>
              <FieldLabel>{t("categories.horizontalDivision")}</FieldLabel>
              <Select
                value={values.division}
                onValueChange={(value) => setField("division", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("categories.selectDivision")} />
                </SelectTrigger>
                <SelectContent>
                  {divisionOptions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>{t("players.height")}</FieldLabel>
            <Input
              type="number"
              min="100"
              max="250"
              value={values.height}
              onChange={(event) => setField("height", event.target.value)}
              placeholder="cm"
            />
          </Field>

          <Field>
            <FieldLabel>{t("players.weight")}</FieldLabel>
            <Input
              type="number"
              min="30"
              max="200"
              value={values.weight}
              onChange={(event) => setField("weight", event.target.value)}
              placeholder="kg"
            />
          </Field>
        </div>
      </FieldGroup>
    </div>
  );
}
