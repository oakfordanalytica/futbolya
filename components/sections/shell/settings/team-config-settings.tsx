"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import SettingsItem from "./settings-item";
import { useSportTerminology } from "@/components/providers/sport-provider";

type Gender = "male" | "female" | "mixed";
type DivisionType = "alphabetic" | "greek" | "numeric";

interface NewCategory {
  name: string;
  minAge: string;
  maxAge: string;
}

interface NewPosition {
  name: string;
  abbreviation: string;
}

export function TeamConfigSettings() {
  const t = useTranslations("Settings.general.teamConfig");
  const tCommon = useTranslations("Common");
  const { organization } = useOrganization();
  const { clubs } = useSportTerminology();
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: "",
    minAge: "",
    maxAge: "",
  });
  const [newPosition, setNewPosition] = useState<NewPosition>({
    name: "",
    abbreviation: "",
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingPosition, setIsAddingPosition] = useState(false);

  const teamConfig = useQuery(
    api.leagueSettings.getTeamConfig,
    organization?.slug ? { leagueSlug: organization.slug } : "skip",
  );

  const addAgeCategory = useMutation(api.leagueSettings.addAgeCategory);
  const removeAgeCategory = useMutation(api.leagueSettings.removeAgeCategory);
  const addPosition = useMutation(api.leagueSettings.addPosition);
  const removePosition = useMutation(api.leagueSettings.removePosition);
  const updateEnabledGenders = useMutation(
    api.leagueSettings.updateEnabledGenders,
  );
  const updateHorizontalDivisions = useMutation(
    api.leagueSettings.updateHorizontalDivisions,
  );

  if (!organization?.slug || !teamConfig) {
    return null;
  }

  const leagueSlug = organization.slug;

  const ageCategories = teamConfig.ageCategories;
  const positions = teamConfig.positions ?? [];
  const enabledGenders = teamConfig.enabledGenders;
  const horizontalDivisions = teamConfig.horizontalDivisions ?? {
    enabled: false,
    type: "alphabetic" as DivisionType,
  };

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
          minAge: parseInt(newCategory.minAge),
          maxAge: parseInt(newCategory.maxAge),
        },
      });
      setNewCategory({ name: "", minAge: "", maxAge: "" });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    await removeAgeCategory({
      leagueSlug,
      categoryId,
    });
  };

  const handleAddPosition = async () => {
    if (!newPosition.name || !newPosition.abbreviation) {
      return;
    }

    setIsAddingPosition(true);
    try {
      await addPosition({
        leagueSlug,
        position: {
          id: crypto.randomUUID(),
          name: newPosition.name,
          abbreviation: newPosition.abbreviation,
        },
      });
      setNewPosition({ name: "", abbreviation: "" });
    } finally {
      setIsAddingPosition(false);
    }
  };

  const handleRemovePosition = async (positionId: string) => {
    await removePosition({
      leagueSlug,
      positionId,
    });
  };

  const handleGenderToggle = async (gender: Gender, checked: boolean) => {
    const newGenders = checked
      ? [...enabledGenders, gender]
      : enabledGenders.filter((g) => g !== gender);

    await updateEnabledGenders({
      leagueSlug,
      enabledGenders: newGenders,
    });
  };

  const handleHorizontalDivisionsToggle = async (enabled: boolean) => {
    await updateHorizontalDivisions({
      leagueSlug,
      horizontalDivisions: enabled
        ? { enabled: true, type: horizontalDivisions.type }
        : undefined,
    });
  };

  const handleDivisionTypeChange = async (type: DivisionType) => {
    await updateHorizontalDivisions({
      leagueSlug,
      horizontalDivisions: { enabled: true, type },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Age Categories */}
      <SettingsItem
        title={t("ageCategories.title")}
        description={t("ageCategories.description", { clubs })}
      >
        <div className="flex flex-col gap-4">
          {ageCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("ageCategories.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {ageCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.minAge} - {category.maxAge}{" "}
                      {tCommon("playerCard.age").toLowerCase()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveCategory(category.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("ageCategories.name")}
              </Label>
              <Input
                placeholder={t("ageCategories.namePlaceholder")}
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("ageCategories.minAge")}
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={newCategory.minAge}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, minAge: e.target.value })
                }
                className="w-20"
                min={0}
                max={99}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("ageCategories.maxAge")}
              </Label>
              <Input
                type="number"
                placeholder="99"
                value={newCategory.maxAge}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, maxAge: e.target.value })
                }
                className="w-20"
                min={0}
                max={99}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground invisible">
                &nbsp;
              </Label>
              <Button
                onClick={handleAddCategory}
                disabled={
                  isAddingCategory ||
                  !newCategory.name ||
                  !newCategory.minAge ||
                  !newCategory.maxAge
                }
                size="icon"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </SettingsItem>

      {/* Positions */}
      <SettingsItem
        title={t("positions.title")}
        description={t("positions.description")}
      >
        <div className="flex flex-col gap-4">
          {positions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("positions.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{position.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({position.abbreviation})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemovePosition(position.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("positions.name")}
              </Label>
              <Input
                placeholder={t("positions.namePlaceholder")}
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, name: e.target.value })
                }
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("positions.abbreviation")}
              </Label>
              <Input
                placeholder={t("positions.abbreviationPlaceholder")}
                value={newPosition.abbreviation}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    abbreviation: e.target.value,
                  })
                }
                className="w-24"
                maxLength={5}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground invisible">
                &nbsp;
              </Label>
              <Button
                onClick={handleAddPosition}
                disabled={
                  isAddingPosition ||
                  !newPosition.name ||
                  !newPosition.abbreviation
                }
                size="icon"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </SettingsItem>

      {/* Enabled Genders */}
      <SettingsItem
        title={t("enabledGenders.title")}
        description={t("enabledGenders.description", { clubs })}
      >
        <div className="flex flex-wrap gap-6">
          {(["male", "female", "mixed"] as const).map((gender) => {
            const isChecked = enabledGenders.includes(gender);
            const isDisabled =
              enabledGenders.length === 1 && enabledGenders.includes(gender);

            return (
              <div key={gender} className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked: boolean) =>
                    handleGenderToggle(gender, checked)
                  }
                  disabled={isDisabled}
                />
                <Label className="cursor-pointer">
                  {t(`enabledGenders.${gender}`)}
                </Label>
              </div>
            );
          })}
        </div>
      </SettingsItem>

      {/* Horizontal Divisions */}
      <SettingsItem
        title={t("horizontalDivisions.title")}
        description={t("horizontalDivisions.description", { clubs })}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={horizontalDivisions.enabled}
              onChange={handleHorizontalDivisionsToggle}
            />
            <Label>{t("horizontalDivisions.enabled")}</Label>
          </div>

          {horizontalDivisions.enabled && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("horizontalDivisions.type")}
              </Label>
              <Select
                value={horizontalDivisions.type}
                onValueChange={(value) =>
                  handleDivisionTypeChange(value as DivisionType)
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetic">
                    {t("horizontalDivisions.types.alphabetic")}
                  </SelectItem>
                  <SelectItem value="greek">
                    {t("horizontalDivisions.types.greek")}
                  </SelectItem>
                  <SelectItem value="numeric">
                    {t("horizontalDivisions.types.numeric")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SettingsItem>
    </div>
  );
}
