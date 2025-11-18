"use client";

import { SidebarAppSidebar, NavbarAppSidebar } from "@/components/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgSlug = params.org as string;

  const allOrgs = useQuery(api.users.getMyOrganizations);

  const navbarContent = (
    <div className="flex items-center gap-4">
      <NavbarAppSidebar />
    </div>
  );

  return (
    <SidebarLayout
      navbar={navbarContent}
      sidebar={<SidebarAppSidebar />}
    >
      <main className="flex-1">{children}</main>
    </SidebarLayout>
  );
}