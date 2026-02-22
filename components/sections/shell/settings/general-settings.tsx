"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import SettingsItem from "./settings-item";
import { OrganizationProfile } from "@clerk/nextjs";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { MemberInviteForm } from "./member-invite-form";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";
import { OrganizationMembersTable } from "./organization-members-table";

export function GeneralSettings() {
  const tOrganization = useTranslations("Settings.general.organization");
  const tMembers = useTranslations("Settings.general.members");
  const { isAdmin } = useIsAdmin();
  const params = useParams<{ tenant?: string }>();
  const tenant = typeof params.tenant === "string" ? params.tenant : null;
  const singleTenantMode = isSingleTenantMode();
  const organizationSlug = tenant ?? DEFAULT_TENANT_SLUG;

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
      header: {
        display: "none !important",
      },
      footer: {
        display: "none !important",
      },
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsItem
        title={tOrganization("title")}
        description={tOrganization("description")}
      >
        {singleTenantMode ? (
          <div className="rounded-md border bg-muted/20 p-3 text-sm font-medium">
            {organizationSlug}
          </div>
        ) : (
          <OrganizationProfile appearance={organizationProfileAppearance} />
        )}
      </SettingsItem>
      {isAdmin && (
        <SettingsItem
          title={tMembers("title")}
          description={tMembers("description")}
        >
          {singleTenantMode ? (
            <div className="flex flex-col gap-3">
              <MemberInviteForm tenant={organizationSlug} />
              <OrganizationMembersTable organizationSlug={organizationSlug} />
            </div>
          ) : (
            <>
              {tenant && <MemberInviteForm tenant={tenant} />}
              <OrganizationProfile appearance={organizationProfileAppearance}>
                <OrganizationProfile.Page label="members" />
                <OrganizationProfile.Page label="general" />
              </OrganizationProfile>
            </>
          )}
        </SettingsItem>
      )}
    </div>
  );
}
