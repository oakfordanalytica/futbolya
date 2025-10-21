// components/match-lineup-editor.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Define the structure of a player object from getWithPlayers
type PlayerWithPersona = {
  _id: Id<"jugadores">;
  persona: {
    _id: Id<"personas">;
    nombrePersona: string;
    apellidoPersona: string;
    // other persona fields...
  } | null;
  // other jugador fields...
};

// Define the structure of a lineup player from getMatchLineup
type LineupPlayer = {
    _id: Id<"jugadoresPorPartido">;
    partidoId: Id<"partidos">;
    equipoId: Id<"equipos">;
    jugadorId: Id<"jugadores">;
    rolEnPartido: "titular" | "suplente";
    numeroCamisetaPartido?: number | null | undefined;
    jugador: any; // Simplified for now
    persona: { nombrePersona: string; apellidoPersona: string } | null;
};


interface MatchLineupEditorProps {
  partidoId: Id<"partidos">;
  equipoId: Id<"equipos">;
  teamName?: string; // Optional: Pass team name for display
}

export function MatchLineupEditor({ partidoId, equipoId, teamName }: MatchLineupEditorProps) {
  // --- Convex Data ---
  const teamRosterData = useQuery(api.equipos.getWithPlayers, { id: equipoId });
  const currentLineup = useQuery(api.partidos.getMatchLineup, { partidoId });
  const partidoData = useQuery(api.partidos.getWithEvents, { id: partidoId });
  const setLineupMutation = useMutation(api.partidos.setMatchLineup);

  // --- Component State ---
  // Store selected player IDs and their roles/numbers
  const [selectedPlayers, setSelectedPlayers] = useState<Record<Id<"jugadores">, { role: 'titular' | 'suplente', number?: number | string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roster = useMemo(() => {
    if (teamRosterData !== undefined && teamRosterData !== null) {
      const rosterData = teamRosterData as Extract<typeof teamRosterData, { players: any[] }>;
      return rosterData.players?.filter(Boolean) as PlayerWithPersona[] | undefined;
    }
    return undefined;
  }, [teamRosterData]);

  // --- Effect to Initialize State from Fetched Lineup ---
   useEffect(() => {
    if (!currentLineup || !roster || !partidoData) return; // Wait for data

    const initialSelection: Record<Id<"jugadores">, { role: 'titular' | 'suplente', number?: number | string }> = {};

    const teamType = equipoId === partidoData.equipoLocalId ? "local" : "visitante";
    const teamLineup = currentLineup[teamType];

    if (teamLineup) {
        teamLineup.titulares.forEach((p: LineupPlayer) => {
            initialSelection[p.jugadorId] = { role: 'titular', number: p.numeroCamisetaPartido ?? '' };
        });
        teamLineup.suplentes.forEach((p: LineupPlayer) => {
            initialSelection[p.jugadorId] = { role: 'suplente', number: p.numeroCamisetaPartido ?? '' };
        });
    }

    setSelectedPlayers(initialSelection);

  }, [currentLineup, partidoData, equipoId, roster]);


  // --- Event Handlers ---
  const handlePlayerSelect = (playerId: Id<"jugadores">, isChecked: boolean) => {
    setSelectedPlayers(prev => {
      const newState = { ...prev };
      if (isChecked) {
        // Default to substitute if newly selected
        if (!newState[playerId]) {
          newState[playerId] = { role: 'suplente', number: '' };
        }
      } else {
        delete newState[playerId]; // Remove if unchecked
      }
      return newState;
    });
  };

  const handleRoleChange = (playerId: Id<"jugadores">, role: 'titular' | 'suplente') => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], role: role }
    }));
  };

  const handleNumberChange = (playerId: Id<"jugadores">, number: string) => {
    const numValue = number === '' ? undefined : parseInt(number, 10);
    // Basic validation: Allow empty or valid numbers
    if (number === '' || /^\d+$/.test(number)) {
         const numValue = number === '' ? undefined : parseInt(number, 10);
         // Optional: Add max number check if needed (e.g., numValue <= 99)
         if(number === '' || (numValue !== undefined && !isNaN(numValue) && numValue >= 0 /* && numValue <= 99 */)) {
            setSelectedPlayers(prev => ({
              ...prev,
              [playerId]: { ...prev[playerId], number: number } // Store string from input
            }));
         } else {
             // Optional: Provide feedback if input is invalid (e.g., negative number)
             console.warn("Invalid jersey number entered:", number);
         }
    } else {
        // Optional: Provide feedback for non-numeric input
        console.warn("Jersey number must be numeric:", number);
    }
  };

  const handleSaveLineup = async () => {
    setLoading(true);
    setError(null);
    try {
      const titulares = Object.entries(selectedPlayers)
        .filter(([, data]) => data.role === 'titular')
        .map(([jugadorId, data]) => ({
          jugadorId: jugadorId as Id<"jugadores">,
          numero: data.number === '' || data.number === undefined ? undefined : Number(data.number)
        }));

      const suplentes = Object.entries(selectedPlayers)
        .filter(([, data]) => data.role === 'suplente')
        .map(([jugadorId, data]) => ({
          jugadorId: jugadorId as Id<"jugadores">,
          numero: data.number === '' || data.number === undefined ? undefined : Number(data.number)
        }));

        // Basic validation (e.g., 11 starters) - Adjust as needed
        if (titulares.length !== 11) {
            setError("Please select exactly 11 starting players.");
            setLoading(false);
            return;
        }

      await setLineupMutation({
        partidoId,
        equipoId,
        titulares,
        suplentes
      });
      // Optionally show a success message
      alert("Lineup saved successfully!");

    } catch (err) {
      console.error("Failed to save lineup:", err);
      setError(err instanceof Error ? err.message : "Failed to save lineup");
    } finally {
      setLoading(false);
    }
  };
  
  const selectedCount = Object.keys(selectedPlayers).length;
  const starterCount = Object.values(selectedPlayers).filter(p => p.role === 'titular').length;
  const subCount = selectedCount - starterCount;


  // --- Loading/Error UI ---
  if (teamRosterData === undefined || currentLineup === undefined) {
    return <LineupEditorSkeleton teamName={teamName} />;
  }

  if (!roster) {
     return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Could not load team roster.</AlertDescription></Alert>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Lineup: {teamName || `Team ${equipoId.substring(0, 5)}...`}</CardTitle>
        <CardDescription>
            Select players from the roster and assign their role (Titular/Suplente) and jersey number for this match.
        </CardDescription>
         {error && <Alert variant="destructive" className="mt-2"><AlertDescription>{error}</AlertDescription></Alert>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm font-medium mb-2">
            Selected: {selectedCount} (Starters: {starterCount}, Subs: {subCount})
            {starterCount !== 11 && <span className="ml-2 text-destructive">(Requires 11 starters)</span>}
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 border rounded-md p-3">
          {roster.length === 0 && <p className="text-muted-foreground">No players found on this team's roster.</p>}
          {roster.map((player) => {
            const isSelected = !!selectedPlayers[player._id];
            const selectionData = selectedPlayers[player._id];
            const playerName = `${player.persona?.nombrePersona ?? ''} ${player.persona?.apellidoPersona ?? 'Unknown'}`;

            return (
              <div key={player._id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 border-b last:border-b-0">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    id={`player-${player._id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePlayerSelect(player._id, !!checked)}
                    disabled={loading}
                  />
                  <Label htmlFor={`player-${player._id}`} className="cursor-pointer">
                    {playerName}
                  </Label>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2 pl-6 sm:pl-0">
                     {/* Role Selection (Radio Buttons or Select) */}
                      <div className="flex items-center space-x-1">
                          <input
                            type="radio"
                            id={`role-${player._id}-titular`}
                            name={`role-${player._id}`}
                            value="titular"
                            checked={selectionData?.role === 'titular'}
                            onChange={() => handleRoleChange(player._id, 'titular')}
                            disabled={loading}
                            className="accent-primary"
                          />
                          <Label htmlFor={`role-${player._id}-titular`} className="text-xs cursor-pointer">Start</Label>
                      </div>
                       <div className="flex items-center space-x-1">
                          <input
                             type="radio"
                            id={`role-${player._id}-suplente`}
                            name={`role-${player._id}`}
                            value="suplente"
                            checked={selectionData?.role === 'suplente'}
                            onChange={() => handleRoleChange(player._id, 'suplente')}
                            disabled={loading}
                            className="accent-primary"
                          />
                          <Label htmlFor={`role-${player._id}-suplente`} className="text-xs cursor-pointer">Sub</Label>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="#"
                        value={selectionData?.number ?? ''}
                        onChange={(e) => handleNumberChange(player._id, e.target.value)}
                        className="w-16 h-8 text-sm"
                        disabled={loading}
                      />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Separator />
        <div className="flex justify-end">
            <Button onClick={handleSaveLineup} disabled={loading || starterCount !== 11}>
                {loading ? "Saving..." : "Save Lineup"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}


// --- Skeleton Component ---
function LineupEditorSkeleton({ teamName }: { teamName?: string }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
                 <Skeleton className="h-5 w-1/3 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 border rounded-md p-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2 border-b last:border-b-0">
                           <Skeleton className="h-5 w-5 rounded-sm" />
                           <Skeleton className="h-5 flex-1" />
                           <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>
                 <Separator />
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                </div>
            </CardContent>
        </Card>
    );
}