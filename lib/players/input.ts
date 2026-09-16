/** Rules shared by manual entry, spreadsheet review and Convex writes. */
export interface PlayerInput {
  firstName: string;
  lastName: string;
  secondLastName?: string;
  dateOfBirth: string;
  documentNumber: string;
  cometNumber: string;
  gender: "male" | "female" | "mixed";
  position?: string;
  jerseyNumber?: number;
  dominantProfile?: "left" | "right" | "both";
  country?: string;
  height?: number;
  weight?: number;
  fifaId?: string;
}

export function normalizePlayerIdentifier(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, "");
}

export function normalizePlayerInput<T extends PlayerInput>(input: T): T {
  return {
    ...input,
    firstName: input.firstName.trim().replace(/\s+/g, " "),
    lastName: input.lastName.trim().replace(/\s+/g, " "),
    secondLastName:
      input.secondLastName?.trim().replace(/\s+/g, " ") || undefined,
    documentNumber: normalizePlayerIdentifier(input.documentNumber),
    cometNumber: normalizePlayerIdentifier(input.cometNumber),
    country: input.country?.trim() || undefined,
    fifaId: input.fifaId?.trim() || undefined,
  };
}

export function isPlayerBirthDate(value: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function getPlayerInputErrors(
  input: PlayerInput,
  today: string,
): (keyof PlayerInput)[] {
  const errors: (keyof PlayerInput)[] = [];
  for (const key of ["firstName", "lastName"] as const) {
    if (!input[key].trim() || input[key].length > 150) errors.push(key);
  }
  if ((input.secondLastName?.length ?? 0) > 150) errors.push("secondLastName");
  if (!isPlayerBirthDate(input.dateOfBirth, today)) errors.push("dateOfBirth");
  for (const key of ["documentNumber", "cometNumber"] as const) {
    if (!/^[A-Z0-9]{1,50}$/.test(normalizePlayerIdentifier(input[key])))
      errors.push(key);
  }
  if (!input.position?.trim()) errors.push("position");
  for (const key of ["height", "weight"] as const) {
    const value = input[key];
    if (value !== undefined && (!Number.isFinite(value) || value <= 0))
      errors.push(key);
  }
  if (
    input.jerseyNumber !== undefined &&
    (!Number.isInteger(input.jerseyNumber) ||
      input.jerseyNumber < 0 ||
      input.jerseyNumber > 99)
  ) {
    errors.push("jerseyNumber");
  }
  return errors;
}

export interface PlayerIdentity {
  _id: string;
  documentNumber?: string | null;
  cometNumber?: string | null;
}

export function createPlayerIdentityIndex(players: PlayerIdentity[]) {
  const documents = new Map<string, Set<string>>();
  const comets = new Map<string, Set<string>>();
  function add(player: PlayerIdentity) {
    for (const [map, value] of [
      [documents, player.documentNumber],
      [comets, player.cometNumber],
    ] as const) {
      const key = normalizePlayerIdentifier(value);
      if (!key) continue;
      const ids = map.get(key) ?? new Set<string>();
      ids.add(player._id);
      map.set(key, ids);
    }
  }
  players.forEach(add);
  return {
    add,
    match(
      player: Omit<PlayerIdentity, "_id">,
    ): "new" | "existing" | "conflict" {
      const ids = new Set([
        ...(documents.get(normalizePlayerIdentifier(player.documentNumber)) ??
          []),
        ...(comets.get(normalizePlayerIdentifier(player.cometNumber)) ?? []),
      ]);
      return ids.size > 1 ? "conflict" : ids.size === 1 ? "existing" : "new";
    },
  };
}
