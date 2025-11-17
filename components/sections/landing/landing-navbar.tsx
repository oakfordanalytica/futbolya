"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Navbar,
  NavbarDivider,
  NavbarSection,
  NavbarItem,
  NavbarSpacer,
} from "@/components/ui/navbar";
import { PinnedLeagues } from "@/components/sections/landing/pinned-leagues";
import { getRouteByRole } from "@/lib/auth/auth";

const navItems = [
  { label: "Features", url: "#features" },
  { label: "About", url: "#about" },
];

function AuthButtons() {
  const { isSignedIn, user } = useUser();
  const myOrgs = useQuery(api.users.getMyOrganizations);

  if (isSignedIn && myOrgs && myOrgs.length > 0) {
    // User is authenticated and has organizations
    const primaryOrg = myOrgs[0];
    const dashboardUrl = getRouteByRole(primaryOrg.role, primaryOrg.slug);

    return (
      <Button color="blue" href={dashboardUrl}>
        Go to Dashboard
      </Button>
    );
  }

  if (isSignedIn) {
    // User is authenticated but has no orgs yet
    return (
      <Button color="blue" href="/onboarding">
        Complete Setup
      </Button>
    );
  }

  // Not authenticated
  return (
    <>
      <NavbarItem href="/sign-in" aria-label="sign-in">
        Sign in
      </NavbarItem>
    </>
  );
}

export function SidebarLandingNavbar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          {navItems.map(({ label, url }) => (
            <SidebarItem key={label} href={url}>
              {label}
            </SidebarItem>
          ))}
        </SidebarSection>
        <SidebarSection>
          <AuthButtons />
        </SidebarSection>
        <SidebarSection className="mt-6">
          <PinnedLeagues />
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );
}

export function NavbarLandingNavbar() {
  return (
    <Navbar className="flex flex-row-reverse lg:flex-row">
      <Link href="/" aria-label="Home">
        <Logo className="h-10 w-auto" />
      </Link>
      <NavbarDivider className="max-lg:hidden" />
      <NavbarSection className="max-lg:hidden">
        {navItems.map(({ label, url }) => (
          <NavbarItem key={label} href={url}>
            {label}
          </NavbarItem>
        ))}
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection className="hidden lg:flex flex-row">
        <AuthButtons />
      </NavbarSection>
    </Navbar>
  );
}