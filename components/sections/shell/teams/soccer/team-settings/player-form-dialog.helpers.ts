import { getPlayerInputErrors } from "@/lib/players/input";
import { format, parse } from "date-fns";
import { normalizeCountryValue } from "@/lib/countries/countries";
import {
  deriveDivisionFromCategoryName,
  findLeagueAgeCategoryByAgeGroup,
  type LeagueAgeCategory,
} from "@/lib/soccer/categories";
import type { PlayerData, PlayerFormValues } from "./player-form-dialog.types";

export function createPlayerFormValues(
  player?: PlayerData | null,
  ageCategories: LeagueAgeCategory[] = [],
): PlayerFormValues {
  const matchedLeagueCategory =
    (player?.categoryLeagueCategoryId
      ? (ageCategories.find(
          (category) => category.id === player.categoryLeagueCategoryId,
        ) ?? null)
      : null) ??
    findLeagueAgeCategoryByAgeGroup(ageCategories, player?.categoryAgeGroup);

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
    leagueCategoryId: matchedLeagueCategory?.id ?? "",
    division:
      player?.categoryName && player?.categoryAgeGroup
        ? deriveDivisionFromCategoryName(
            player.categoryName,
            player.categoryAgeGroup,
          )
        : "",
    photoFile: null,
    currentPhotoUrl: player?.photoUrl ?? null,
  };
}

export function isPlayerFormValid(
  values: PlayerFormValues,
  horizontalDivisionsEnabled: boolean,
): boolean {
  if (
    !values.dateOfBirth ||
    !values.gender ||
    !values.leagueCategoryId ||
    (horizontalDivisionsEnabled && !values.division)
  )
    return false;
  return (
    getPlayerInputErrors(
      buildPlayerMutationPayload({ values }),
      format(new Date(), "yyyy-MM-dd"),
    ).length === 0
  );
}

export function buildPlayerMutationPayload(args: { values: PlayerFormValues }) {
  const { values } = args;

  if (!values.dateOfBirth || !values.gender) {
    throw new Error("Player form payload is incomplete");
  }

  const normalizedCountry = normalizeCountryValue(values.country);

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    secondLastName: values.secondLastName.trim() || undefined,
    dateOfBirth: format(values.dateOfBirth, "yyyy-MM-dd"),
    documentNumber: values.documentNumber.trim(),
    gender: values.gender,
    jerseyNumber: values.jerseyNumber.trim()
      ? Number(values.jerseyNumber)
      : undefined,
    leagueCategoryId: values.leagueCategoryId,
    division: values.division || undefined,
    cometNumber: values.cometNumber.trim(),
    fifaId: values.fifaId.trim() || undefined,
    position: values.position,
    dominantProfile: values.dominantProfile || undefined,
    height: values.height ? Number(values.height.replace(",", ".")) : undefined,
    weight: values.weight ? Number(values.weight.replace(",", ".")) : undefined,
    country: normalizedCountry || undefined,
  };
}
