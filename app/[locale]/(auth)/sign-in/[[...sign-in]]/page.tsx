// ################################################################################
// # Check: 12/13/2025                                                            #
// ################################################################################

import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: PageProps) {
  const { locale } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  if (isSingleTenantMode()) {
    redirect(`${localePrefix}/${DEFAULT_TENANT_SLUG}/sign-in`);
  }

  return (
    <SignIn
      signUpUrl={`${localePrefix}${ROUTES.auth.signUp}`}
      forceRedirectUrl={`${localePrefix}${ROUTES.auth.organizations}`}
    />
  );
}
