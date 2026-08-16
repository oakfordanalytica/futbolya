import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { clerkClient } from "../clerk";
import { DEFAULT_TENANT_SLUG } from "./tenancy";
import { pendingStaffInviteFromPublicMetadata } from "@/lib/auth/roles";

export async function processPendingStaffInvite(args: {
  ctx: ActionCtx;
  clerkUserId: string;
  clerkUpdatedAt: number;
  publicMetadata: unknown;
}) {
  const pendingStaff = pendingStaffInviteFromPublicMetadata(
    args.publicMetadata,
  );
  if (!pendingStaff) {
    return;
  }

  const user = await args.ctx.runQuery(internal.users.getByClerkId, {
    clerkId: args.clerkUserId,
  });
  if (!user) {
    return;
  }

  const staffId = await args.ctx.runMutation(
    internal.staff.createFromClerkMembership,
    {
      userId: user._id,
      clubId: pendingStaff.clubId,
      staffRole: pendingStaff.staffRole,
      organizationSlug: DEFAULT_TENANT_SLUG,
      clerkUpdatedAt: args.clerkUpdatedAt,
      ...(pendingStaff.categoryId
        ? { categoryId: pendingStaff.categoryId }
        : {}),
    },
  );
  if (!staffId) {
    return;
  }

  await clerkClient.users.updateUserMetadata(args.clerkUserId, {
    publicMetadata: { pendingStaff: null },
  });
}
