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

export default function DivisionsPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // TODO: Create this query in convex/divisions.ts
  const divisions = useQuery(api.divisions.listByLeagueSlug, {
    leagueSlug: orgSlug,
  });

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Divisions</h1>
            <p className="text-muted-foreground">
              Configure divisions and their rules
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4" />
            Create Division
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Division Structure</h3>
            <p className="text-sm text-muted-foreground">
              Divisions organize teams by skill level within each category
            </p>
          </div>

          {!divisions ? (
            <div className="p-8 text-center">Loading...</div>
          ) : divisions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No divisions configured. Create your first division to get
                started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {divisions.map((division) => (
                <div
                  key={division._id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">
                          {division.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {division.displayName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {division.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Rules
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Division Levels</CardTitle>
            <CardDescription>
              Standard division hierarchy in Colombian amateur football
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">A - Super Élite</span>
                <span className="text-muted-foreground">Highest level</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">B - Élite</span>
                <span className="text-muted-foreground">High level</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">C - Metropolitana</span>
                <span className="text-muted-foreground">Mid level</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">D - Ascenso</span>
                <span className="text-muted-foreground">Entry level</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}