"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminDashboard } from "@/components/sections/shell/admin-dashboard";

export default function OrgAdminDashboard() {
  const params = useParams();
  const orgSlug = params.org as string;

  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });
  const stats = useQuery(
    api.dashboard.getOrgAdminStats,
    organization ? { orgSlug, orgType: organization.type } : "skip"
  );

  if (organization === undefined) {
    return (
      <div className="p-8 space-y-8">
         <div className="space-y-2">
            <div className="h-8 w-64 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted/50 rounded animate-pulse" />
         </div>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
         </div>
      </div>
    );
  }

  if (organization === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Organization not found</h1>
          <p className="text-muted-foreground">
            The organization "{orgSlug}" does not exist or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  // 5. RENDER DASHBOARD
  const orgType = organization.type;
  const orgName = organization.name;
  const isLeague = orgType === "league";

  const links = isLeague
    ? [
        {
          title: "Clubs",
          description: "Manage affiliated clubs",
          stat: stats?.totalClubs,
          href: `/${orgSlug}/admin/clubs`,
          linkText: "View clubs",
        },
        {
          title: "Categories",
          description: "All categories across clubs",
          stat: stats?.totalCategories,
          href: `/${orgSlug}/admin/categories`,
          linkText: "View categories",
        },
        {
          title: "Players",
          description: "All registered players",
          stat: stats?.totalPlayers,
          href: `/${orgSlug}/admin/players`,
          linkText: "View players",
        },
        {
          title: "Referees",
          description: "League referees",
          href: `/${orgSlug}/admin/referees`,
          linkText: "Manage referees",
        },
        {
          title: "Tournaments",
          description: "League tournaments",
          href: `/${orgSlug}/admin/tournaments`,
          linkText: "Manage tournaments",
        },
        {
          title: "Admin Users",
          description: "League administrators",
          stat: stats?.totalStaff,
          href: `/${orgSlug}/admin/users`,
          linkText: "Manage users",
        },
      ]
    : [
        {
          title: "Categories",
          description: "Manage your categories",
          stat: stats?.totalCategories,
          href: `/${orgSlug}/admin/categories`,
          linkText: "View categories",
        },
        {
          title: "Players",
          description: "Club players",
          stat: stats?.totalPlayers,
          href: `/${orgSlug}/admin/players`,
          linkText: "View players",
        },
        {
          title: "Staff",
          description: "Technical directors and coaches",
          stat: stats?.totalStaff,
          href: `/${orgSlug}/admin/staff`,
          linkText: "Manage staff",
        },
        {
          title: "Admin Users",
          description: "Club administrators",
          href: `/${orgSlug}/admin/users`,
          linkText: "Manage users",
        },
      ];

  return (
    <AdminDashboard
      title={`${orgName} Dashboard`}
      description={`Manage ${isLeague ? "league" : "club"} operations`}
      links={links}
      loading={!stats}
    />
  );
}