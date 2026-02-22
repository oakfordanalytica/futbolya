"use client";

import { Authenticated, Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ApplicationsTable } from "./applications-table";

interface ApplicationsTableAdminWrapperProps {
  preloadedApplications: Preloaded<
    typeof api.applications.listByOrganizationSummary
  >;
  organizationSlug: string;
}

function ApplicationsTableContent({
  preloadedApplications,
  organizationSlug,
}: ApplicationsTableAdminWrapperProps) {
  const applications = usePreloadedQuery(preloadedApplications);

  return (
    <ApplicationsTable
      applications={applications}
      organizationSlug={organizationSlug}
      isAdmin={true}
    />
  );
}

export function ApplicationsTableAdminWrapper(
  props: ApplicationsTableAdminWrapperProps,
) {
  return (
    <Authenticated>
      <ApplicationsTableContent {...props} />
    </Authenticated>
  );
}
