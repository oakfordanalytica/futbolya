"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type {
  Club,
  CreateGameDialogController,
  CreateGameDialogProps,
  GameFormState,
  GameType,
  Gender,
} from "./types";
import {
  buildCategoryValidation,
  buildInitialGameFormState,
  getAffiliatedClubs,
  getDefaultEnabledGenders,
  getSelectedClub,
  getSelectedSeason,
  isCreateGameFormValid,
  resolveGameType,
  toGameDateString,
} from "./helpers";

export function useCreateGameDialogController({
  open,
  onOpenChange,
  orgSlug,
  preselectedClubId,
  gameToEdit,
}: CreateGameDialogProps): CreateGameDialogController {
  const t = useTranslations("Common");

  const teamConfig = useQuery(
    api.leagueSettings.getTeamConfig,
    open ? { leagueSlug: orgSlug } : "skip",
  );
  const clubs = useQuery(api.clubs.listByLeague, open ? { orgSlug } : "skip");
  const activeSeasons = useQuery(
    api.leagueSettings.listActiveSeasons,
    open ? { leagueSlug: orgSlug } : "skip",
  );

  const createGame = useMutation(api.games.create);
  const updateGame = useMutation(api.games.update);
  const isEditMode = Boolean(gameToEdit);

  const buildInitialFormState = useCallback(
    () =>
      buildInitialGameFormState({
        gameToEdit,
        preselectedClubId,
      }),
    [gameToEdit, preselectedClubId],
  );

  const [gameType, setGameType] = useState<GameType>(
    resolveGameType(gameToEdit),
  );
  const [formState, setFormState] = useState<GameFormState>(
    buildInitialFormState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineupsGameId, setLineupsGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setGameType(resolveGameType(gameToEdit));
    setFormState(buildInitialFormState());
  }, [open, gameToEdit, buildInitialFormState]);

  const hasPreselectedClub = Boolean(preselectedClubId);

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

  const categoryValidation = useMemo(
    () =>
      buildCategoryValidation({
        formState,
        clubIdsToCheck,
        categoryCheck,
      }),
    [formState, clubIdsToCheck, categoryCheck],
  );

  const ageCategories = teamConfig?.ageCategories || [];
  const enabledGenders = getDefaultEnabledGenders(
    teamConfig?.enabledGenders as Gender[] | undefined,
  );
  const hasActiveSeasons = (activeSeasons?.length ?? 0) > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setGameType(resolveGameType(gameToEdit));
      setFormState(buildInitialFormState());
    }
    onOpenChange(nextOpen);
  };

  const handleBack = () => {
    if (isEditMode) {
      return;
    }
    setGameType(null);
    setFormState(buildInitialFormState());
  };

  const updateField = <K extends keyof GameFormState>(
    field: K,
    value: GameFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const submitGame = async () => {
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

    if (gameType === "season" && !formState.seasonId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dateString = toGameDateString(formState.date);

      if (gameToEdit) {
        await updateGame({
          gameId: gameToEdit._id as Id<"games">,
          date: dateString,
          startTime: formState.startTime,
          category: formState.category,
          gender: formState.gender,
          locationName: formState.locationName || undefined,
          locationCoordinates: formState.locationCoordinates || undefined,
        });
        toast.success(t("games.updated"));
        onOpenChange(false);
      } else {
        const createdGameId = await createGame({
          orgSlug,
          seasonId: gameType === "season" ? formState.seasonId : undefined,
          homeClubId: formState.homeTeamId as Id<"clubs">,
          awayClubId: formState.awayTeamId as Id<"clubs">,
          date: dateString,
          startTime: formState.startTime,
          category: formState.category,
          gender: formState.gender,
          locationName: formState.locationName || undefined,
          locationCoordinates: formState.locationCoordinates || undefined,
        });

        setFormState(buildInitialFormState());
        setGameType(null);
        onOpenChange(false);
        setLineupsGameId(createdGameId);
      }
    } catch (error) {
      console.error("[CreateGameDialog] Failed to create game:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitGame();
  };

  const affiliatedClubs = getAffiliatedClubs(clubs as Club[] | undefined);
  const preselectedClub = hasPreselectedClub
    ? ((clubs as Club[] | undefined)?.find(
        (club) => club._id === preselectedClubId,
      ) ?? null)
    : null;
  const isPreselectedClubAffiliated =
    !hasPreselectedClub || preselectedClub?.status === "affiliated";

  const availableAwayTeams = affiliatedClubs.filter(
    (club) => club._id !== formState.homeTeamId,
  );
  const availableHomeTeams = affiliatedClubs.filter(
    (club) => club._id !== formState.awayTeamId,
  );
  const selectedHomeTeam = getSelectedClub({
    clubs: clubs as Club[] | undefined,
    availableClubs: availableHomeTeams,
    clubId: formState.homeTeamId,
  });
  const selectedAwayTeam = getSelectedClub({
    clubs: clubs as Club[] | undefined,
    availableClubs: availableAwayTeams,
    clubId: formState.awayTeamId,
  });
  const selectedSeason = getSelectedSeason({
    seasons: activeSeasons,
    seasonId: formState.seasonId,
  });

  const isFormValid = isCreateGameFormValid({
    gameType,
    formState,
    categoryValidation,
    isPreselectedClubAffiliated,
  });

  return {
    open,
    gameType,
    isEditMode,
    formState,
    isSubmitting,
    isFormValid: Boolean(isFormValid),
    lineupsGameId,
    clubs: clubs as Club[] | undefined,
    activeSeasons,
    ageCategories,
    enabledGenders,
    hasActiveSeasons,
    hasPreselectedClub,
    preselectedClub,
    isPreselectedClubAffiliated,
    availableHomeTeams,
    availableAwayTeams,
    selectedHomeTeam,
    selectedAwayTeam,
    selectedSeason,
    categoryValidation,
    setGameType,
    updateField,
    handleBack,
    handleOpenChange,
    handleSubmit,
    closeLineupsDialog: () => setLineupsGameId(null),
  };
}
