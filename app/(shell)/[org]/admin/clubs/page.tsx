"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClubForm } from "@/components/forms/ClubForm";
import { PlusIcon } from "@heroicons/react/20/solid";

export default function LeagueClubsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;

  const clubs = useQuery(api.clubs.listByLeagueSlug, { leagueSlug: orgSlug });
  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!organization) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the organization details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  // Validate this is a league (clubs belong to leagues)
  if (organization.type !== "league") {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Organization</CardTitle>
            <CardDescription>
              Clubs can only be managed at the league level.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clubs</h1>
            <p className="text-muted-foreground">
              Manage affiliated and invited clubs
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Club
          </Button>
        </div>

        {!clubs ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading clubs...</p>
            </CardContent>
          </Card>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No clubs found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first club to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Club
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Card key={club._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {club.logoUrl ? (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {club.name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">
                        {club.name}
                      </CardTitle>
                      <CardDescription>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            club.status === "affiliated"
                              ? "text-green-600 bg-green-50"
                              : club.status === "invited"
                              ? "text-yellow-600 bg-yellow-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {club.status === "affiliated"
                            ? "Affiliated"
                            : club.status === "invited"
                            ? "Invited"
                            : "Suspended"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {club.headquarters && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium truncate ml-2">
                          {club.headquarters}
                        </span>
                      </div>
                    )}
                    {club.foundedYear && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Founded</span>
                        <span className="font-medium">{club.foundedYear}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() =>
                        router.push(`/${orgSlug}/admin/clubs/${club._id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ClubForm
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          leagueId={organization._id as any}
        />
      </div>
    </Container>
  );
}