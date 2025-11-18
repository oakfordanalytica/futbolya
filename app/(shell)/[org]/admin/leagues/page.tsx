"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LeagueAdminDashboard() {
  const params = useParams();
  const orgSlug = params.org as string;

  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });

  if (!organization) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the league dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  // Validate this is a league
  if (organization.type !== "league") {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Organization</CardTitle>
            <CardDescription>
              This page is only available for league organizations.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {organization.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {organization.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {organization.name}
            </h1>
            <p className="text-muted-foreground">League Dashboard</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to {organization.name}</CardTitle>
            <CardDescription>
              This is your league administration dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the navigation menu to manage clubs, divisions, referees, and
              tournaments.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}