import { requireAssignableImage } from "../files";
import { consumePlayerPhotoUpload } from "./photo_uploads";
import type { Id } from "../../_generated/dataModel";
import { ConvexError, type Infer } from "convex/values";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import {
  requireClubAccess,
  requireOrgAccess,
  hasClubAccess,
} from "../permissions";
import { ensureClubCategoryForLeagueSelection } from "../categories/helpers";
import { createPlayerIdentityIndex } from "@/lib/players/input";
import { MAX_IMPORT_PLAYERS } from "@/lib/players/import-limits";
import { importPlayersArgs } from "./validators";
import {
  getClubPlayerIdentities,
  getPlayerPositions,
  insertPlayer,
  validatePlayerInput,
} from "./write_helpers";

export async function getPlayerManagementContextHandler(
  ctx: QueryCtx,
  args: { organizationSlug: string; clubSlug: string },
) {
  const { user, organization } = await requireOrgAccess(
    ctx,
    args.organizationSlug,
  );
  const club = await ctx.db
    .query("clubs")
    .withIndex("byOrgAndSlug", (q) =>
      q.eq("organizationId", organization._id).eq("slug", args.clubSlug),
    )
    .unique();
  if (!club || !(await hasClubAccess(ctx, user._id, club._id))) return null;
  return { clubId: club._id, clubName: club.name };
}

export async function importPlayersHandler(
  ctx: MutationCtx,
  args: Infer<typeof importPlayersArgs>,
) {
  const { club, organization } = await requireClubAccess(ctx, args.clubId);
  if (organization.slug !== args.organizationSlug)
    throw new ConvexError({ code: "INVALID_CLUB" });
  if (!args.players.length || args.players.length > MAX_IMPORT_PLAYERS)
    throw new ConvexError({ code: "INVALID_IMPORT" });
  const sourceRows = new Set(args.players.map((player) => player.sourceRow));
  if (
    sourceRows.size !== args.players.length ||
    args.players.some(
      (player) => !Number.isInteger(player.sourceRow) || player.sourceRow < 1,
    )
  ) {
    throw new ConvexError({ code: "INVALID_IMPORT" });
  }
  const [existing, positions] = await Promise.all([
    getClubPlayerIdentities(ctx, club._id),
    getPlayerPositions(ctx, organization._id),
  ]);
  const identities = createPlayerIdentityIndex(existing);
  const skipped: { sourceRow: number; reason: "existing" | "conflict" }[] = [];
  const pending: {
    input: ReturnType<typeof validatePlayerInput>;
    photoStorageId?: Id<"_storage">;
  }[] = [];
  const photoIds = new Set<string>();
  for (const { sourceRow, photoStorageId, ...row } of args.players) {
    const match = identities.match(row);
    if (match !== "new") {
      skipped.push({ sourceRow, reason: match });
      continue;
    }
    const input = validatePlayerInput(
      { ...row, gender: args.gender },
      positions,
    );
    if (photoStorageId) {
      if (photoIds.has(photoStorageId))
        throw new ConvexError("Photo assigned to multiple players");
      photoIds.add(photoStorageId);
    }
    pending.push({ input, photoStorageId });
    identities.add({ _id: `row:${sourceRow}`, ...input });
  }
  await Promise.all(
    pending.map(({ photoStorageId }) =>
      photoStorageId
        ? requireAssignableImage(ctx, photoStorageId, {
            uploadClubId: club._id,
          })
        : undefined,
    ),
  );
  if (pending.length) {
    const { categoryId } = await ensureClubCategoryForLeagueSelection(ctx, {
      clubId: club._id,
      leagueCategoryId: args.leagueCategoryId,
      gender: args.gender,
      division: args.division,
    });
    await Promise.all(
      pending.map(async ({ input, photoStorageId }) => {
        if (photoStorageId)
          await consumePlayerPhotoUpload(ctx, photoStorageId, club._id, true);
        return insertPlayer(ctx, club._id, categoryId, input, photoStorageId);
      }),
    );
  }
  return { imported: pending.length, skipped };
}
