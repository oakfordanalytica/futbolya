"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminDashboard } from "@/components/sections/shell/admin-dashboard";

export default function OrgAdminDashboard() {
  const params = useParams();
  const orgSlug = params.org as string;

  // You'd need to determine orgType from the org data
  // For now, let's check if it's a league or club
  const league = useQuery(api.leagues.getBySlug, { slug: orgSlug });
  const club = useQuery(api.clubs.getBySlug, { slug: orgSlug });

  const orgType = league ? "league" : club ? "club" : null;
  const orgName = league?.name || club?.name;

  const stats = useQuery(
    api.dashboard.getOrgAdminStats,
    orgType ? { orgSlug, orgType } : "skip"
  );

  if (!orgType || !orgName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Organization not found</h1>
          <p className="text-muted-foreground">
            The organization you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

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
          title: "Users",
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
          title: "Users",
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