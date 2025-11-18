"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerForm } from "@/components/forms/PlayerForm";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

type PlayerFilter = "all" | "active" | "injured" | "on_loan" | "inactive";
type PositionFilter = "all" | "goalkeeper" | "defender" | "midfielder" | "forward";

export default function PlayersPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;

  const players = useQuery(api.players.listByClubSlug, { clubSlug: orgSlug });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlayerFilter>("all");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("all");

  // Filter players
  const filteredPlayers = players?.filter((player) => {
    const matchesSearch =
      !searchTerm ||
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || player.status === statusFilter;

    const matchesPosition =
      positionFilter === "all" || player.position === positionFilter;

    return matchesSearch && matchesStatus && matchesPosition;
  });

  const stats = {
    total: players?.length || 0,
    active: players?.filter((p) => p.status === "active").length || 0,
    injured: players?.filter((p) => p.status === "injured").length || 0,
    onLoan: players?.filter((p) => p.status === "on_loan").length || 0,
  };

  const positionLabels = {
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    forward: "Forward",
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

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground">
              Manage your club's player roster
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Ready to play</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Injured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.injured}
              </div>
              <p className="text-xs text-muted-foreground">In recovery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.onLoan}
              </div>
              <p className="text-xs text-muted-foreground">Temporary transfer</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Players</CardTitle>
            <CardDescription>Search and filter players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-[160px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value: PlayerFilter) =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="on_loan">On Loan</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[160px]">
                <Select
                  value={positionFilter}
                  onValueChange={(value: PositionFilter) =>
                    setPositionFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!filteredPlayers ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading players...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No players found</p>
                <p className="text-sm mt-1">
                  {searchTerm || statusFilter !== "all" || positionFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first player to get started"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Player</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Position</th>
                      <th className="text-left p-4 font-medium">Jersey #</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
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
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {player.fullName[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {player.fullName}
                              </div>
                              {player.dateOfBirth && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(
                                    player.dateOfBirth
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{player.categoryName || "—"}</td>
                        <td className="p-4">
                          {player.position
                            ? positionLabels[player.position]
                            : "—"}
                        </td>
                        <td className="p-4">
                          {player.jerseyNumber || "—"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              statusColors[player.status]
                            }`}
                          >
                            {statusLabels[player.status]}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/${orgSlug}/admin/players/${player._id}`}
                            >
                              View Details
                            </Link>
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

        <PlayerForm
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          clubSlug={orgSlug}
        />
      </div>
    </Container>
  );
}