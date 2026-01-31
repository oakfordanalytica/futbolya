export type BasketballPosition =
  | "point_guard"
  | "shooting_guard"
  | "small_forward"
  | "power_forward"
  | "center";

export type BasketballPlayerStatus =
  | "active"
  | "injured"
  | "on_loan"
  | "inactive";

export interface BasketballPlayerStats {
  gamesPlayed: number;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  stealsPerGame?: number;
  blocksPerGame?: number;
}

export interface BasketballPlayer {
  _id: string;
  profileId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  jerseyNumber?: number;
  position?: BasketballPosition;
  status: BasketballPlayerStatus;
  height?: number;
  weight?: number;
  nationality?: string;
  yearsExperience?: number;
  stats?: BasketballPlayerStats;
}

export const BASKETBALL_POSITION_LABELS: Record<BasketballPosition, string> = {
  point_guard: "Point Guard",
  shooting_guard: "Shooting Guard",
  small_forward: "Small Forward",
  power_forward: "Power Forward",
  center: "Center",
};

export const BASKETBALL_POSITION_ABBREVIATIONS: Record<
  BasketballPosition,
  string
> = {
  point_guard: "PG",
  shooting_guard: "SG",
  small_forward: "SF",
  power_forward: "PF",
  center: "C",
};

export function getPositionLabel(position: BasketballPosition): string {
  return BASKETBALL_POSITION_LABELS[position];
}

export function getPositionAbbreviation(position: BasketballPosition): string {
  return BASKETBALL_POSITION_ABBREVIATIONS[position];
}

export function formatHeight(cm: number): string {
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return `${feet}'${inches}"`;
}

export function formatWeight(kg: number): string {
  const lbs = Math.round(kg * 2.205);
  return `${lbs} lbs`;
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
