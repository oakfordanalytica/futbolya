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
import { CategoryForm } from "@/components/forms/CategoryForm";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const categoryId = params.categoryId as Id<"categories">;

  const category = useQuery(api.categories.getById, { categoryId });
  const players = useQuery(api.players.listByCategoryId, { categoryId });
  const club = category
    ? useQuery(api.clubs.getById, { clubId: category.clubId })
    : undefined;

  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!category || !club) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the category details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCategory({ categoryId });
      router.push(`/${orgSlug}/admin/categories`);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to delete category"
      );
      setLoading(false);
    }
  };

  const statusColors = {
    active: "text-green-600 bg-green-50",
    inactive: "text-gray-600 bg-gray-50",
  };

  const playerStatusColors = {
    active: "text-green-600 bg-green-50",
    injured: "text-red-600 bg-red-50",
    on_loan: "text-blue-600 bg-blue-50",
    inactive: "text-gray-600 bg-gray-50",
  };

  const positionLabels = {
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    forward: "Forward",
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
              onClick={() => router.push(`/${orgSlug}/admin/categories`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {category.name}
              </h1>
              <p className="text-muted-foreground">
                {category.ageGroup} • {category.gender} •{" "}
                {players?.length || 0} Players
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

        {/* Category Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
              <CardDescription>Details about this category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{category.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Age Group</Label>
                <p className="text-lg font-medium">{category.ageGroup}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Gender</Label>
                <p className="text-lg font-medium capitalize">
                  {category.gender}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    statusColors[category.status]
                  }`}
                >
                  {category.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Club and staff information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Club</Label>
                <div className="flex items-center gap-2 mt-1">
                  {club.logoUrl && (
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="h-6 w-6 rounded object-cover"
                    />
                  )}
                  <p className="text-lg font-medium">{club.name}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Technical Director
                </Label>
                {category.technicalDirectorId ? (
                  <p className="text-lg font-medium">Assigned</p>
                ) : (
                  <p className="text-muted-foreground">Not assigned</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-lg font-medium">
                  {new Date(category._creationTime).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Players</CardTitle>
                <CardDescription>
                  {players?.length || 0} player{players?.length !== 1 ? "s" : ""}{" "}
                  registered
                </CardDescription>
              </div>
              <Button
                onClick={() =>
                  router.push(`/${orgSlug}/admin/players/new?category=${categoryId}`)
                }
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!players || players.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No players yet</p>
                <p className="text-sm mt-1">
                  Add players to this category to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Player</th>
                      <th className="text-left p-4 font-medium">Jersey #</th>
                      <th className="text-left p-4 font-medium">Position</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Age</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => {
                      const age = player.dateOfBirth
                        ? Math.floor(
                            (Date.now() -
                              new Date(player.dateOfBirth).getTime()) /
                              (365.25 * 24 * 60 * 60 * 1000)
                          )
                        : undefined;

                      return (
                        <tr
                          key={player._id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {player.avatarUrl ? (
                                <img
                                  src={player.avatarUrl}
                                  alt={player.fullName}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                  {player.fullName[0]?.toUpperCase() || "?"}
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {player.fullName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {player.jerseyNumber || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            {player.position ? (
                              <span>
                                {positionLabels[player.position]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                playerStatusColors[player.status]
                              }`}
                            >
                              {player.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4">
                            {age ? (
                              <span>{age} years</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/${orgSlug}/admin/players/${player._id}`
                                )
                              }
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog - Now using shared CategoryForm */}
        <CategoryForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          clubId={category.clubId}
          categoryId={categoryId}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{category.name}"? This action
                cannot be undone.
                {players && players.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This category has {players.length} active player
                    {players.length !== 1 ? "s" : ""}. You cannot delete it
                    until all players are moved to another category.
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
                disabled={loading || (players && players.length > 0)}
              >
                {loading ? "Deleting..." : "Delete Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}