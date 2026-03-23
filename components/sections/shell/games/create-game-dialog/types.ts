import type { FormEvent } from "react";

export type Gender = "male" | "female" | "mixed";
export type GameType = "quick" | "season" | "tournament" | null;

export interface Club {
  _id: string;
  name: string;
  nickname: string;
  status: "affiliated" | "invited" | "suspended";
  logoUrl?: string;
}

export interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  preselectedClubId?: string;
  gameToEdit?: {
    _id: string;
    seasonId?: string;
    homeClubId: string;
    awayClubId: string;
    date: string;
    startTime: string;
    category: string;
    gender: Gender;
    locationName?: string;
    locationCoordinates?: number[];
  };
}

export interface GameFormState {
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date | undefined;
  startTime: string;
  category: string;
  gender: Gender;
  locationName: string;
  locationCoordinates: [number, number] | null;
}

export const INITIAL_FORM_STATE: GameFormState = {
  seasonId: "",
  homeTeamId: "",
  awayTeamId: "",
  date: undefined,
  startTime: "10:00",
  category: "",
  gender: "male",
  locationName: "",
  locationCoordinates: null,
};

export interface ActiveSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateGameDialogController {
  open: boolean;
  gameType: GameType;
  isEditMode: boolean;
  formState: GameFormState;
  isSubmitting: boolean;
  isFormValid: boolean;
  lineupsGameId: string | null;
  clubs: Club[] | undefined;
  activeSeasons: ActiveSeason[] | undefined;
  ageCategories: {
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
  }[];
  enabledGenders: Gender[];
  hasActiveSeasons: boolean;
  hasPreselectedClub: boolean;
  preselectedClub: Club | null;
  isPreselectedClubAffiliated: boolean;
  availableHomeTeams: Club[];
  availableAwayTeams: Club[];
  selectedHomeTeam: Club | null;
  selectedAwayTeam: Club | null;
  selectedSeason?: ActiveSeason;
  setGameType: (gameType: GameType) => void;
  updateField: <K extends keyof GameFormState>(
    field: K,
    value: GameFormState[K],
  ) => void;
  handleBack: () => void;
  handleOpenChange: (open: boolean) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  closeLineupsDialog: () => void;
}
