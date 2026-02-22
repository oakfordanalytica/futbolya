import {
  SidebarAppSidebar,
  NavbarAppSidebar,
} from "@/components/sections/shell/organizations/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { OrgMismatchError } from "@/components/sections/shell/organizations/org-mismatch-error";
import { SportProvider } from "@/components/providers/sport-provider";
import { getTenantAccess } from "@/lib/auth/tenant-access";
import { getPrimaryTeamSlug } from "@/lib/auth/team-access";
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
  const { hasAccess, role } = await getTenantAccess(tenant);

  if (!hasAccess) {
    return <OrgMismatchError urlSlug={tenant} />;
  }

  if (role === "coach") {
    const coachTeamSlug = await getPrimaryTeamSlug(tenant);

    if (coachTeamSlug) {
      redirect(`${localePrefix}${TEAM_ROUTES.roster(tenant, coachTeamSlug)}`);
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        You don&apos;t have a team assigned yet.
      </div>
    );
  }

  return (
    <SportProvider sportType="basketball">
      <SidebarLayout
        fullWidth
        navbar={<NavbarAppSidebar />}
        sidebar={<SidebarAppSidebar />}
      >
        <main className="flex-1">{children}</main>
      </SidebarLayout>
    </SportProvider>
  );
}
