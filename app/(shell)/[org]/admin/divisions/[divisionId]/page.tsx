"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function DivisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const divisionId = params.divisionId as Id<"divisions">;

  const division = useQuery(api.divisions.getById, { divisionId });
  const statistics = useQuery(api.divisions.getStatistics, { divisionId });
  const divisionEntries = useQuery(api.divisions.listByDivisionId, { divisionId });
  const league = division
    ? useQuery(api.leagues.getById, { leagueId: division.leagueId })
    : undefined;

  const updateDivision = useMutation(api.divisions.update);
  const deleteDivision = useMutation(api.divisions.deleteDivision);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    displayName: "",
    description: "",
    level: "",
  });

  // Set form when division loads
  if (division && editForm.displayName === "") {
    setEditForm({
      displayName: division.displayName,
      description: division.description || "",
      level: division.level.toString(),
    });
  }

  if (!division || !league) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the division details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleEdit = async () => {
    setLoading(true);
    try {
      await updateDivision({
        divisionId,
        displayName: editForm.displayName,
        description: editForm.description || undefined,
        level: parseInt(editForm.level),
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to update division"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDivision({ divisionId });
      router.push(`/${orgSlug}/admin/divisions`);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to delete division"
      );
      setLoading(false);
    }
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
              onClick={() => router.push(`/${orgSlug}/admin/divisions`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {division.displayName}
              </h1>
              <p className="text-muted-foreground">
                {league.name} • Level {division.level}
              </p>
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
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.teamsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered teams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.tournamentsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Using this division
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.matchesCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total matches played
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Division Information */}
        <Card>
          <CardHeader>
            <CardTitle>Division Information</CardTitle>
            <CardDescription>Details about this division</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Display Name</Label>
              <p className="text-lg font-medium">{division.displayName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Internal Name</Label>
              <p className="text-lg font-medium font-mono">{division.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Level</Label>
              <p className="text-lg font-medium">Level {division.level}</p>
            </div>
            {division.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-lg font-medium">{division.description}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">League</Label>
              <p className="text-lg font-medium">{league.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-lg font-medium">
                {new Date(division._creationTime).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Teams in Division */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Teams in Division</CardTitle>
                <CardDescription>
                  {divisionEntries?.length || 0} team{divisionEntries?.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                onClick={() =>
                  router.push(`/${orgSlug}/admin/division-entries/new?division=${divisionId}`)
                }
              >
                Add Team
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!divisionEntries || divisionEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No teams yet</p>
                <p className="text-sm mt-1">
                  Add teams to this division to start competition
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Club</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Registered</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divisionEntries.map((entry) => (
                      <tr
                        key={entry._id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {entry.clubLogoUrl && (
                              <img
                                src={entry.clubLogoUrl}
                                alt={entry.clubName}
                                className="h-6 w-6 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{entry.clubName}</span>
                          </div>
                        </td>
                        <td className="p-4">{entry.categoryName}</td>
                        <td className="p-4">
                          {new Date(entry.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/${orgSlug}/admin/categories/${entry.categoryId}`
                              )
                            }
                          >
                            View Team
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

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Division</DialogTitle>
              <DialogDescription>
                Update the division information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-displayName"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  placeholder="e.g., Primera División"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-level">
                  Level <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-level"
                  type="number"
                  min="1"
                  value={editForm.level}
                  onChange={(e) =>
                    setEditForm({ ...editForm, level: e.target.value })
                  }
                  placeholder="e.g., 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="e.g., The top tier of competition"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={
                  loading || !editForm.displayName || !editForm.level
                }
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Division</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{division.displayName}"? This
                action cannot be undone.
                {divisionEntries && divisionEntries.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This division has {divisionEntries.length} team
                    {divisionEntries.length !== 1 ? "s" : ""}. You cannot delete it
                    until all teams are removed.
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
                disabled={loading || (divisionEntries && divisionEntries.length > 0)}
              >
                {loading ? "Deleting..." : "Delete Division"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}