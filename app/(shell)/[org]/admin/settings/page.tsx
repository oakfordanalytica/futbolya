"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LeagueDetailView } from "@/components/sections/shell/league/league-detail-view";
import { ClubDetailView } from "@/components/sections/shell/club/club-detail-view";
import { Id } from "@/convex/_generated/dataModel";

export default function SettingsPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // 1. Identify the Organization
  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });

  if (organization === undefined) {
    return (
      <Container className="py-8">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse mb-4" />
        <div className="h-64 w-full bg-muted/50 rounded animate-pulse" />
      </Container>
    );
  }

  if (organization === null) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization "{orgSlug}" does not exist or you do not have access.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your {organization.type} profile and configurations.
        </p>
      </div>

      {organization.type === "league" ? (
        <LeagueDetailView 
          leagueId={organization._id as Id<"leagues">} 
          // No backUrl means no back button, perfect for a tab
        />
      ) : (
        <ClubDetailView 
          clubId={organization._id as Id<"clubs">}
          // No backUrl means no back button
        />
      )}
    </Container>
  );
}