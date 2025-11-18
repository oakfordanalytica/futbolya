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
  TrophyIcon,
  UserIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const playerId = params.playerId as Id<"players">;

  const player = useQuery(api.players.getById, { playerId });
  const statistics = useQuery(api.players.getStatistics, { playerId });
  const transfers = useQuery(api.players.listTransfers, { playerId });

  const updatePlayer = useMutation(api.players.updatePlayer);
  const deletePlayer = useMutation(api.players.deletePlayer);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    position: "",
    jerseyNumber: "",
    height: "",
    weight: "",
    preferredFoot: "",
    status: "active" as "active" | "injured" | "on_loan" | "inactive",
  });

  // Set form when player loads
  if (player && editForm.position === "" && player.position) {
    setEditForm({
      position: player.position || "",
      jerseyNumber: player.jerseyNumber?.toString() || "",
      height: player.height?.toString() || "",
      weight: player.weight?.toString() || "",
      preferredFoot: player.preferredFoot || "",
      status: player.status,
    });
  }

  if (!player) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the player details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleEdit = async () => {
    setLoading(true);
    try {
      await updatePlayer({
        playerId,
        position: editForm.position
          ? (editForm.position as
              | "goalkeeper"
              | "defender"
              | "midfielder"
              | "forward")
          : undefined,
        jerseyNumber: editForm.jerseyNumber
          ? parseInt(editForm.jerseyNumber)
          : undefined,
        height: editForm.height ? parseFloat(editForm.height) : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        preferredFoot: editForm.preferredFoot
          ? (editForm.preferredFoot as "left" | "right" | "both")
          : undefined,
        status: editForm.status,
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update player");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deletePlayer({ playerId });
      router.push(`/${orgSlug}/admin/players`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete player");
      setLoading(false);
    }
  };

  const statusColors = {
    active: "text-green-600 bg-green-50",
    injured: "text-red-600 bg-red-50",
    on_loan: "text-blue-600 bg-blue-50",
    inactive: "text-gray-600 bg-gray-50",
  };

  const statusLabels = {
    active: "Active",
    injured: "Injured",
    on_loan: "On Loan",
    inactive: "Inactive",
  };

  const positionLabels = {
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    forward: "Forward",
  };

  const transferTypeLabels = {
    promotion: "Promotion",
    transfer: "Transfer",
    loan: "Loan",
    trial: "Trial",
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
              onClick={() => router.push(`/${orgSlug}/admin/players`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {player.profileData?.avatarUrl && (
                <img
                  src={player.profileData.avatarUrl}
                  alt={player.profileData.displayName || "Player"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {player.profileData?.displayName || "Unknown Player"}
                  </h1>
                  {player.jerseyNumber && (
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{player.jerseyNumber}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      statusColors[player.status]
                    }`}
                  >
                    {statusLabels[player.status]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {player.position && `${positionLabels[player.position]} • `}
                  {player.categoryData?.name}
                  {player.categoryData?.clubName &&
                    ` • ${player.categoryData.clubName}`}
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.matchesPlayed || 0}
              </div>
              <p className="text-xs text-muted-foreground">Played</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Goals</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.goalsScored || 0}
              </div>
              <p className="text-xs text-muted-foreground">Scored</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assists</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.assists || 0}
              </div>
              <p className="text-xs text-muted-foreground">Made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
              <ArrowPathIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.transfersCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">History</p>
            </CardContent>
          </Card>
        </div>

        {/* Player Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Player profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="text-lg font-medium">
                  {player.profileData?.displayName || "Unknown"}
                </p>
              </div>
              {player.profileData?.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium">
                    {player.profileData.email}
                  </p>
                </div>
              )}
              {player.profileData?.phoneNumber && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="text-lg font-medium">
                    {player.profileData.phoneNumber}
                  </p>
                </div>
              )}
              {player.profileData?.dateOfBirth && (
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="text-lg font-medium">
                    {new Date(
                      player.profileData.dateOfBirth
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              {player.nationality && (
                <div>
                  <Label className="text-muted-foreground">Nationality</Label>
                  <p className="text-lg font-medium">{player.nationality}</p>
                </div>
              )}
              {player.joinedDate && (
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="text-lg font-medium">
                    {new Date(player.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {player.trainingHours && (
                <div>
                  <Label className="text-muted-foreground">Training Hours</Label>
                  <p className="text-lg font-medium">
                    {player.trainingHours.toLocaleString()} hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Details</CardTitle>
              <CardDescription>Position and physical attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {player.position && (
                <div>
                  <Label className="text-muted-foreground">Position</Label>
                  <p className="text-lg font-medium">
                    {positionLabels[player.position]}
                  </p>
                </div>
              )}
              {player.jerseyNumber && (
                <div>
                  <Label className="text-muted-foreground">Jersey Number</Label>
                  <p className="text-lg font-medium">{player.jerseyNumber}</p>
                </div>
              )}
              {player.height && (
                <div>
                  <Label className="text-muted-foreground">Height</Label>
                  <p className="text-lg font-medium">{player.height} cm</p>
                </div>
              )}
              {player.weight && (
                <div>
                  <Label className="text-muted-foreground">Weight</Label>
                  <p className="text-lg font-medium">{player.weight} kg</p>
                </div>
              )}
              {player.preferredFoot && (
                <div>
                  <Label className="text-muted-foreground">Preferred Foot</Label>
                  <p className="text-lg font-medium capitalize">
                    {player.preferredFoot}
                  </p>
                </div>
              )}
              {player.categoryData && (
                <div>
                  <Label className="text-muted-foreground">Current Category</Label>
                  <p className="text-lg font-medium">
                    {player.categoryData.name}
                  </p>
                </div>
              )}
              {player.bloodType && (
                <div>
                  <Label className="text-muted-foreground">Blood Type</Label>
                  <p className="text-lg font-medium">{player.bloodType}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transfer History</CardTitle>
                <CardDescription>
                  {transfers?.length || 0} transfer
                  {transfers?.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!transfers || transfers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No transfers yet</p>
                <p className="text-sm mt-1">
                  Transfer history will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">From</th>
                      <th className="text-left p-4 font-medium">To</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Fee</th>
                      <th className="text-left p-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr
                        key={transfer._id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-4">
                          {new Date(transfer.transferDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">{transfer.fromCategoryName}</td>
                        <td className="p-4">{transfer.toCategoryName}</td>
                        <td className="p-4">
                          <span className="capitalize">
                            {transferTypeLabels[transfer.transferType]}
                          </span>
                        </td>
                        <td className="p-4">
                          {transfer.fee
                            ? `$${transfer.fee.toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="p-4">
                          {transfer.notes || (
                            <span className="text-muted-foreground">—</span>
                          )}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>
                Update player information and details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-position">Position</Label>
                <Select
                  value={editForm.position}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, position: value })
                  }
                >
                  <SelectTrigger id="edit-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-jerseyNumber">Jersey Number</Label>
                <Input
                  id="edit-jerseyNumber"
                  type="number"
                  value={editForm.jerseyNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, jerseyNumber: e.target.value })
                  }
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <Label htmlFor="edit-height">Height (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  step="0.1"
                  value={editForm.height}
                  onChange={(e) =>
                    setEditForm({ ...editForm, height: e.target.value })
                  }
                  placeholder="e.g., 180"
                />
              </div>
              <div>
                <Label htmlFor="edit-weight">Weight (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={editForm.weight}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weight: e.target.value })
                  }
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <Label htmlFor="edit-preferredFoot">Preferred Foot</Label>
                <Select
                  value={editForm.preferredFoot}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, preferredFoot: value })
                  }
                >
                  <SelectTrigger id="edit-preferredFoot">
                    <SelectValue placeholder="Select preferred foot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editForm.status}
                  onValueChange={(
                    value: "active" | "injured" | "on_loan" | "inactive"
                  ) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="on_loan">On Loan</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Player</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "
                {player.profileData?.displayName || "this player"}"? This action
                cannot be undone.
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
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Player"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}