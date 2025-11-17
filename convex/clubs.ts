import { query } from "./_generated/server";
import { v } from "convex/values";
import { getOrgRole } from "./lib/auth";

export const listClubs = query({
  args: {
    orgSlug: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      leagueId: v.id("leagues"),
      fifaId: v.optional(v.string()),
      headquarters: v.optional(v.string()),
      status: v.union(
        v.literal("affiliated"),
        v.literal("invited"),
        v.literal("suspended")
      ),
      taxId: v.optional(v.string()),
      foundedYear: v.optional(v.number()),
      colors: v.optional(v.array(v.string())),
      website: v.optional(v.string()),
      email: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const context = await getOrgRole(ctx, identity, args.orgSlug);

    if (!context) {
      return [];
    }

    // Filter based on role
    if (context.role === "SuperAdmin") {
      return await ctx.db.query("clubs").collect();
    }

    if (context.role === "LeagueAdmin" && context.type === "league") {
      return await ctx.db
        .query("clubs")
        .withIndex("by_leagueId", (q) => q.eq("leagueId", context.organization._id))
        .collect();
    }

    // Club-level roles can only see their own club
    if (context.type === "club") {
      const thisClub = await ctx.db.get(context.organization._id);
      return thisClub ? [thisClub] : [];
    }

    return [];
  },
});