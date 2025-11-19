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
import {
  InboxIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";
import {
  buildNavUrl,
  getNavigationContext,
  isNavItemActive,
} from "@/lib/navigation/utils";
import { useState } from "react";

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

function OrgSwitcher({ currentOrgSlug }: { currentOrgSlug: string | null }) {
  const myOrgs = useQuery(api.users.getMyOrganizations);
  const [isOpen, setIsOpen] = useState(false);

  if (myOrgs === undefined) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!myOrgs || myOrgs.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No organizations found
      </div>
    );
  }

  const currentOrg = currentOrgSlug
    ? myOrgs.find((org) => org.slug === currentOrgSlug)
    : null;

  const isSuperAdmin = myOrgs.some((org) => org.role === "SuperAdmin");
  const isInSuperAdminView = currentOrgSlug === null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isInSuperAdminView ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                ★
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">SuperAdmin</div>
                <div className="text-xs text-muted-foreground">
                  Global Access
                </div>
              </div>
            </>
          ) : currentOrg ? (
            <>
              {currentOrg.logoUrl ? (
                <img
                  src={currentOrg.logoUrl}
                  alt={currentOrg.name}
                  className="h-8 w-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                  {currentOrg.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {currentOrg.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentOrg.role}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted flex-shrink-0">
                ?
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  Unknown Organization
                </div>
                <div className="text-xs text-muted-foreground">Not found</div>
              </div>
            </>
          )}
        </div>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-popover shadow-lg max-h-96 overflow-y-auto">
            <div className="p-1">
              {isSuperAdmin && (
                <>
                  <a
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors ${
                      isInSuperAdminView ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                      ★
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">SuperAdmin</div>
                      <div className="text-xs text-muted-foreground">
                        Global Access
                      </div>
                    </div>
                    {isInSuperAdminView && (
                      <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </a>
                  <div className="my-1 h-px bg-border" />
                </>
              )}

              {myOrgs.map((org) => (
                <a
                  key={org._id}
                  href={`/${org.slug}/admin`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors ${
                    org.slug === currentOrgSlug ? "bg-muted" : ""
                  }`}
                >
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-8 w-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {org.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{org.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {org.role}
                    </div>
                  </div>
                  {org.slug === currentOrgSlug && (
                    <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SidebarAppSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = (params.org as string) || null;

  const isInSuperAdminView = pathname.startsWith("/admin");

  const orgDetails = useQuery(
    api.organizations.getBySlug, 
    orgSlug ? { slug: orgSlug } : "skip"
  );

  const currentRole = orgSlug
    ? useQuery(api.users.getMyRoleInOrg, {
        orgSlug,
        orgType: orgDetails?.type || "league", 
      })
    : null;

  const roleToUse = isInSuperAdminView ? "SuperAdmin" : currentRole || null;

  const { basePath, navItems } = getNavigationContext(
    orgSlug || "",
    roleToUse,
    orgDetails?.type
  );

  if (orgSlug && currentRole === undefined) {
    return (
      <Sidebar>
        <SidebarHeader>
          <OrgSwitcher currentOrgSlug={orgSlug} />
        </SidebarHeader>
        <SidebarBody>
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        </SidebarBody>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <OrgSwitcher currentOrgSlug={orgSlug} />
      </SidebarHeader>

      <SidebarBody>
        {navItems.length > 0 && (
          <SidebarSection>
            {navItems.map((item) => {
              const href = buildNavUrl(basePath, item.href);
              const isCurrent = isNavItemActive(pathname, href, item.href === "");

              return (
                <SidebarItem key={item.label} href={href} current={isCurrent}>
                  <item.icon />
                  <SidebarLabel>{item.label}</SidebarLabel>
                </SidebarItem>
              );
            })}
          </SidebarSection>
        )}

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