import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrgAdmin } from "./lib/permissions";

export const generateClubLogoUploadUrl = mutation({
  args: { organizationSlug: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.organizationSlug);
    return await ctx.storage.generateUploadUrl();
  },
});
