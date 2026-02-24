import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";
import Image from "next/image";

interface PageProps {
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function TenantSignInPage({ params }: PageProps) {
  const { locale, tenant } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return (
    <div className="flex flex-col items-center gap-8">
      <Image
        src="/logo_color.png"
        alt="NISAA"
        width={280}
        height={140}
        className="h-auto w-56"
        priority
      />
      <SignIn
        signUpUrl={`${localePrefix}${ROUTES.tenant.auth.signUp(tenant)}`}
        forceRedirectUrl={`${localePrefix}${ROUTES.org.teams.list(tenant)}`}
      />
    </div>
  );
}
