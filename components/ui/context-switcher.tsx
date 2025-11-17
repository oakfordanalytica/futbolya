"use client";

import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown"; // Assuming Shadcn/ui dropdown
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

// This would come from your new query: api.users.getMyOrganizations
type OrgForSwitcher = {
  name: string;
  slug: string;
  type: "league" | "club";
};

type ContextSwitcherProps = {
  allOrgs?: OrgForSwitcher[];
  currentOrgSlug: string;
};

export function ContextSwitcher({ allOrgs, currentOrgSlug }: ContextSwitcherProps) {
  if (!allOrgs || allOrgs.length <= 1) {
    return null; // Don't show switcher if user is only in one org
  }

  const currentOrg = allOrgs.find((org) => org.slug === currentOrgSlug);

  return (
    <Dropdown>
      <DropdownButton className="flex items-center gap-2">
        <span>{currentOrg?.name ?? "Select Organization"}</span>
        <ChevronDownIcon className="size-4" />
      </DropdownButton>
      <DropdownMenu>
        {allOrgs.map((org) => (
          <DropdownItem key={org.slug} disabled={org.slug === currentOrgSlug}>
            <Link
              href={`/${org.slug}/admin`} // Or whatever the base route is
              className="block w-full"
            >
              {org.name}
            </Link>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}