"use client";

import { useTranslations } from "next-intl";
import { useOrganization } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";
import { SeasonsSettings } from "./seasons-settings";
import { AgeCategoriesSection } from "./team-config-settings/age-categories-section";
import { EnabledGendersSection } from "./team-config-settings/enabled-genders-section";
import { HorizontalDivisionsSection } from "./team-config-settings/horizontal-divisions-section";
import { LineupsSection } from "./team-config-settings/lineups-section";
import { PositionsSection } from "./team-config-settings/positions-section";
import type { DivisionType } from "./team-config-settings/types";
import SettingsItem from "./settings-item";

export function TeamConfigSettings() {
  const tCommon = useTranslations("Common");
  const tSeasons = useTranslations("Settings.general.seasons");
  const { organization } = useOrganization();
  const params = useParams<{ tenant?: string }>();
  const tenant = typeof params.tenant === "string" ? params.tenant : null;
  const singleTenantMode = isSingleTenantMode();
  const leagueSlug = singleTenantMode
    ? (tenant ?? DEFAULT_TENANT_SLUG)
    : (organization?.slug ?? null);

  const teamConfig = useQuery(
    api.leagueSettings.getTeamConfig,
    leagueSlug ? { leagueSlug } : "skip",
  );

  if (!leagueSlug) {
    return null;
  }

  if (teamConfig === undefined) {
    return (
      <div className="text-sm text-muted-foreground">
        {tCommon("actions.loading")}
      </div>
    );
  }

  if (teamConfig === null) {
    return (
      <div className="text-sm text-muted-foreground">
        Team configuration is not available for this organization yet.
      </div>
    );
  }

  const horizontalDivisions = teamConfig.horizontalDivisions ?? {
    enabled: false,
    type: "alphabetic" as DivisionType,
  };

  return (
    <div className="flex flex-col gap-8">
      <AgeCategoriesSection
        leagueSlug={leagueSlug}
        categories={teamConfig.ageCategories}
      />

      <PositionsSection
        leagueSlug={leagueSlug}
        positions={teamConfig.positions ?? []}
      />

      <LineupsSection
        leagueSlug={leagueSlug}
        lineups={teamConfig.lineups ?? []}
      />

      <SettingsItem
        title={tSeasons("title")}
        description={tSeasons("description")}
      >
        <SeasonsSettings leagueSlug={leagueSlug} />
      </SettingsItem>

      <EnabledGendersSection
        leagueSlug={leagueSlug}
        enabledGenders={teamConfig.enabledGenders}
      />

      <HorizontalDivisionsSection
        leagueSlug={leagueSlug}
        horizontalDivisions={horizontalDivisions}
      />
    </div>
  );
}
