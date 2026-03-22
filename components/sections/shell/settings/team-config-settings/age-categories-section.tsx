"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import SettingsItem from "../settings-item";
import { useSoccerTerminology } from "@/lib/soccer/terminology";
import type { AgeCategory } from "./types";
import { AgeCategoryAddForm } from "./age-category-add-form";
import { AgeCategoryItem } from "./age-category-item";
import { SettingsShowMoreToggle } from "./settings-show-more-toggle";

interface NewCategory {
  name: string;
  minAge: string;
  maxAge: string;
}

interface EditingCategory {
  id: string;
  name: string;
  minAge: string;
  maxAge: string;
}

const MAX_VISIBLE_ITEMS = 6;

export function AgeCategoriesSection({
  leagueSlug,
  categories,
}: {
  leagueSlug: string;
  categories: AgeCategory[];
}) {
  const t = useTranslations("Settings.general.teamConfig");
  const tCommon = useTranslations("Common");
  const { clubs } = useSoccerTerminology();
  const addAgeCategory = useMutation(api.leagueSettings.addAgeCategory);
  const removeAgeCategory = useMutation(api.leagueSettings.removeAgeCategory);
  const updateAgeCategory = useMutation(api.leagueSettings.updateAgeCategory);

  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: "",
    minAge: "",
    maxAge: "",
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<EditingCategory | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [showAllAgeCategories, setShowAllAgeCategories] = useState(false);

  const visibleAgeCategories = showAllAgeCategories
    ? categories
    : categories.slice(0, MAX_VISIBLE_ITEMS);

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.minAge || !newCategory.maxAge) {
      return;
    }

    setIsAddingCategory(true);
    try {
      await addAgeCategory({
        leagueSlug,
        category: {
          id: crypto.randomUUID(),
          name: newCategory.name,
          minAge: parseInt(newCategory.minAge, 10),
          maxAge: parseInt(newCategory.maxAge, 10),
        },
      });
      setNewCategory({ name: "", minAge: "", maxAge: "" });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) {
      return;
    }

    const name = editingCategory.name.trim();
    const minAge = parseInt(editingCategory.minAge, 10);
    const maxAge = parseInt(editingCategory.maxAge, 10);
    if (!name || Number.isNaN(minAge) || Number.isNaN(maxAge)) {
      return;
    }

    setSavingCategoryId(editingCategory.id);
    try {
      await updateAgeCategory({
        leagueSlug,
        categoryId: editingCategory.id,
        name,
        minAge,
        maxAge,
      });
      setEditingCategory(null);
    } finally {
      setSavingCategoryId(null);
    }
  };

  return (
    <SettingsItem
      title={t("ageCategories.title")}
      description={t("ageCategories.description", { clubs })}
    >
      <div className="flex flex-col gap-4">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("ageCategories.empty")}
          </p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {visibleAgeCategories.map((category) => (
              <AgeCategoryItem
                key={category.id}
                category={category}
                editingCategory={editingCategory}
                ageLabel={tCommon("playerCard.age").toLowerCase()}
                saving={savingCategoryId === category.id}
                onStartEdit={() =>
                  setEditingCategory({
                    id: category.id,
                    name: category.name,
                    minAge: String(category.minAge),
                    maxAge: String(category.maxAge),
                  })
                }
                onChange={(field, value) =>
                  setEditingCategory((prev) =>
                    prev
                      ? {
                          ...prev,
                          [field]: value,
                        }
                      : prev,
                  )
                }
                onSave={handleSaveCategory}
                onCancel={() => setEditingCategory(null)}
                onRemove={() =>
                  removeAgeCategory({
                    leagueSlug,
                    categoryId: category.id,
                  })
                }
              />
            ))}
          </ul>
        )}

        {categories.length > MAX_VISIBLE_ITEMS && (
          <SettingsShowMoreToggle
            expanded={showAllAgeCategories}
            onToggle={() => setShowAllAgeCategories((prev) => !prev)}
          />
        )}

        <AgeCategoryAddForm
          value={newCategory}
          isSubmitting={isAddingCategory}
          onChange={(field, value) =>
            setNewCategory((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSubmit={handleAddCategory}
          labels={{
            name: t("ageCategories.name"),
            namePlaceholder: t("ageCategories.namePlaceholder"),
            minAge: t("ageCategories.minAge"),
            maxAge: t("ageCategories.maxAge"),
          }}
        />
      </div>
    </SettingsItem>
  );
}
