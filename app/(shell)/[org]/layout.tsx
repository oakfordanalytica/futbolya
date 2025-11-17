"use client";

import { SidebarAppSidebar, NavbarAppSidebar } from "@/components/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { ContextSwitcher } from "@/components/ui/context-switcher";

// We need a query to get all of a user's orgs for the switcher
// and their role in the CURRENT org for the sidebar
const useShellData = () => {
  const params = useParams();
  const orgSlug = params.org as string;

  // This new query would return { currentRole: "...", allOrgs: [...] }
  // For now, let's just mock the switcher data
  const allOrgs = useQuery(api.users.getMyOrganizations); // You'd create this query
  
  return { allOrgs, currentOrgSlug: orgSlug };
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { allOrgs, currentOrgSlug } = useShellData();

  const navbarContent = (
    <div className="flex items-center gap-4">
      {/* Pass the switcher all orgs and the current one */}
      <ContextSwitcher allOrgs={allOrgs} currentOrgSlug={currentOrgSlug} />
      <NavbarAppSidebar />
    </div>
  );

  return (
    <SidebarLayout
      navbar={navbarContent}
      sidebar={<SidebarAppSidebar />} // Sidebar would also use useShellData to render links
    >
      <main className="flex-1">{children}</main>
    </SidebarLayout>
  );
}