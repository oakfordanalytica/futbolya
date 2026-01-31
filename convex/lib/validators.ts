import { v } from "convex/values";

export const paginationArgs = {
  limit: v.optional(v.number()),
  cursor: v.optional(v.string()),
};
