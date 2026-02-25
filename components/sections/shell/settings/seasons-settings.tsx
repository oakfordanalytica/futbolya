"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SeasonsSettingsProps {
  leagueSlug: string;
}

interface EditingSeason {
  id: string;
  name: string;
  dateRange: DateRange | undefined;
}

type SeasonStatus = "active" | "upcoming" | "ended";
type SeasonsTab = "active" | "inactive";

const MAX_VISIBLE_ITEMS = 6;

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getSeasonStatus(
  season: { startDate: string; endDate: string },
  today: string,
): SeasonStatus {
  if (season.startDate <= today && season.endDate >= today) {
    return "active";
  }
  if (season.startDate > today) {
    return "upcoming";
  }
  return "ended";
}

export function SeasonsSettings({ leagueSlug }: SeasonsSettingsProps) {
  const t = useTranslations("Settings.general.seasons");
  const tCommon = useTranslations("Common");
  const seasons = useQuery(api.leagueSettings.listSeasons, { leagueSlug });
  const createSeason = useMutation(api.leagueSettings.addSeason);
  const updateSeason = useMutation(api.leagueSettings.updateSeason);
  const removeSeason = useMutation(api.leagueSettings.removeSeason);

  const [name, setName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<EditingSeason | null>(
    null,
  );
  const [isEditingCalendarOpen, setIsEditingCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SeasonsTab>("active");
  const [isCreating, setIsCreating] = useState(false);
  const [savingSeasonId, setSavingSeasonId] = useState<string | null>(null);
  const [removingSeasonId, setRemovingSeasonId] = useState<string | null>(null);
  const [showAllActiveSeasons, setShowAllActiveSeasons] = useState(false);
  const [showAllInactiveSeasons, setShowAllInactiveSeasons] = useState(false);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
  const dateRangeInputValue =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(
          dateRange.to,
          "MMM d, yyyy",
        )}`
      : "";
  const canCreate =
    name.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    !isCreating;

  const today = getTodayDateString();
  const sortedSeasons = useMemo(
    () =>
      [...(seasons ?? [])].sort((a, b) =>
        b.startDate.localeCompare(a.startDate),
      ),
    [seasons],
  );
  const activeSeasons = useMemo(
    () =>
      sortedSeasons.filter(
        (season) => getSeasonStatus(season, today) === "active",
      ),
    [sortedSeasons, today],
  );
  const inactiveSeasons = useMemo(
    () =>
      sortedSeasons.filter(
        (season) => getSeasonStatus(season, today) !== "active",
      ),
    [sortedSeasons, today],
  );

  useEffect(() => {
    if (
      activeTab === "active" &&
      activeSeasons.length === 0 &&
      inactiveSeasons.length > 0
    ) {
      setActiveTab("inactive");
    }
  }, [activeTab, activeSeasons.length, inactiveSeasons.length]);

  const handleCreateSeason = async () => {
    if (!canCreate) {
      return;
    }

    setIsCreating(true);
    try {
      await createSeason({
        leagueSlug,
        season: {
          id: crypto.randomUUID(),
          name: name.trim(),
          startDate,
          endDate,
        },
      });
      setName("");
      setDateRange(undefined);
      setIsCalendarOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveSeason = async (seasonId: string) => {
    setRemovingSeasonId(seasonId);
    try {
      await removeSeason({
        leagueSlug,
        seasonId,
      });
    } finally {
      setRemovingSeasonId(null);
    }
  };

  const handleStartEditSeason = (season: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }) => {
    setEditingSeason({
      id: season.id,
      name: season.name,
      dateRange: {
        from: parseIsoDate(season.startDate),
        to: parseIsoDate(season.endDate),
      },
    });
    setIsEditingCalendarOpen(false);
  };

  const handleSaveSeason = async () => {
    if (!editingSeason?.dateRange?.from || !editingSeason.dateRange.to) {
      return;
    }

    const seasonName = editingSeason.name.trim();
    if (!seasonName) {
      return;
    }

    setSavingSeasonId(editingSeason.id);
    try {
      await updateSeason({
        leagueSlug,
        seasonId: editingSeason.id,
        name: seasonName,
        startDate: format(editingSeason.dateRange.from, "yyyy-MM-dd"),
        endDate: format(editingSeason.dateRange.to, "yyyy-MM-dd"),
      });
      setEditingSeason(null);
      setIsEditingCalendarOpen(false);
    } finally {
      setSavingSeasonId(null);
    }
  };

  const renderSeasonsList = (
    seasonList: Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    }>,
    emptyLabel: string,
    showAll: boolean,
    onToggleShowAll: () => void,
  ) => {
    if (seasonList.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    const visibleSeasons = showAll
      ? seasonList
      : seasonList.slice(0, MAX_VISIBLE_ITEMS);

    return (
      <div className="flex flex-col gap-1.5">
        <ul className="list-disc space-y-1 pl-5">
          {visibleSeasons.map((season) => {
            const status = getSeasonStatus(season, today);
            return (
              <li key={season.id} className="group marker:text-primary">
                {editingSeason?.id === season.id ? (
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Input
                      value={editingSeason.name}
                      onChange={(event) =>
                        setEditingSeason((prev) =>
                          prev
                            ? {
                                ...prev,
                                name: event.target.value,
                              }
                            : prev,
                        )
                      }
                      className="h-7 w-40"
                    />
                    <Popover
                      open={isEditingCalendarOpen}
                      onOpenChange={setIsEditingCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <div
                          className="w-[280px] cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setIsEditingCalendarOpen((prev) => !prev);
                            }
                          }}
                        >
                          <Input
                            readOnly
                            value={
                              editingSeason.dateRange?.from &&
                              editingSeason.dateRange?.to
                                ? `${format(
                                    editingSeason.dateRange.from,
                                    "MMM d, yyyy",
                                  )} - ${format(
                                    editingSeason.dateRange.to,
                                    "MMM d, yyyy",
                                  )}`
                                : ""
                            }
                            placeholder={`${t("startDate")} - ${t("endDate")}`}
                            className="pointer-events-none h-7"
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          captionLayout="dropdown"
                          numberOfMonths={2}
                          defaultMonth={editingSeason.dateRange?.from}
                          selected={editingSeason.dateRange}
                          onSelect={(range) => {
                            setEditingSeason((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    dateRange: range,
                                  }
                                : prev,
                            );
                            if (
                              range?.from &&
                              range?.to &&
                              range.from.getTime() !== range.to.getTime()
                            ) {
                              setIsEditingCalendarOpen(false);
                            }
                          }}
                          fromYear={1900}
                          toYear={2100}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={handleSaveSeason}
                      disabled={savingSeasonId === season.id}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => {
                        setEditingSeason(null);
                        setIsEditingCalendarOpen(false);
                      }}
                      disabled={savingSeasonId === season.id}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </span>
                ) : (
                  <span className="inline-flex flex-wrap items-center gap-1.5 text-sm text-primary">
                    <span>
                      {season.name} ({season.startDate} - {season.endDate})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`status.${status}`)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                      onClick={() => handleStartEditSeason(season)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 hover:text-destructive"
                      onClick={() => handleRemoveSeason(season.id)}
                      disabled={removingSeasonId === season.id}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {seasonList.length > MAX_VISIBLE_ITEMS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={onToggleShowAll}
          >
            {showAll
              ? tCommon("actions.showLess")
              : tCommon("actions.showMore")}
          </Button>
        )}
      </div>
    );
  };

  if (seasons === undefined) {
    return (
      <div className="text-sm text-muted-foreground">
        {tCommon("actions.loading")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(seasons?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SeasonsTab)}
          className="gap-3"
        >
          <TabsList className="inline-flex w-fit items-center gap-1 rounded-md border p-1">
            <TabsTrigger value="active" className="mr-0 rounded-md px-3 py-1.5">
              {t("tabs.active")}
            </TabsTrigger>
            <TabsTrigger
              value="inactive"
              className="mr-0 rounded-md px-3 py-1.5"
            >
              {t("tabs.inactive")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            {renderSeasonsList(
              activeSeasons,
              t("emptyActive"),
              showAllActiveSeasons,
              () => setShowAllActiveSeasons((prev) => !prev),
            )}
          </TabsContent>
          <TabsContent value="inactive" className="mt-0">
            {renderSeasonsList(
              inactiveSeasons,
              t("emptyInactive"),
              showAllInactiveSeasons,
              () => setShowAllInactiveSeasons((prev) => !prev),
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="flex flex-wrap items-end gap-3 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("name")}</Label>
          <Input
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-52"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("startDate")} / {t("endDate")}
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <div
                className="w-[320px] cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsCalendarOpen((prev) => !prev);
                  }
                }}
              >
                <Input
                  readOnly
                  value={dateRangeInputValue}
                  placeholder={`${t("startDate")} - ${t("endDate")}`}
                  className="pointer-events-none"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                captionLayout="dropdown"
                numberOfMonths={2}
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (
                    range?.from &&
                    range?.to &&
                    range.from.getTime() !== range.to.getTime()
                  ) {
                    setIsCalendarOpen(false);
                  }
                }}
                fromYear={1900}
                toYear={2100}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleCreateSeason} disabled={!canCreate} size="icon">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
