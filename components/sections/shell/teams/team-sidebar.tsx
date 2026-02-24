"use client";

import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Avatar } from "@/components/ui/avatar";
import { UserButton } from "@clerk/nextjs";
import { Cog6ToothIcon } from "@heroicons/react/20/solid";
import { getTeamNavConfig, isItemActive } from "@/lib/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { useSportTerminology } from "@/lib/sports";
import type { SportTerminology } from "@/lib/sports";
import { Link } from "@/components/ui/link";
import {
  getTeamUserProfileUrl,
  getTenantSignInUrl,
} from "@/lib/navigation/user-button";

const TERMINOLOGY_MAP: Record<string, keyof SportTerminology> = {
  roster: "players",
  schedule: "matches",
};

export function TeamNavbar() {
  const params = useParams();
  const locale = useLocale();
  const orgSlug = params.tenant as string;
  const teamSlug = params.team as string;
  const userProfileUrl = getTeamUserProfileUrl(locale, orgSlug, teamSlug);
  const afterSignOutUrl = getTenantSignInUrl(locale, orgSlug);

  return (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <UserButton
          userProfileUrl={userProfileUrl}
          afterSignOutUrl={afterSignOutUrl}
        />
      </NavbarSection>
    </Navbar>
  );
}

export function TeamSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation.nav");
  const terminology = useSportTerminology();

  const orgSlug = params.tenant as string;
  const teamSlug = params.team as string;
  const userProfileUrl = getTeamUserProfileUrl(locale, orgSlug, teamSlug);
  const afterSignOutUrl = getTenantSignInUrl(locale, orgSlug);

  const team = useQuery(api.clubs.getBySlug, { slug: teamSlug });

  const { items, settingsHref } = getTeamNavConfig();

  const getLabel = (labelKey: string): string => {
    const terminologyKey = TERMINOLOGY_MAP[labelKey];
    if (terminologyKey) {
      return terminology[terminologyKey];
    }
    return t(labelKey);
  };

  const teamName = team?.name || teamSlug;
  const teamLogo = team?.logoUrl;

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href={ROUTES.org.teams.list(orgSlug)}
          className="flex items-center gap-3 px-2 text-sidebar-foreground transition-opacity hover:opacity-80"
        >
          <Avatar
            src={teamLogo}
            initials={teamName.slice(0, 2).toUpperCase()}
            className="size-10 bg-sidebar-accent/40 text-sidebar-foreground"
          />
          <span className="truncate text-lg font-semibold text-sidebar-foreground">
            {teamName}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          {items.map((item) => {
            const href = item.href(orgSlug, teamSlug);
            const isCurrent = isItemActive(pathname, href, item.isIndex);

            return (
              <SidebarItem key={item.labelKey} href={href} current={isCurrent}>
                <item.icon data-slot="icon" />
                <SidebarLabel>{getLabel(item.labelKey)}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSpacer />

        <SidebarSection>
          <SidebarItem
            href={settingsHref(orgSlug, teamSlug)}
            current={isItemActive(
              pathname,
              settingsHref(orgSlug, teamSlug),
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
          userProfileUrl={userProfileUrl}
          afterSignOutUrl={afterSignOutUrl}
          appearance={{
            elements: {
              userButtonBox: {
                flexDirection: "row-reverse",
                textAlign: "left",
                maxWidth: "95%",
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
