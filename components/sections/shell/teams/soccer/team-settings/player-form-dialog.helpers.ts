import { format, parse } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { normalizeCountryValue } from "@/lib/countries/countries";
import type { PlayerData, PlayerFormValues } from "./player-form-dialog.types";

export function createPlayerFormValues(
  player?: PlayerData | null,
): PlayerFormValues {
  return {
    firstName: player?.firstName ?? "",
    lastName: player?.lastName ?? "",
    secondLastName: player?.secondLastName ?? "",
    dateOfBirth: player?.dateOfBirth
      ? parse(player.dateOfBirth, "yyyy-MM-dd", new Date())
      : undefined,
    documentNumber: player?.documentNumber ?? "",
    gender: player?.gender ?? "",
    jerseyNumber: player?.jerseyNumber?.toString() ?? "",
    cometNumber: player?.cometNumber ?? "",
    fifaId: player?.fifaId ?? "",
    position: player?.position ?? "",
    dominantProfile: player?.dominantProfile ?? "",
    height: player?.height?.toString() ?? "",
    weight: player?.weight?.toString() ?? "",
    country: normalizeCountryValue(player?.country),
    categoryId: player?.categoryId ?? "",
    photoFile: null,
    currentPhotoUrl: player?.photoUrl ?? null,
  };
}

export function isPlayerFormValid(values: PlayerFormValues): boolean {
  return Boolean(
    values.firstName.trim() &&
      values.lastName.trim() &&
      values.secondLastName.trim() &&
      values.dateOfBirth &&
      values.documentNumber.trim() &&
      values.gender &&
      values.jerseyNumber.trim() &&
      values.cometNumber.trim() &&
      values.position &&
      values.dominantProfile &&
      values.country &&
      values.categoryId,
  );
}

export function buildPlayerMutationPayload(values: PlayerFormValues) {
  if (!values.dateOfBirth || !values.gender || !values.dominantProfile) {
    throw new Error("Player form payload is incomplete");
  }

  const normalizedCountry = normalizeCountryValue(values.country);

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    secondLastName: values.secondLastName.trim(),
    dateOfBirth: format(values.dateOfBirth, "yyyy-MM-dd"),
    documentNumber: values.documentNumber.trim(),
    gender: values.gender,
    jerseyNumber: parseInt(values.jerseyNumber, 10),
    categoryId: values.categoryId as Id<"categories">,
    cometNumber: values.cometNumber.trim(),
    fifaId: values.fifaId.trim() || undefined,
    position: values.position,
    dominantProfile: values.dominantProfile,
    height: values.height ? parseInt(values.height, 10) : undefined,
    weight: values.weight ? parseInt(values.weight, 10) : undefined,
    country: normalizedCountry || undefined,
  };
}

export async function uploadPlayerPhoto(
  photoFile: PlayerFormValues["photoFile"],
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage"> | undefined> {
  if (!photoFile || !(photoFile.file instanceof File)) {
    return undefined;
  }

  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": photoFile.file.type },
    body: photoFile.file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload photo");
  }

  const { storageId } = await response.json();
  return storageId as Id<"_storage">;
}
