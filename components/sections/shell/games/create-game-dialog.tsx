"use client";

import { FormEvent, useState, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery, useMutation } from "convex/react";
import { format } from "date-fns";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/sections/shell/games/location-picker";
import { AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { FieldLabel } from "@/components/ui/field";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Trophy, ArrowLeft, CalendarIcon, Clock2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type Gender = "male" | "female" | "mixed";
type GameType = "quick" | "tournament" | null;

interface Club {
  _id: string;
  name: string;
  nickname: string;
  logoUrl?: string;
}

function TeamLogo({ club, size = 20 }: { club: Club; size?: number }) {
  if (club.logoUrl) {
    return (
      <Image
        src={club.logoUrl}
        alt={club.name}
        width={size}
        height={size}
        className="rounded-full object-contain"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {club.name.charAt(0).toUpperCase()}
    </div>
  );
}

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  preselectedClubId?: string;
}

interface QuickGameFormState {
  homeTeamId: string;
  awayTeamId: string;
  date: Date | undefined;
  startTime: string;
  category: string;
  gender: Gender;
  locationName: string;
  locationCoordinates: [number, number] | null;
}

const INITIAL_FORM_STATE: QuickGameFormState = {
  homeTeamId: "",
  awayTeamId: "",
  date: undefined,
  startTime: "10:00",
  category: "",
  gender: "male",
  locationName: "",
  locationCoordinates: null,
};

export function CreateGameDialog({
  open,
  onOpenChange,
  orgSlug,
  preselectedClubId,
}: CreateGameDialogProps) {
  const t = useTranslations("Common");

  const teamConfig = useQuery(api.leagueSettings.getTeamConfig, {
    leagueSlug: orgSlug,
  });
  const clubs = useQuery(api.clubs.listByLeague, {
    orgSlug,
  });

  const createGame = useMutation(api.games.create);

  const initialFormState: QuickGameFormState = {
    ...INITIAL_FORM_STATE,
    homeTeamId: preselectedClubId || "",
  };

  const [gameType, setGameType] = useState<GameType>(null);
  const [formState, setFormState] =
    useState<QuickGameFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPreselectedClub = Boolean(preselectedClubId);

  // Get the list of club IDs to check for category
  const clubIdsToCheck = useMemo(() => {
    const ids: Id<"clubs">[] = [];
    if (formState.homeTeamId) {
      ids.push(formState.homeTeamId as Id<"clubs">);
    }
    if (formState.awayTeamId) {
      ids.push(formState.awayTeamId as Id<"clubs">);
    }
    return ids;
  }, [formState.homeTeamId, formState.awayTeamId]);

  // Check if selected clubs have the selected category
  const categoryCheck = useQuery(
    api.categories.checkClubsHaveCategory,
    clubIdsToCheck.length > 0 && formState.category && formState.gender
      ? {
          clubIds: clubIdsToCheck,
          ageGroup: formState.category,
          gender: formState.gender,
        }
      : "skip",
  );

  // Derive validation state from the query results
  const categoryValidation = useMemo(() => {
    if (
      !formState.category ||
      !formState.gender ||
      clubIdsToCheck.length === 0 ||
      !categoryCheck
    ) {
      return { isValid: true, missingTeams: [] as string[] };
    }

    const missingTeams = categoryCheck
      .filter((r) => !r.hasCategory)
      .map((r) => r.clubName);

    return {
      isValid: missingTeams.length === 0,
      missingTeams,
    };
  }, [formState.category, formState.gender, clubIdsToCheck, categoryCheck]);

  const ageCategories: {
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
  }[] = teamConfig?.ageCategories || [];
  const enabledGenders = (teamConfig?.enabledGenders as Gender[]) || [
    "male",
    "female",
  ];

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setGameType(null);
      setFormState(initialFormState);
    }
    onOpenChange(newOpen);
  };

  const handleBack = () => {
    setGameType(null);
    setFormState(initialFormState);
  };

  const updateField = <K extends keyof QuickGameFormState>(
    field: K,
    value: QuickGameFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formState.homeTeamId ||
      !formState.awayTeamId ||
      !formState.date ||
      !formState.startTime ||
      !formState.category ||
      !formState.gender
    ) {
      return;
    }

    if (formState.homeTeamId === formState.awayTeamId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dateString = format(formState.date, "yyyy-MM-dd");

      await createGame({
        orgSlug,
        homeClubId: formState.homeTeamId as Id<"clubs">,
        awayClubId: formState.awayTeamId as Id<"clubs">,
        date: dateString,
        startTime: formState.startTime,
        category: formState.category,
        gender: formState.gender,
        locationName: formState.locationName || undefined,
        locationCoordinates: formState.locationCoordinates || undefined,
      });

      setFormState(initialFormState);
      setGameType(null);
      onOpenChange(false);
    } catch (error) {
      console.error("[CreateGameDialog] Failed to create game:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formState.homeTeamId &&
    formState.awayTeamId &&
    formState.homeTeamId !== formState.awayTeamId &&
    formState.date &&
    formState.startTime &&
    formState.category &&
    formState.gender &&
    categoryValidation.isValid;

  const availableAwayTeams = (clubs || []).filter(
    (club) => club._id !== formState.homeTeamId,
  );

  const availableHomeTeams = (clubs || []).filter(
    (club) => club._id !== formState.awayTeamId,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            {gameType === null ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-left">
                    {t("games.createTitle")}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-3 h-auto py-4 px-4"
                    onClick={() => setGameType("quick")}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{t("games.quickGame")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("games.quickGameDescription")}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-3 h-auto py-4 px-4 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{t("games.tournament")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("games.tournamentDescription")}
                      </div>
                    </div>
                  </Button>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    {t("actions.cancel")}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleBack}
                      className="h-8 w-8"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <DialogTitle className="text-left">
                      {t("games.quickGame")}
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>{t("games.homeTeam")}</FieldLabel>
                        {hasPreselectedClub ? (
                          <Button
                            variant="outline"
                            disabled
                            className="w-full justify-start mt-2 cursor-not-allowed"
                          >
                            {(() => {
                              const preselectedClub = (clubs || []).find(
                                (c) => c._id === preselectedClubId,
                              );
                              return preselectedClub ? (
                                <span className="flex items-center gap-2">
                                  <TeamLogo club={preselectedClub} />
                                  {preselectedClub.name}
                                </span>
                              ) : (
                                t("actions.loading")
                              );
                            })()}
                          </Button>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between mt-2",
                                  !formState.homeTeamId &&
                                    "text-muted-foreground",
                                )}
                              >
                                {formState.homeTeamId ? (
                                  <span className="flex items-center gap-2">
                                    <TeamLogo
                                      club={
                                        availableHomeTeams.find(
                                          (c) => c._id === formState.homeTeamId,
                                        )!
                                      }
                                    />
                                    {
                                      availableHomeTeams.find(
                                        (c) => c._id === formState.homeTeamId,
                                      )?.name
                                    }
                                  </span>
                                ) : (
                                  t("games.selectTeam")
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[200px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput
                                  placeholder={t("actions.search")}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {t("table.noResults")}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableHomeTeams.map((club) => (
                                      <CommandItem
                                        key={club._id}
                                        value={club.name}
                                        onSelect={() => {
                                          updateField("homeTeamId", club._id);
                                        }}
                                      >
                                        <TeamLogo club={club} />
                                        <span className="ml-2">
                                          {club.name}
                                        </span>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            formState.homeTeamId === club._id
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
                        )}
                      </div>

                      <div>
                        <FieldLabel>{t("games.awayTeam")}</FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between mt-2",
                                !formState.awayTeamId &&
                                  "text-muted-foreground",
                              )}
                            >
                              {formState.awayTeamId ? (
                                <span className="flex items-center gap-2">
                                  <TeamLogo
                                    club={
                                      availableAwayTeams.find(
                                        (c) => c._id === formState.awayTeamId,
                                      )!
                                    }
                                  />
                                  {
                                    availableAwayTeams.find(
                                      (c) => c._id === formState.awayTeamId,
                                    )?.name
                                  }
                                </span>
                              ) : (
                                t("games.selectTeam")
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[200px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder={t("actions.search")} />
                              <CommandList>
                                <CommandEmpty>
                                  {t("table.noResults")}
                                </CommandEmpty>
                                <CommandGroup>
                                  {availableAwayTeams.map((club) => (
                                    <CommandItem
                                      key={club._id}
                                      value={club.name}
                                      onSelect={() => {
                                        updateField("awayTeamId", club._id);
                                      }}
                                    >
                                      <TeamLogo club={club} />
                                      <span className="ml-2">{club.name}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          formState.awayTeamId === club._id
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
                      </div>
                    </div>

                    <div>
                      <FieldLabel>{t("games.dateTime")}</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-2",
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
                            onSelect={(date: Date | undefined) =>
                              updateField("date", date)
                            }
                          />
                          <div className="border-t p-3">
                            <FieldLabel htmlFor="time-from">
                              {t("games.startTime")}
                            </FieldLabel>
                            <InputGroup className="mt-1.5">
                              <InputGroupInput
                                id="time-from"
                                type="time"
                                value={formState.startTime}
                                onChange={(e) =>
                                  updateField("startTime", e.target.value)
                                }
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>{t("games.category")}</FieldLabel>
                        <Select
                          value={formState.category}
                          onValueChange={(value) =>
                            updateField("category", value)
                          }
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue
                              placeholder={t("games.selectCategory")}
                            />
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
                          onValueChange={(value) =>
                            updateField("gender", value as Gender)
                          }
                        >
                          <SelectTrigger className="w-full mt-2">
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

                    {!categoryValidation.isValid &&
                      categoryValidation.missingTeams.length > 0 && (
                        <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              {t("games.categoryValidationError")}
                            </p>
                            <p className="mt-1">
                              {t("games.teamsMissingCategory", {
                                teams:
                                  categoryValidation.missingTeams.join(", "),
                                category: formState.category,
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                    <div>
                      <FieldLabel>{t("games.location")}</FieldLabel>
                      <div className="mt-2 h-48 rounded-md overflow-hidden border">
                        <LocationPicker
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
                  </div>

                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      {t("actions.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                    >
                      {isSubmitting
                        ? t("actions.loading")
                        : t("actions.create")}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
