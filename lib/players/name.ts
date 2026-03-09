export function buildPlayerFullName(
  firstName: string,
  lastName: string,
  secondLastName?: string | null,
): string {
  return [firstName, lastName, secondLastName].filter(Boolean).join(" ").trim();
}

export function buildPlayerInitials(
  firstName: string,
  lastName: string,
  secondLastName?: string | null,
): string {
  const surname = secondLastName?.trim() || lastName.trim();
  return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}
