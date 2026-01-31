import { notFound } from "next/navigation";
import { preloadQuery } from "convex/nextjs";
import { preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth/auth";
import { ApplicationDetailWrapper } from "@/components/sections/shell/applications/detail/application-detail-wrapper";

interface PageProps {
  params: Promise<{ tenant: string; applicationId: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { tenant, applicationId } = await params;
  const token = await getAuthToken();

  const preloadedApplication = await preloadQuery(
    api.applications.getById,
    { applicationId: applicationId as Id<"applications"> },
    { token },
  );

  const application = preloadedQueryResult(preloadedApplication);

  if (application === null) {
    notFound();
  }

  return (
    <ApplicationDetailWrapper
      preloadedApplication={preloadedApplication}
      organizationSlug={tenant}
      applicationId={applicationId}
    />
  );
}
