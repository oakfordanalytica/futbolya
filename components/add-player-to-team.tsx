// components/add-player-to-team.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AddPlayerToTeamProps {
  equipoId: Id<"equipos">;
  teamName?: string; // Optional for display
  // Callback to potentially refresh the team roster view after adding a player
  onPlayerAdded?: () => void;
}

// Type for players listed in the dropdown
type AvailablePlayer = {
    _id: Id<"jugadores">;
    persona: { nombrePersona: string; apellidoPersona: string; } | null;
}

export function AddPlayerToTeam({ equipoId, teamName, onPlayerAdded }: AddPlayerToTeamProps) {
  // --- Component State ---
  const [selectedPlayerId, setSelectedPlayerId] = useState<Id<"jugadores"> | "">("");
  const [jerseyNumber, setJerseyNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Convex Data ---
  const addPlayerMutation = useMutation(api.equipos.addPlayer);
  // Fetch ALL players to find ones not yet on the team
  const allPlayers = useQuery(api.jugadores.listWithPersonas);
  // Fetch the current team roster to filter the list
  const teamData = useQuery(api.equipos.getWithPlayers, { id: equipoId });

  // --- Derived Data: Filter available players ---
  const availablePlayers = useMemo(() => {
    if (!allPlayers || teamData === undefined || teamData === null || !teamData.players) {
        return [];
    }
    // Assert the type after the check
    const currentRoster = teamData as Extract<typeof teamData, { players: any[] }>;

    const playersOnTeamIds = new Set(currentRoster.players.map(p => p?._id).filter(Boolean));

    return allPlayers.filter(player =>
        player?.persona && !playersOnTeamIds.has(player._id)
    );
  }, [allPlayers, teamData]);


  // --- Event Handlers ---
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setError("Please select a player to add.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const numValue = jerseyNumber.trim() === '' ? undefined : parseInt(jerseyNumber.trim(), 10);
    if (jerseyNumber.trim() !== '' && (numValue === undefined || isNaN(numValue) || numValue < 0)) {
        setError("Jersey number must be a non-negative number if provided.");
        setLoading(false);
        return;
    }


    try {
      await addPlayerMutation({
        equipoId: equipoId,
        jugadorId: selectedPlayerId,
        numeroCamiseta: numValue,
      });

      setSuccessMessage("Player added successfully!");
      setSelectedPlayerId("");
      setJerseyNumber("");
      // Call the callback if provided, e.g., to refetch roster data in parent
      onPlayerAdded?.();

      // Clear success message after a delay
       setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error("Error adding player:", err);
      setError(err instanceof Error ? err.message : "Failed to add player to team.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
   const isLoadingData = allPlayers === undefined || teamData === undefined;

  return (
    <Card>
        <CardHeader>
            <CardTitle>Add Player to {teamName || "Team"}</CardTitle>
            <CardDescription>Select an available player and optionally assign a jersey number.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoadingData ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
             ) : (
                <form onSubmit={handleAddPlayer} className="space-y-4">
                     {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                     {successMessage && <Alert variant="default" className="bg-green-100 border-green-300 text-green-800"><AlertDescription>{successMessage}</AlertDescription></Alert>}

                    <div className="grid gap-2">
                        <Label htmlFor="player-select">Available Players *</Label>
                        <Select
                            value={selectedPlayerId}
                            onValueChange={(value) => setSelectedPlayerId(value as Id<"jugadores">)}
                            required
                            disabled={loading || availablePlayers.length === 0}
                        >
                            <SelectTrigger id="player-select">
                                <SelectValue placeholder={availablePlayers.length > 0 ? "Select player..." : "No available players"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePlayers.map((player) => (
                                    <SelectItem key={player._id} value={player._id}>
                                        {player.persona?.nombrePersona} {player.persona?.apellidoPersona}
                                    </SelectItem>
                                ))}
                                {availablePlayers.length === 0 && allPlayers && teamData && (
                                     <SelectItem value="none" disabled>All players are on this team.</SelectItem>
                                )}
                                 {availablePlayers.length === 0 && (!allPlayers || !teamData) && (
                                     <SelectItem value="loading" disabled>Loading players...</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2 w-full sm:w-1/3">
                        <Label htmlFor="jersey-number">Jersey Number (Optional)</Label>
                        <Input
                            id="jersey-number"
                            type="number"
                            min="0"
                            value={jerseyNumber}
                            onChange={(e) => setJerseyNumber(e.target.value)}
                            placeholder="e.g., 10"
                            disabled={loading}
                        />
                    </div>

                    <Button type="submit" disabled={loading || !selectedPlayerId}>
                        {loading ? "Adding..." : "Add Player to Roster"}
                    </Button>
                </form>
             )}
        </CardContent>
    </Card>
  );
}