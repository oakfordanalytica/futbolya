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
import { DivisionForm } from "@/components/forms/DivisionForm";
import { PlusIcon } from "@heroicons/react/20/solid";

export default function DivisionsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;

  const divisions = useQuery(api.divisions.listByLeagueSlug, {
    leagueSlug: orgSlug,
  });
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

  // Validate this is a league (divisions belong to leagues)
  if (organization.type !== "league") {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Organization</CardTitle>
            <CardDescription>
              Divisions can only be managed at the league level.
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
            <h1 className="text-3xl font-bold">Divisions</h1>
            <p className="text-muted-foreground">
              Configure divisions and their competitive levels
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Division
          </Button>
        </div>

        {!divisions ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading divisions...</p>
            </CardContent>
          </Card>
        ) : divisions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No divisions found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first division to organize teams by skill level
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Division
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Division Structure</CardTitle>
                <CardDescription>
                  Divisions organize teams by skill level within each category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {divisions
                    .sort((a, b) => a.level - b.level)
                    .map((division, index) => (
                      <div
                        key={division._id}
                        className="py-4 first:pt-0 last:pb-0 hover:bg-muted/30 px-3 rounded-lg transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/${orgSlug}/admin/divisions/${division._id}`
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                              <span className="text-2xl font-bold text-primary">
                                {division.name}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                  {division.displayName}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  Level {division.level}
                                </span>
                              </div>
                              {division.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {division.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/${orgSlug}/admin/divisions/${division._id}`
                              );
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Division Levels Guide</CardTitle>
                <CardDescription>
                  Standard division hierarchy in Colombian amateur football
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">A - Super Élite</span>
                    <span className="text-muted-foreground">
                      Highest level (Level 1)
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">B - Élite</span>
                    <span className="text-muted-foreground">
                      High level (Level 2)
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">C - Metropolitana</span>
                    <span className="text-muted-foreground">
                      Mid level (Level 3)
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">D - Ascenso</span>
                    <span className="text-muted-foreground">
                      Entry level (Level 4)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DivisionForm
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          leagueId={organization._id as any}
        />
      </div>
    </Container>
  );
}