"use client";

import { useParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/ui/navbar";
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
import { UserButton } from "@clerk/nextjs";
import { InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  buildNavUrl,
  getNavigationContext,
  isNavItemActive,
} from "@/lib/navigation/utils";
import { SidebarSkeleton } from "./skeletons/sidebar-skeleton";
import { NavbarSkeleton } from "./skeletons/navbar-skeleton";

export function NavbarAppSidebar() {
  return (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href="/search" aria-label="Search">
          <MagnifyingGlassIcon />
        </NavbarItem>
        <NavbarItem href="/inbox" aria-label="Inbox">
          <InboxIcon />
        </NavbarItem>
        <UserButton />
      </NavbarSection>
    </Navbar>
  );
}

/**
 * Organization Switcher Component
 * Shows list of user's organizations
 */
function OrgSwitcher({ currentOrgSlug }: { currentOrgSlug: string }) {
  const myOrgs = useQuery(api.users.getMyOrganizations);

  if (!myOrgs) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  const currentOrg = myOrgs.find((org) => org.slug === currentOrgSlug);

  return (
    <div className="space-y-2">
      <div className="px-4 py-2 text-sm font-semibold">
        {currentOrg?.name || "Select Organization"}
      </div>
      {myOrgs.length > 1 && (
        <div className="border-t">
          {myOrgs.map((org) => (
            <a
              key={org._id}
              href={`/${org.slug}`}
              className={`block px-4 py-2 text-sm hover:bg-muted ${
                org.slug === currentOrgSlug ? "bg-muted font-medium" : ""
              }`}
            >
              {org.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarAppSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = params.org as string;

  // Get user's role in current organization
  const currentRole = useQuery(api.users.getMyRoleInOrg, {
    orgSlug,
    orgType: "league", // TODO: Determine dynamically based on org data
  });

  // Get navigation context
  const { role, navItems } = getNavigationContext(orgSlug, currentRole || null);

  // Loading state
  if (currentRole === undefined) {
    return <SidebarSkeleton />;
  }

  // No access state
  if (!role) {
    return (
      <Sidebar>
        <SidebarHeader>
          <div className="p-4 text-sm text-muted-foreground">
            No access to this organization
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <OrgSwitcher currentOrgSlug={orgSlug} />
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          {navItems.map((item) => {
            const href = buildNavUrl(orgSlug, role, item.href);
            const isCurrent = isNavItemActive(pathname, href, item.href === "");

            return (
              <SidebarItem key={item.label} href={href} current={isCurrent}>
                <item.icon />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSpacer />

        <SidebarSection>
          <SidebarItem>
            <ModeToggle />
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter className="max-lg:hidden">
        <UserButton
          appearance={{
            elements: {
              userButtonBox: {
                flexDirection: "row-reverse",
                textAlign: "left",
              },
            },
          }}
          showName
        />
      </SidebarFooter>
    </Sidebar>
  );
}