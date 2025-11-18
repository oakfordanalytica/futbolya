"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Container } from "@/components/ui/container";
import { LeagueForm } from "@/components/forms/LeagueForm";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  TrophyIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminLeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as Id<"leagues">;

  const league = useQuery(api.leagues.getById, { leagueId });
  const statistics = useQuery(api.leagues.getStats, { leagueId });

  const deleteLeague = useMutation(api.leagues.deleteLeague);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!league) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the league details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteLeague({ leagueId });
      router.push("/admin/leagues");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete league");
      setLoading(false);
    }
  };

  const statusColors = {
    active: "text-green-600 bg-green-50",
    inactive: "text-gray-600 bg-gray-50",
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/leagues")}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {league.logoUrl ? (
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {league.name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {league.name}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      statusColors[league.status]
                    }`}
                  >
                    {league.status}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {league.shortName && `${league.shortName} • `}
                  {league.country}
                  {league.region && ` • ${league.region}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${league.slug}/admin`)}
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clubs</CardTitle>
              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalClubs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics?.affiliatedClubs || 0} affiliated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalCategories || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalPlayers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered players
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Referees</CardTitle>
              <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalReferees || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Licensed referees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Invited</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.invitedClubs || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending clubs</p>
            </CardContent>
          </Card>
        </div>

        {/* League Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>League Information</CardTitle>
              <CardDescription>Basic details about the league</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="text-lg font-medium">{league.name}</p>
              </div>
              {league.shortName && (
                <div>
                  <Label className="text-muted-foreground">Short Name</Label>
                  <p className="text-lg font-medium">{league.shortName}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="text-lg font-medium font-mono">{league.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Country</Label>
                <p className="text-lg font-medium">{league.country}</p>
              </div>
              {league.region && (
                <div>
                  <Label className="text-muted-foreground">Region</Label>
                  <p className="text-lg font-medium">{league.region}</p>
                </div>
              )}
              {league.foundedYear && (
                <div>
                  <Label className="text-muted-foreground">Founded</Label>
                  <p className="text-lg font-medium">{league.foundedYear}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-lg font-medium">
                  {new Date(league._creationTime).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach the league</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {league.address && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="text-lg font-medium">{league.address}</p>
                </div>
              )}
              {league.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">{league.email}</p>
                </div>
              )}
              {league.phoneNumber && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="text-lg font-medium">{league.phoneNumber}</p>
                </div>
              )}
              {league.website && (
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <a
                    href={league.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {league.website}
                  </a>
                </div>
              )}
              {league.federationId && (
                <div>
                  <Label className="text-muted-foreground">Federation ID</Label>
                  <p className="text-lg font-medium">{league.federationId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <LeagueForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          leagueId={leagueId}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete League</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{league.name}"? This action
                cannot be undone.
                {statistics &&
                  (statistics.totalClubs > 0 ||
                    statistics.totalCategories > 0) && (
                    <span className="block mt-2 text-destructive">
                      Warning: This league has {statistics.totalClubs} club
                      {statistics.totalClubs !== 1 ? "s" : ""}. You cannot
                      delete it until all clubs and divisions are removed.
                    </span>
                  )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || (statistics && statistics.totalClubs > 0)}
              >
                {loading ? "Deleting..." : "Delete League"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}