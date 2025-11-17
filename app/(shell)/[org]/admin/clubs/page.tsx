"use client";

import { useParams } from "next/navigation";
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
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function LeagueClubsPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  const clubs = useQuery(api.clubs.listByLeagueSlug, { leagueSlug: orgSlug });

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
          <Button>
            <PlusIcon className="h-4 w-4" />
            Add Club
          </Button>
        </div>

        {!clubs ? (
          <div>Loading...</div>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No clubs found. Start by adding your first club.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Card key={club._id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {club.logoUrl && (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>{club.name}</CardTitle>
                      <CardDescription>
                        {club.status === "affiliated"
                          ? "Affiliated Club"
                          : club.status === "invited"
                          ? "Invited Club"
                          : "Suspended"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {club.headquarters && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Headquarters
                        </span>
                        <span className="font-medium">{club.headquarters}</span>
                      </div>
                    )}
                    {club.foundedYear && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Founded</span>
                        <span className="font-medium">{club.foundedYear}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`font-medium capitalize ${
                          club.status === "affiliated"
                            ? "text-green-600"
                            : club.status === "invited"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {club.status}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/${orgSlug}/admin/clubs/${club.slug}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}