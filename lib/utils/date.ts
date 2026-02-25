export function parseIsoDateAsLocal(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatIsoDateAsLocal(
  date: string,
  locales?: string | string[],
): string {
  const parsed = parseIsoDateAsLocal(date);
  if (!parsed) {
    return "—";
  }

  return parsed.toLocaleDateString(locales);
}
