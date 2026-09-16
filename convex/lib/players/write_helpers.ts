import { ConvexError } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Doc } from "../../_generated/dataModel";
import { getLeagueSettingsByOrganizationId } from "../league_settings/helpers";
import {
  getPlayerInputErrors,
  normalizePlayerInput,
  type PlayerInput,
} from "@/lib/players/input";

export async function getClubPlayerIdentities(
  ctx: MutationCtx,
  clubId: Id<"clubs">,
) {
  return await ctx.db
    .query("players")
    .withIndex("byClub", (q) => q.eq("clubId", clubId))
    .collect();
}

export async function getPlayerPositions(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
) {
  const settings = await getLeagueSettingsByOrganizationId(ctx, organizationId);
  return new Set((settings?.positions ?? []).map((position) => position.id));
}

export function validatePlayerInput(
  input: PlayerInput,
  positions: Set<string>,
) {
  const normalized = normalizePlayerInput(input);
  const errors = getPlayerInputErrors(
    normalized,
    new Date().toISOString().slice(0, 10),
  );
  if (!normalized.position || !positions.has(normalized.position))
    errors.push("position");
  if (errors.length)
    throw new ConvexError({
      code: "INVALID_PLAYER",
      fields: [...new Set(errors)],
    });
  return normalized;
}

export async function validatePlayerChanges(
  ctx: MutationCtx,
  player: Doc<"players">,
  changes: Partial<PlayerInput>,
) {
  // Older records may be incomplete. Validate changed fields without requiring
  // unrelated legacy fields to be filled in during an edit.
  const input = {
    ...player,
    ...changes,
    dateOfBirth: changes.dateOfBirth ?? player.dateOfBirth ?? "",
    documentNumber: changes.documentNumber ?? player.documentNumber ?? "",
    cometNumber: changes.cometNumber ?? player.cometNumber ?? "",
    gender: changes.gender ?? player.gender ?? "male",
  };
  const errors = getPlayerInputErrors(
    input,
    new Date().toISOString().slice(0, 10),
  ).filter((key) => changes[key] !== undefined);
  if (changes.position !== undefined) {
    const club = await ctx.db.get(player.clubId);
    if (
      !club ||
      !(await getPlayerPositions(ctx, club.organizationId)).has(
        changes.position,
      )
    )
      errors.push("position");
  }
  if (errors.length)
    throw new ConvexError({
      code: "INVALID_PLAYER",
      fields: [...new Set(errors)],
    });
}

/** The caller has already authorized the club and resolved its category. */
export async function insertPlayer(
  ctx: MutationCtx,
  clubId: Id<"clubs">,
  categoryId: Id<"categories">,
  input: PlayerInput,
  photoStorageId?: Id<"_storage">,
) {
  return await ctx.db.insert("players", {
    ...input,
    clubId,
    categoryId,
    photoStorageId,
    sportType: "soccer",
    status: "active",
  });
}
