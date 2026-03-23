import { calculateAgeFromDateOfBirth } from "@/lib/soccer/categories";

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
  return calculateAgeFromDateOfBirth(dateOfBirth) ?? 0;
}
