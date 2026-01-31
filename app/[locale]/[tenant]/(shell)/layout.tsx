import { auth } from "@clerk/nextjs/server";
import {
  SidebarAppSidebar,
  NavbarAppSidebar,
} from "@/components/sections/shell/organizations/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { OrgMismatchError } from "@/components/sections/shell/organizations/org-mismatch-error";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function OrgLayout({ children, params }: LayoutProps) {
  const { tenant } = await params;
  const { orgSlug } = await auth();

  // Validate that the active organization matches the URL
  // This handles the case where middleware couldn't activate the org
  // (e.g., user is not a member of the organization in the URL)
  if (orgSlug !== tenant) {
    return <OrgMismatchError urlSlug={tenant} />;
  }

  return (
    <SidebarLayout
      fullWidth
      navbar={<NavbarAppSidebar />}
      sidebar={<SidebarAppSidebar />}
    >
      <main className="flex-1">{children}</main>
    </SidebarLayout>
  );
}
