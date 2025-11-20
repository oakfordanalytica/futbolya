"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlayerForm } from "@/components/forms/PlayerForm";
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/20/solid";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function PlayersPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // 1. Determine Context
  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });
  const isLeague = organization?.type === "league";

  // 2. Conditional Fetching
  const clubPlayers = useQuery(api.players.listByClubSlug, !isLeague ? { clubSlug: orgSlug } : "skip");
  const leaguePlayers = useQuery(api.players.listByLeagueSlug, isLeague ? { leagueSlug: orgSlug } : "skip");

  const players = isLeague ? leaguePlayers : clubPlayers;
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ... (keep existing filter logic, just ensure it works with the slightly different data shape)
  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = !searchTerm || player.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    // Add logic to search by club name if in league view
    const matchesClub = isLeague ? (player as any).clubName.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return (matchesSearch || matchesClub);
  });

  if (!organization) return <Container className="py-8">Loading...</Container>;

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isLeague ? "League Registry" : "Club Roster"}
            </h1>
            <p className="text-muted-foreground">
              {isLeague 
                ? "Master list of all players registered in affiliated clubs" 
                : "Manage your players and category assignments"}
            </p>
          </div>
          
          {/* Only Clubs can Create Players */}
          {!isLeague && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Players Directory</CardTitle>
            {isLeague && <CardDescription>Viewing records from all clubs</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isLeague ? "Search by player or club..." : "Search by name..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {!filteredPlayers ? (
              <div className="py-8 text-center">Loading...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No players found</div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-4 font-medium">Player</th>
                      {isLeague && <th className="p-4 font-medium">Club</th>}
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Position</th>
                      <th className="p-4 font-medium">Status</th>
                      {!isLeague && <th className="p-4 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
                      <tr key={player._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar Logic */}
                            <div className="font-medium">{player.fullName}</div>
                          </div>
                        </td>
                        
                        {isLeague && (
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                              {(player as any).clubName}
                            </div>
                          </td>
                        )}

                        <td className="p-4">{player.categoryName || "—"}</td>
                        <td className="p-4 capitalize">{player.position || "—"}</td>
                        <td className="p-4">
                           {/* Status Badge Logic */}
                           <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:text-black">
                             {player.status}
                           </span>
                        </td>

                        {!isLeague && (
                          <td className="p-4">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${orgSlug}/admin/players/${player._id}`}>
                                Manage
                              </Link>
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {!isLeague && (
          <PlayerForm
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            clubSlug={orgSlug}
          />
        )}
      </div>
    </Container>
  );
}