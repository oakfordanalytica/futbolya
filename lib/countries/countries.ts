import countries from "world-countries";

export interface Country {
  value: string;
  label: string;
  flag: string;
}

export const COUNTRIES: Country[] = countries
  .map((country) => ({
    value: country.cca2,
    label: country.name.common,
    flag: country.flag,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

function findCountryByCode(value: string): Country | undefined {
  const normalized = value.trim().toUpperCase();
  return COUNTRIES.find((country) => country.value === normalized);
}

function findCountryByLabel(value: string): Country | undefined {
  const normalized = value.trim().toLowerCase();
  return COUNTRIES.find(
    (country) => country.label.toLowerCase() === normalized,
  );
}

/**
 * Normalize stored country values:
 * - ISO code (e.g. "CO") -> "CO"
 * - Label (e.g. "Colombia") -> "CO"
 * - Unknown legacy values -> original trimmed value
 */
export function normalizeCountryValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const byCode = findCountryByCode(trimmed);
  if (byCode) {
    return byCode.value;
  }

  const byLabel = findCountryByLabel(trimmed);
  if (byLabel) {
    return byLabel.value;
  }

  return trimmed;
}

export function getCountryLabel(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const byCode = findCountryByCode(trimmed);
  if (byCode) {
    return byCode.label;
  }

  const byLabel = findCountryByLabel(trimmed);
  if (byLabel) {
    return byLabel.label;
  }

  return trimmed;
}
