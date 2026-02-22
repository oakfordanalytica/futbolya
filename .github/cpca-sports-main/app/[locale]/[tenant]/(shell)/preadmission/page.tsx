import CpcaHeader from "@/components/common/cpca-header";
import { PreAdmissionForm } from "@/components/sections/shell/preadmission/preadmission-form";
import { getTranslations } from "next-intl/server";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function PreadmissionPage({ params }: PageProps) {
  const { tenant } = await params;
  const token = await getAuthToken();
  const t = await getTranslations("preadmission");
  
  const preloadedOrganization = await preloadQuery(
    api.organizations.getBySlug,
    { slug: tenant },
    { token },
  );
  const organization = preloadedQueryResult(preloadedOrganization);
  
  return (
    <>
      <CpcaHeader 
        title={t("title")} 
        subtitle={t("description")} 
        logoUrl={organization?.imageUrl}
      />
      <PreAdmissionForm />
    </>
  );
}
