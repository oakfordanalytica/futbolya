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
import { ClubForm } from "@/components/forms/ClubForm";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const clubId = params.clubId as Id<"clubs">;

  const club = useQuery(api.clubs.getById, { clubId });
  const statistics = useQuery(api.clubs.getStatistics, { clubId });
  const categories = useQuery(api.categories.listByClubId, { clubId });
  const league = club
    ? useQuery(api.leagues.getById, { leagueId: club.leagueId })
    : undefined;

  const deleteClub = useMutation(api.clubs.deleteClub);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!club || !league) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the club details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClub({ clubId });
      router.push(`/${orgSlug}/admin/clubs`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete club");
      setLoading(false);
    }
  };

  const statusColors = {
    affiliated: "text-green-600 bg-green-50",
    invited: "text-yellow-600 bg-yellow-50",
    suspended: "text-red-600 bg-red-50",
  };

  const statusLabels = {
    affiliated: "Affiliated",
    invited: "Invited",
    suspended: "Suspended",
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
              onClick={() => router.push(`/${orgSlug}/admin/clubs`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {club.name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {club.name}
                </h1>
                <p className="text-muted-foreground">
                  {club.shortName && `${club.shortName} • `}
                  {league.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.categoriesCount || 0}
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
                {statistics?.playersCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered players
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.staffCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Staff members</p>
            </CardContent>
          </Card>
        </div>

        {/* Club Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
              <CardDescription>Basic details about the club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="text-lg font-medium">{club.name}</p>
              </div>
              {club.shortName && (
                <div>
                  <Label className="text-muted-foreground">Short Name</Label>
                  <p className="text-lg font-medium">{club.shortName}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      statusColors[club.status]
                    }`}
                  >
                    {statusLabels[club.status]}
                  </span>
                </div>
              </div>
              {club.foundedYear && (
                <div>
                  <Label className="text-muted-foreground">Founded</Label>
                  <p className="text-lg font-medium">{club.foundedYear}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">League</Label>
                <p className="text-lg font-medium">{league.name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach the club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {club.headquarters && (
                <div>
                  <Label className="text-muted-foreground">Headquarters</Label>
                  <p className="text-lg font-medium">{club.headquarters}</p>
                </div>
              )}
              {club.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">{club.email}</p>
                </div>
              )}
              {club.phoneNumber && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="text-lg font-medium">{club.phoneNumber}</p>
                </div>
              )}
              {club.website && (
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {club.website}
                  </a>
                </div>
              )}
              {club.taxId && (
                <div>
                  <Label className="text-muted-foreground">Tax ID</Label>
                  <p className="text-lg font-medium">{club.taxId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  {categories?.length || 0} categor
                  {categories?.length !== 1 ? "ies" : "y"}
                </CardDescription>
              </div>
              <Button
                onClick={() =>
                  router.push(`/${orgSlug}/admin/categories`)
                }
              >
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!categories || categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No categories yet</p>
                <p className="text-sm mt-1">
                  Add categories to organize your teams
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Age Group</th>
                      <th className="text-left p-4 font-medium">Gender</th>
                      <th className="text-left p-4 font-medium">Players</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category._id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-4">
                          <div className="font-medium">{category.name}</div>
                        </td>
                        <td className="p-4">{category.ageGroup}</td>
                        <td className="p-4 capitalize">{category.gender}</td>
                        <td className="p-4">{category.playerCount}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              category.status === "active"
                                ? "text-green-600 bg-green-50"
                                : "text-gray-600 bg-gray-50"
                            }`}
                          >
                            {category.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/${orgSlug}/admin/categories/${category._id}`
                              )
                            }
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog - Now using shared ClubForm */}
        <ClubForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          leagueId={club.leagueId}
          clubId={clubId}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Club</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{club.name}"? This action
                cannot be undone.
                {categories && categories.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This club has {categories.length} categor
                    {categories.length !== 1 ? "ies" : "y"}. You cannot delete
                    it until all categories are removed.
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
                disabled={loading || (categories && categories.length > 0)}
              >
                {loading ? "Deleting..." : "Delete Club"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}