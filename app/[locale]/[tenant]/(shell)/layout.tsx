import {
  SidebarAppSidebar,
  NavbarAppSidebar,
} from "@/components/sections/shell/organizations/app-sidebar";
import { CoachTeamResolver } from "@/components/sections/shell/organizations/coach-team-resolver";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { OrgMismatchError } from "@/components/sections/shell/organizations/org-mismatch-error";
import { getTenantAccess } from "@/lib/auth/tenant-access";
import { getPrimaryTeamSlug } from "@/lib/auth/team-access";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";
import { TEAM_ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";
import { redirect } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; tenant: string }>;
}

export default async function OrgLayout({ children, params }: LayoutProps) {
  const { locale, tenant } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  await syncCurrentUser();
  const { hasAccess, role } = await getTenantAccess(tenant);

  if (!hasAccess) {
    return <OrgMismatchError urlSlug={tenant} />;
  }

  if (role === "coach") {
    const coachTeamSlug = await getPrimaryTeamSlug(tenant);

    if (coachTeamSlug) {
      redirect(`${localePrefix}${TEAM_ROUTES.roster(tenant, coachTeamSlug)}`);
    }

    return <CoachTeamResolver organizationSlug={tenant} />;
  }

  return (
    <SidebarLayout
      fullWidth
      navbar={<NavbarAppSidebar />}
      sidebar={<SidebarAppSidebar />}
    >
      <main className="flex-1 min-w-0 w-full max-w-full">{children}</main>
    </SidebarLayout>
  );
}
