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

export default function SuperAdminClubsPage() {
  const clubs = useQuery(api.clubs.listAll);

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clubs</h1>
            <p className="text-muted-foreground">
              Manage all registered clubs
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4" />
            Create Club
          </Button>
        </div>

        {!clubs ? (
          <div>Loading...</div>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No clubs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club: any) => (
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
                        NIT: {club.nit || "N/A"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">League</span>
                      <span className="font-medium">
                        {club.leagueName || "Not affiliated"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`font-medium ${
                          club.status === "active"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {club.status}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/clubs/${club._id}`}>
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