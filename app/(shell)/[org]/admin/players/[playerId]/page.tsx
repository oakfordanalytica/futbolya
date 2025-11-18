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
import { PlayerForm } from "@/components/forms/PlayerForm";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  UserIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const playerId = params.playerId as Id<"players">;

  const player = useQuery(api.players.getById, { playerId });
  const statistics = useQuery(api.players.getStatistics, { playerId });
  const transfers = useQuery(api.players.listTransfers, { playerId });

  const deletePlayer = useMutation(api.players.deletePlayer);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
              {player.profileData?.avatarUrl ? (
                <img
                  src={player.profileData.avatarUrl}
                  alt={player.profileData.displayName || "Player"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {player.profileData?.displayName?.[0]?.toUpperCase() || "P"}
                  </span>
                </div>
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
              {/* ...existing code... */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Details</CardTitle>
              <CardDescription>Position and physical attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ...existing code... */}
            </CardContent>
          </Card>
        </div>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>
              {transfers?.length || 0} transfer
              {transfers?.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ...existing code... */}
          </CardContent>
        </Card>

        {/* Edit Dialog - Now using shared PlayerForm */}
        <PlayerForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          clubSlug={orgSlug}
          playerId={playerId}
        />

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