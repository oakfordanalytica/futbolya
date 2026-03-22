import type { FileWithPreview } from "@/lib/files/upload";

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
  categoryId?: string;
}

export interface PositionOption {
  id: string;
  name: string;
  abbreviation: string;
}

export interface PlayerCategoryOption {
  _id: string;
  name: string;
}

export interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
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
  categoryId: string;
  photoFile: FileWithPreview | null;
  currentPhotoUrl: string | null;
}

export type SetPlayerFormField = <K extends keyof PlayerFormValues>(
  field: K,
  value: PlayerFormValues[K],
) => void;
