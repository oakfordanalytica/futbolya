"use client";

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
import {
  OrganizationSwitcher,
  UserButton,
  useUser,
  useOrganization,
  useAuth,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import { InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { usePathname } from "next/navigation";
import {
  buildNavUrl,
  getNavigationContext,
  isNavItemActive,
} from "@/lib/navigation/utils";
import { SidebarSkeleton } from "./skeletons/sidebar-skeleton";
import { NavbarSkeleton } from "./skeletons/navbar-skeleton";

export function NavbarAppSidebar() {
  return (
    <>
      <ClerkLoading>
        <NavbarSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
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
      </ClerkLoaded>
    </>
  );
}

export function SidebarAppSidebar() {
  const { organization } = useOrganization();
  const { has } = useAuth();
  let pathname = usePathname();

  const orgSlug = organization?.slug;
  const { role, navItems } =
    has && orgSlug
      ? getNavigationContext(orgSlug, has)
      : { role: null, navItems: [] };
  return (
    <>
      <ClerkLoading>
        <SidebarSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <Sidebar>
          <SidebarHeader>
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/:slug"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                    justifyContent: "left",
                  },
                  organizationSwitcherTrigger: {
                    width: "100%",
                    justifyContent: "space-between",
                  },
                },
              }}
            />
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {role &&
                orgSlug &&
                navItems.map((item) => {
                  const href = buildNavUrl(orgSlug, role, item.href);
                  const isCurrent = isNavItemActive(
                    pathname,
                    href,
                    item.href === "",
                  );
                  return (
                    <SidebarItem
                      key={item.label}
                      href={href}
                      current={isCurrent}
                    >
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
                    // width: "100%",
                  },
                },
              }}
              showName
            />
          </SidebarFooter>
        </Sidebar>
      </ClerkLoaded>
    </>
  );
}
