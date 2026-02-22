import { SignUp } from "@clerk/nextjs";
import { isMultiTenantMode } from "@/lib/tenancy/config";
import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function TenantSignUpPage({ params }: PageProps) {
  const { locale, tenant } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const signUpProps = isMultiTenantMode()
    ? { unsafeMetadata: { pendingOrganizationSlug: tenant } }
    : {};

  return (
    <SignUp
      signInUrl={`${localePrefix}${ROUTES.tenant.auth.signIn(tenant)}`}
      forceRedirectUrl={`${localePrefix}${ROUTES.org.teams.list(tenant)}`}
      {...signUpProps}
    />
  );
}
