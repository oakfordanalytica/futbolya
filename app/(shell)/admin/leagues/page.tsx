"use client";

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

export default function SuperAdminLeaguesPage() {
  const leagues = useQuery(api.leagues.listAll);

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leagues</h1>
            <p className="text-muted-foreground">
              Manage all leagues in the platform
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4" />
            Create League
          </Button>
        </div>

        {!leagues ? (
          <div>Loading...</div>
        ) : leagues.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No leagues found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Card key={league._id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {league.logoUrl && (
                      <img
                        src={league.logoUrl}
                        alt={league.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>{league.name}</CardTitle>
                      <CardDescription>{league.country}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`font-medium ${
                          league.status === "active"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {league.status}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/leagues/${league._id}`}>
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