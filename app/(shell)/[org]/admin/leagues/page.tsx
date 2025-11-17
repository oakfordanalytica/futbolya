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
import { Button } from "@/components/ui/button";

export default function LeagueAdminDashboard() {
  const params = useParams();
  const orgSlug = params.org as string;

  // Get current role to determine if League or Club admin
  const currentRole = useQuery(api.users.getMyRoleInOrg, {
    orgSlug,
    orgType: "league",
  });

  const isLeagueAdmin =
    currentRole === "SuperAdmin" || currentRole === "LeagueAdmin";
  const isClubAdmin = currentRole === "ClubAdmin";

  if (!currentRole) {
    return <div>Loading...</div>;
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isLeagueAdmin ? "League" : "Club"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            {isLeagueAdmin
              ? "Manage your league, clubs, and competitions"
              : "Manage your club, players, and staff"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* League Admin Cards */}
          {isLeagueAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Clubs</CardTitle>
                  <CardDescription>
                    Affiliated and invited clubs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">24</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`/${orgSlug}/admin/clubs`}>View all clubs →</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Divisions</CardTitle>
                  <CardDescription>Division settings and rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">4</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`/${orgSlug}/admin/divisions`}>
                        Manage divisions →
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Club Admin Cards */}
          {isClubAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                  <CardDescription>
                    Manage your club's players
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">156</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`/${orgSlug}/admin/players`}>
                        View all players →
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Staff</CardTitle>
                  <CardDescription>Technical directors and staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">12</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`/${orgSlug}/admin/staff`}>View staff →</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Common Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Age-based team categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">9</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href={`/${orgSlug}/admin/categories`}>
                    Manage categories →
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {isLeagueAdmin ? "League" : "Club"} user management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href={`/${orgSlug}/admin/users`}>Manage users →</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}