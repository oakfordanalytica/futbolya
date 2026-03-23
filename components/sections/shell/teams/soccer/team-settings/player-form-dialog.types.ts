import type { FileWithPreview } from "@/lib/files/upload";
import type { DivisionType, LeagueAgeCategory } from "@/lib/soccer/categories";

export type PlayerGender = "male" | "female" | "mixed";
export type DominantProfile = "left" | "right" | "both";

export interface PlayerData {
  _id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string | null;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  documentNumber?: string | null;
  gender?: PlayerGender | null;
  jerseyNumber?: number | null;
  cometNumber?: string | null;
  fifaId?: string | null;
  position?: string | null;
  dominantProfile?: DominantProfile | null;
  height?: number | null;
  weight?: number | null;
  country?: string | null;
  categoryId?: string | null;
  categoryLeagueCategoryId?: string | null;
  categoryName?: string | null;
  categoryAgeGroup?: string | null;
}

export interface PositionOption {
  id: string;
  name: string;
  abbreviation: string;
}

export type LeagueCategoryOption = LeagueAgeCategory;

export interface HorizontalDivisionsConfig {
  enabled: boolean;
  type: DivisionType;
}

export interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  ageCategories: LeagueCategoryOption[];
  enabledGenders: PlayerGender[];
  horizontalDivisions: HorizontalDivisionsConfig;
  positions: PositionOption[];
  player?: PlayerData | null;
}

export interface PlayerFormValues {
  firstName: string;
  lastName: string;
  secondLastName: string;
  dateOfBirth: Date | undefined;
  documentNumber: string;
  gender: PlayerGender | "";
  jerseyNumber: string;
  cometNumber: string;
  fifaId: string;
  position: string;
  dominantProfile: DominantProfile | "";
  height: string;
  weight: string;
  country: string;
  leagueCategoryId: string;
  division: string;
  photoFile: FileWithPreview | null;
  currentPhotoUrl: string | null;
}

export type SetPlayerFormField = <K extends keyof PlayerFormValues>(
  field: K,
  value: PlayerFormValues[K],
) => void;
