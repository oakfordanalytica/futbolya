import { format } from "date-fns";
import type {
  CategoryValidation,
  Club,
  CreateGameDialogProps,
  GameFormState,
  GameType,
  Gender,
} from "./types";
import { INITIAL_FORM_STATE } from "./types";

export function resolveGameType(
  gameToEdit: CreateGameDialogProps["gameToEdit"],
): GameType {
  if (!gameToEdit) {
    return null;
  }

  return gameToEdit.seasonId ? "season" : "quick";
}

export function buildInitialGameFormState(args: {
  gameToEdit?: CreateGameDialogProps["gameToEdit"];
  preselectedClubId?: string;
}): GameFormState {
  const { gameToEdit, preselectedClubId } = args;

  return {
    seasonId: gameToEdit?.seasonId ?? "",
    homeTeamId: gameToEdit?.homeClubId ?? preselectedClubId ?? "",
    awayTeamId: gameToEdit?.awayClubId ?? "",
    date: gameToEdit?.date ? new Date(`${gameToEdit.date}T12:00:00`) : undefined,
    startTime: gameToEdit?.startTime ?? INITIAL_FORM_STATE.startTime,
    category: gameToEdit?.category ?? "",
    gender: gameToEdit?.gender ?? INITIAL_FORM_STATE.gender,
    locationName: gameToEdit?.locationName ?? "",
    locationCoordinates:
      gameToEdit?.locationCoordinates && gameToEdit.locationCoordinates.length === 2
        ? ([
            gameToEdit.locationCoordinates[0],
            gameToEdit.locationCoordinates[1],
          ] as [number, number])
        : null,
  };
}

export function buildCategoryValidation(args: {
  formState: GameFormState;
  clubIdsToCheck: string[];
  categoryCheck:
    | Array<{ clubName: string; hasCategory: boolean }>
    | undefined
    | null;
}): CategoryValidation {
  const { formState, clubIdsToCheck, categoryCheck } = args;

  if (
    !formState.category ||
    !formState.gender ||
    clubIdsToCheck.length === 0 ||
    !categoryCheck
  ) {
    return { isValid: true, missingTeams: [] };
  }

  const missingTeams = categoryCheck
    .filter((result) => !result.hasCategory)
    .map((result) => result.clubName);

  return {
    isValid: missingTeams.length === 0,
    missingTeams,
  };
}

export function getAffiliatedClubs(clubs: Club[] | undefined): Club[] {
  return (clubs ?? []).filter((club) => club.status === "affiliated");
}

export function getSelectedClub(args: {
  clubs: Club[] | undefined;
  availableClubs: Club[];
  clubId: string;
}): Club | null {
  if (!args.clubId) {
    return null;
  }

  return (
    args.availableClubs.find((club) => club._id === args.clubId) ??
    args.clubs?.find((club) => club._id === args.clubId) ??
    null
  );
}

export function getSelectedSeason<T extends { id: string }>(args: {
  seasons: T[] | undefined;
  seasonId: string;
}): T | undefined {
  return (args.seasons ?? []).find((season) => season.id === args.seasonId);
}

export function isCreateGameFormValid(args: {
  gameType: GameType;
  formState: GameFormState;
  categoryValidation: CategoryValidation;
  isPreselectedClubAffiliated: boolean;
}): boolean {
  const { gameType, formState, categoryValidation, isPreselectedClubAffiliated } =
    args;

  return Boolean(
    (gameType !== "season" || formState.seasonId) &&
      formState.homeTeamId &&
      formState.awayTeamId &&
      formState.homeTeamId !== formState.awayTeamId &&
      formState.date &&
      formState.startTime &&
      formState.category &&
      formState.gender &&
      categoryValidation.isValid &&
      isPreselectedClubAffiliated,
  );
}

export function toGameDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDefaultEnabledGenders(
  enabledGenders: Gender[] | undefined,
): Gender[] {
  return enabledGenders && enabledGenders.length > 0
    ? enabledGenders
    : ["male", "female"];
}
