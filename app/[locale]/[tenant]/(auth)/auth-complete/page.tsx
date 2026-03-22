import { routing } from "@/i18n/routing";
import { TenantAuthCompleteClient } from "./tenant-auth-complete-client";

interface PageProps {
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function TenantAuthCompletePage({ params }: PageProps) {
  const { locale, tenant } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return (
    <TenantAuthCompleteClient tenant={tenant} localePrefix={localePrefix} />
  );
}
