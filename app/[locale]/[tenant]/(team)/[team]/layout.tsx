import { redirect } from "next/navigation";
import { getTenantAccess } from "@/lib/auth/tenant-access";
import { getAccessibleTeamSlugs } from "@/lib/auth/team-access";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";

interface TeamScopedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; tenant: string; team: string }>;
}

export default async function TeamScopedLayout({
  children,
  params,
}: TeamScopedLayoutProps) {
  const { locale, tenant, team } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  await syncCurrentUser();
  const { hasAccess, role } = await getTenantAccess(tenant);

  if (!hasAccess) {
    redirect(`${localePrefix}/${tenant}/sign-in`);
  }

  if (role === "admin" || role === "superadmin") {
    redirect(`${localePrefix}${ROUTES.org.teams.settings(tenant, team)}`);
  }

  if (role === "coach") {
    const accessibleTeamSlugs = await getAccessibleTeamSlugs(tenant);
    const fallbackTeamSlug = accessibleTeamSlugs[0];

    if (!fallbackTeamSlug) {
      redirect(`${localePrefix}/${tenant}/sign-in`);
    }

    if (!accessibleTeamSlugs.includes(team)) {
      redirect(
        `${localePrefix}${TEAM_ROUTES.roster(tenant, fallbackTeamSlug)}`,
      );
    }
  }

  return <>{children}</>;
}
