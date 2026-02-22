import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function TenantSignInPage({ params }: PageProps) {
  const { locale, tenant } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return (
    <SignIn
      signUpUrl={`${localePrefix}${ROUTES.tenant.auth.signUp(tenant)}`}
      forceRedirectUrl={`${localePrefix}${ROUTES.org.teams.list(tenant)}`}
    />
  );
}
