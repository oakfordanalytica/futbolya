"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UsersIcon,
  UserGroupIcon,
  TrophyIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as Id<"clubs">;

  const club = useQuery(api.clubs.getByIdAdmin, { clubId });
  const statistics = useQuery(api.clubs.getStatistics, { clubId });
  const categories = useQuery(api.categories.listByClubId, { clubId });
  const league = club
    ? useQuery(api.leagues.getById, { leagueId: club.leagueId })
    : undefined;

  const updateClub = useMutation(api.clubs.update);
  const deleteClub = useMutation(api.clubs.deleteClub);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    shortName: "",
    headquarters: "",
    foundedYear: "",
    website: "",
    email: "",
    phoneNumber: "",
    status: "affiliated" as "affiliated" | "invited" | "suspended",
  });

  // Set form when club loads
  if (club && editForm.name === "") {
    setEditForm({
      name: club.name,
      shortName: club.shortName || "",
      headquarters: club.headquarters || "",
      foundedYear: club.foundedYear?.toString() || "",
      website: club.website || "",
      email: club.email || "",
      phoneNumber: club.phoneNumber || "",
      status: club.status,
    });
  }

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

  const handleEdit = async () => {
    setLoading(true);
    try {
      await updateClub({
        clubId,
        name: editForm.name,
        shortName: editForm.shortName || undefined,
        headquarters: editForm.headquarters || undefined,
        foundedYear: editForm.foundedYear
          ? parseInt(editForm.foundedYear)
          : undefined,
        website: editForm.website || undefined,
        email: editForm.email || undefined,
        phoneNumber: editForm.phoneNumber || undefined,
        status: editForm.status,
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update club");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClub({ clubId });
      router.push("/admin/clubs");
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
              onClick={() => router.push("/admin/clubs")}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {club.logoUrl && (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {club.name}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      statusColors[club.status]
                    }`}
                  >
                    {statusLabels[club.status]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {club.shortName && `${club.shortName} • `}
                  <a
                    href={`/${league.slug}/admin`}
                    className="hover:underline"
                  >
                    {league.name}
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${club.slug}/admin`)}
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              View Club Dashboard
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
                <Label className="text-muted-foreground">Slug</Label>
                <p className="text-lg font-medium font-mono">{club.slug}</p>
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
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-lg font-medium">
                  {new Date(club._creationTime).toLocaleDateString()}
                </p>
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
                  router.push(`/${club.slug}/admin/categories/new`)
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
                  Add categories to organize teams
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
                      <th className="text-left p-4 font-medium">
                        Technical Director
                      </th>
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
                          {category.technicalDirectorName ? (
                            <span>{category.technicalDirectorName}</span>
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
                                `/${club.slug}/admin/categories/${category._id}`
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

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Club</DialogTitle>
              <DialogDescription>
                Update the club information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-name">
                  Club Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="e.g., Real Madrid CF"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-shortName">Short Name</Label>
                <Input
                  id="edit-shortName"
                  value={editForm.shortName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shortName: e.target.value })
                  }
                  placeholder="e.g., Real Madrid"
                />
              </div>
              <div>
                <Label htmlFor="edit-headquarters">Headquarters</Label>
                <Input
                  id="edit-headquarters"
                  value={editForm.headquarters}
                  onChange={(e) =>
                    setEditForm({ ...editForm, headquarters: e.target.value })
                  }
                  placeholder="e.g., Madrid, Spain"
                />
              </div>
              <div>
                <Label htmlFor="edit-foundedYear">Founded Year</Label>
                <Input
                  id="edit-foundedYear"
                  type="number"
                  value={editForm.foundedYear}
                  onChange={(e) =>
                    setEditForm({ ...editForm, foundedYear: e.target.value })
                  }
                  placeholder="e.g., 1902"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="e.g., contact@club.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phoneNumber: e.target.value })
                  }
                  placeholder="e.g., +1 234 567 8900"
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                  placeholder="e.g., https://club.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editForm.status}
                  onValueChange={(
                    value: "affiliated" | "invited" | "suspended"
                  ) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affiliated">Affiliated</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={loading || !editForm.name}
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