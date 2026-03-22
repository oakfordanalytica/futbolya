"use client";

import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import SettingsItem from "../settings-item";
import { useSoccerTerminology } from "@/lib/soccer/terminology";
import type { Gender } from "./types";

export function EnabledGendersSection({
  leagueSlug,
  enabledGenders,
}: {
  leagueSlug: string;
  enabledGenders: Gender[];
}) {
  const t = useTranslations("Settings.general.teamConfig");
  const { clubs } = useSoccerTerminology();
  const updateEnabledGenders = useMutation(
    api.leagueSettings.updateEnabledGenders,
  );

  const handleGenderToggle = async (gender: Gender, checked: boolean) => {
    const newGenders = checked
      ? [...enabledGenders, gender]
      : enabledGenders.filter((currentGender) => currentGender !== gender);

    await updateEnabledGenders({
      leagueSlug,
      enabledGenders: newGenders,
    });
  };

  return (
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
  );
}
