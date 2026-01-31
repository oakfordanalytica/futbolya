"use client";

import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Navbar, NavbarSection, NavbarSpacer } from "@/components/ui/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Cog6ToothIcon } from "@heroicons/react/20/solid";
import { getNavConfig, getNavContext, isItemActive } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";

export function NavbarAppSidebar() {
  const params = useParams();
  const orgSlug = (params.tenant as string) || null;

  return (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <UserButton
          userProfileUrl={ROUTES.org.settings.profileSecurity(orgSlug!)}
        />
      </NavbarSection>
    </Navbar>
  );
}

export function SidebarAppSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation.nav");

  const orgSlug = (params.tenant as string) || null;

  // Build locale-aware URL for OrganizationSwitcher
  // Only include locale prefix if it's not the default locale (due to localePrefix: "as-needed")
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const afterSelectOrgUrl = `${localePrefix}/:slug/applications`;

  const context = getNavContext(pathname, orgSlug);
  const { items, settingsHref } = getNavConfig(context);

  return (
    <Sidebar>
      <SidebarHeader>
        <OrganizationSwitcher
          organizationProfileUrl={ROUTES.org.settings.root(orgSlug!)}
          afterLeaveOrganizationUrl={ROUTES.admin.organizations.list}
          afterSelectOrganizationUrl={afterSelectOrgUrl}
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger: "w-full justify-between text-left",
              organizationPreviewMainIdentifier:
                "text-sidebar-foreground text-lg font-semibold",
              organizationPreviewSecondaryIdentifier:
                "text-sidebar-foreground/70",
              organizationSwitcherTriggerIcon: "text-sidebar-foreground",
              organizationSwitcherPopoverCard: "bg-popover",
              organizationSwitcherPopoverActionButton: "hover:bg-accent",
              organizationSwitcherPopoverActionButtonText: "text-foreground",
              avatarBox: "size-12",
              organizationPreviewAvatarBox: "size-12",
            },
          }}
        />
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          {items.map((item) => {
            const href = item.href(orgSlug ?? undefined);
            const isCurrent = isItemActive(pathname, href, item.isIndex);

            return (
              <SidebarItem key={item.labelKey} href={href} current={isCurrent}>
                <item.icon data-slot="icon" />
                <SidebarLabel>{t(item.labelKey)}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSpacer />

        <SidebarSection>
          <SidebarItem
            href={settingsHref(orgSlug ?? undefined)}
            current={isItemActive(
              pathname,
              settingsHref(orgSlug ?? undefined),
              false,
            )}
          >
            <Cog6ToothIcon data-slot="icon" />
            <SidebarLabel>{t("settings")}</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter className="max-lg:hidden">
        <UserButton
          userProfileUrl={ROUTES.org.settings.profileSecurity(orgSlug!)}
          appearance={{
            elements: {
              userButtonBox: {
                flexDirection: "row-reverse",
                textAlign: "left",
                maxWidth: "100%",
              },
              userButtonOuterIdentifier: "text-sidebar-foreground",
              userButtonTrigger: "text-sidebar-foreground",
            },
          }}
          showName
        />
      </SidebarFooter>
    </Sidebar>
  );
}
