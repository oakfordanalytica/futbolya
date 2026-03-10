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

export function parseLocalDateTime(date: string, time: string): Date | null {
  const parsedDate = parseIsoDateAsLocal(date);
  if (!parsedDate || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const parsedDateTime = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    hours,
    minutes,
  );

  return Number.isNaN(parsedDateTime.getTime()) ? null : parsedDateTime;
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
