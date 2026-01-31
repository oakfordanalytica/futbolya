"use client";

import { Authenticated, Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ApplicationsTable } from "./applications-table";

interface ApplicationsTableWrapperProps {
  preloadedApplications: Preloaded<typeof api.applications.listMine>;
  organizationSlug: string;
}

function ApplicationsTableContent({
  preloadedApplications,
  organizationSlug,
}: ApplicationsTableWrapperProps) {
  const applications = usePreloadedQuery(preloadedApplications);

  return (
    <ApplicationsTable
      applications={applications}
      organizationSlug={organizationSlug}
      isAdmin={false}
    />
  );
}

export function ApplicationsTableWrapper(props: ApplicationsTableWrapperProps) {
  return (
    <Authenticated>
      <ApplicationsTableContent {...props} />
    </Authenticated>
  );
}
