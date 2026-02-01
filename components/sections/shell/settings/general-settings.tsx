"use client";

import { useTranslations } from "next-intl";
import SettingsItem from "./settings-item";
import { OrganizationProfile } from "@clerk/nextjs";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function GeneralSettings() {
  const tOrganization = useTranslations("Settings.general.organization");
  const tMembers = useTranslations("Settings.general.members");
  const { isAdmin } = useIsAdmin();

  const organizationProfileAppearance = {
    elements: {
      rootBox: {
        width: "100%",
      },
      cardBox: {
        display: "block",
        gridTemplateColumns: "unset",
        height: "auto",
        width: "100%",
      },
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsItem
        title={tOrganization("title")}
        description={tOrganization("description")}
      >
        <OrganizationProfile appearance={organizationProfileAppearance} />
      </SettingsItem>
      {isAdmin && (
        <SettingsItem
          title={tMembers("title")}
          description={tMembers("description")}
        >
          <OrganizationProfile appearance={organizationProfileAppearance}>
            <OrganizationProfile.Page label="members" />
            <OrganizationProfile.Page label="general" />
          </OrganizationProfile>
        </SettingsItem>
      )}
    </div>
  );
}
