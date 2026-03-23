import type { MutationCtx } from "../../_generated/server";
import { normalizeAgeGroup, normalizeSpaces } from "@/lib/soccer/categories";
import { requireOrgAdmin } from "../../lib/permissions";
import { syncClubCategoriesForLeagueCategoryRename } from "../categories/helpers";
import {
  buildDefaultLeagueSettings,
  getLeagueSettingsByOrganizationId,
} from "./helpers";

function validateAgeCategoryInput(args: {
  name: string;
  minAge: number;
  maxAge: number;
}) {
  const categoryName = normalizeSpaces(args.name);

  if (!categoryName) {
    throw new Error("Age category name is required");
  }

  if (args.minAge > args.maxAge) {
    throw new Error("Minimum age cannot be greater than maximum age");
  }

  return categoryName;
}

function buildAgeCategorySemanticKey(name: string) {
  return normalizeAgeGroup(name);
}

export async function addAgeCategoryHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    category: { id: string; name: string; minAge: number; maxAge: number };
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);
  const categoryName = validateAgeCategoryInput(args.category);

  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );

  if (!settings) {
    await ctx.db.insert(
      "leagueSettings",
      buildDefaultLeagueSettings(organization._id, {
        ageCategories: [{ ...args.category, name: categoryName }],
      }),
    );
    return null;
  }

  const semanticCategoryKey = buildAgeCategorySemanticKey(categoryName);
  const exists = settings.ageCategories.some(
    (c) =>
      c.id === args.category.id ||
      buildAgeCategorySemanticKey(c.name) === semanticCategoryKey,
  );
  if (exists) {
    throw new Error("Age category already exists");
  }

  await ctx.db.patch(settings._id, {
    ageCategories: [
      ...settings.ageCategories,
      { ...args.category, name: categoryName },
    ],
  });

  return null;
}

export async function removeAgeCategoryHandler(
  ctx: MutationCtx,
  args: { leagueSlug: string; categoryId: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );

  if (!settings) {
    return null;
  }

  await ctx.db.patch(settings._id, {
    ageCategories: settings.ageCategories.filter(
      (c) => c.id !== args.categoryId,
    ),
  });

  return null;
}

export async function updateAgeCategoryHandler(
  ctx: MutationCtx,
  args: {
    leagueSlug: string;
    categoryId: string;
    name: string;
    minAge: number;
    maxAge: number;
  },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);
  const categoryName = validateAgeCategoryInput(args);

  const settings = await getLeagueSettingsByOrganizationId(
    ctx,
    organization._id,
  );

  if (!settings) {
    throw new Error("League settings not found");
  }

  const categoryExists = settings.ageCategories.some(
    (category) => category.id === args.categoryId,
  );
  if (!categoryExists) {
    throw new Error("Age category not found");
  }

  const currentCategory =
    settings.ageCategories.find(
      (category) => category.id === args.categoryId,
    ) ?? null;
  if (!currentCategory) {
    throw new Error("Age category not found");
  }

  const semanticCategoryKey = buildAgeCategorySemanticKey(categoryName);
  const duplicateName = settings.ageCategories.some(
    (category) =>
      category.id !== args.categoryId &&
      buildAgeCategorySemanticKey(category.name) === semanticCategoryKey,
  );
  if (duplicateName) {
    throw new Error("Age category already exists");
  }

  await ctx.db.patch(settings._id, {
    ageCategories: settings.ageCategories.map((category) =>
      category.id === args.categoryId
        ? {
            ...category,
            name: categoryName,
            minAge: args.minAge,
            maxAge: args.maxAge,
          }
        : category,
    ),
  });

  await syncClubCategoriesForLeagueCategoryRename(ctx, {
    organizationId: organization._id,
    leagueCategoryId: args.categoryId,
    previousAgeGroup: currentCategory.name,
    nextAgeGroup: categoryName,
  });

  return null;
}
