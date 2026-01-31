import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
