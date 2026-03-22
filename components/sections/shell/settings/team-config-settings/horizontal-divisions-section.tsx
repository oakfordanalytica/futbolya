"use client";

import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SettingsItem from "../settings-item";
import { useSoccerTerminology } from "@/lib/soccer/terminology";
import type { DivisionType, HorizontalDivisions } from "./types";

export function HorizontalDivisionsSection({
  leagueSlug,
  horizontalDivisions,
}: {
  leagueSlug: string;
  horizontalDivisions: HorizontalDivisions;
}) {
  const t = useTranslations("Settings.general.teamConfig");
  const { clubs } = useSoccerTerminology();
  const updateHorizontalDivisions = useMutation(
    api.leagueSettings.updateHorizontalDivisions,
  );

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
  );
}
