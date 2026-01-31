import { v } from "convex/values";

export const applicationStatus = v.union(
  v.literal("pending"),
  v.literal("reviewing"),
  v.literal("pre-admitted"),
  v.literal("admitted"),
  v.literal("denied"),
);

export const formDataValidator = v.record(
  v.string(),
  v.record(
    v.string(),
    v.union(v.string(), v.number(), v.boolean(), v.null()),
  ),
);

export const paginationArgs = {
  limit: v.optional(v.number()),
  cursor: v.optional(v.string()),
};
