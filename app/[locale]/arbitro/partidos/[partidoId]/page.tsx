// app/[locale]/arbitro/partidos/[partidoId]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For errors

// Icons (Example)
import { /*FutbolIcon, PersonStandingIcon,*/ ClockIcon } from 'lucide-react'; // Placeholder icons - install lucide-react if not already

// Type for player selection (adjust based on actual data structure if needed)
type Player = {
  _id: Id<"jugadores">;
  persona: { nombrePersona: string; apellidoPersona: string; } | null;
  // Add numeroCamiseta if available directly or fetched separately
};

export default function RefereeMatchPage() {
  const params = useParams();
  const partidoId = params.partidoId as Id<"partidos">;

  // --- Data Fetching ---
  const matchData = useQuery(api.partidos.getWithEvents, { id: partidoId });
  const updateScore = useMutation(api.partidos.updateScore);
  const addEvent = useMutation(api.partidos.addEvent);

  // --- Component State ---
  const [minute, setMinute] = useState<number | string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeamForEvent, setSelectedTeamForEvent] = useState<"local" | "visitante" | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [eventTypeToLog, setEventTypeToLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Loading and Error Handling ---
  if (matchData === undefined) {
    return <RefereeMatchPageSkeleton />; // Show skeleton loader
  }

  if (matchData === null) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Match not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Event Handlers ---
  const handleScoreUpdate = async (local: number, visitor: number) => {
    setLoading(true);
    setError(null);
    try {
      await updateScore({
        partidoId,
        golesLocal: local,
        golesVisitante: visitor,
      });
    } catch (err) {
      console.error("Failed to update score:", err);
      setError(err instanceof Error ? err.message : "Failed to update score");
    } finally {
      setLoading(false);
    }
  };

  const openPlayerDialog = (eventType: string, team: "local" | "visitante") => {
    // Basic validation: Check if minute is entered
    if (minute === "" || isNaN(Number(minute)) || Number(minute) < 0) {
        alert("Please enter a valid minute for the event.");
        return;
    }
    setEventTypeToLog(eventType);
    setSelectedTeamForEvent(team);
    setSelectedPlayer(null); // Reset selection
    setIsPlayerDialogOpen(true);
  };

 const handleLogEvent = async () => {
    if (!eventTypeToLog || !selectedTeamForEvent || minute === "" || isNaN(Number(minute))) return;
    // For events requiring a player, ensure one is selected
    if (["Gol", "Tarjeta Amarilla", "Tarjeta Roja"].includes(eventTypeToLog) && !selectedPlayer) {
        alert("Please select a player for this event.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        await addEvent({
            partidoId,
            tipoEvento: eventTypeToLog as any, // Cast for now, use validator type if possible
            minuto: Number(minute),
            equipo: selectedTeamForEvent,
            jugadorId: selectedPlayer?._id, // Only include if a player is selected
            // Add jugadorSustituidoId logic for substitutions later
        });

        // If it was a goal, also update the main score
        if (eventTypeToLog === "Gol") {
            const currentLocal = matchData.golesLocal ?? 0;
            const currentVisitor = matchData.golesVisitante ?? 0;
            await updateScore({
                partidoId,
                golesLocal: selectedTeamForEvent === 'local' ? currentLocal + 1 : currentLocal,
                golesVisitante: selectedTeamForEvent === 'visitante' ? currentVisitor + 1 : currentVisitor,
            });
        }

        // Reset state after logging
        setIsPlayerDialogOpen(false);
        setSelectedPlayer(null);
        // setMinute(""); // Optional: Clear minute after each event?
        setEventTypeToLog(null);
        setSelectedTeamForEvent(null);

    } catch (err) {
        console.error("Failed to log event:", err);
        setError(err instanceof Error ? err.message : "Failed to log event");
        // Keep dialog open on error?
    } finally {
        setLoading(false);
    }
 };


  // --- Render Logic ---
  const { equipoLocal, equipoVisitante, golesLocal, golesVisitante, events } = matchData;

  // TODO: Need to fetch player lists for selection dialog
  // This might require a separate query or enhancing getWithEvents
  const localPlayers: Player[] = []; // Placeholder - Fetch actual players
  const visitorPlayers: Player[] = []; // Placeholder - Fetch actual players
  const playersForDialog = selectedTeamForEvent === 'local' ? localPlayers : visitorPlayers;


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {error && (
         <Alert variant="destructive">
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {/* Scoreboard */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <span>{equipoLocal?.nombre ?? "Local"}</span>
            <span className="mx-4">{golesLocal ?? 0} - {golesVisitante ?? 0}</span>
            <span>{equipoVisitante?.nombre ?? "Visitor"}</span>
          </CardTitle>
          {/* Add Timer Display Here Later */}
        </CardHeader>
      </Card>

      {/* Event Logging Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Log Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="minute" className="w-16">Minute:</Label>
            <Input
              id="minute"
              type="number"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="e.g., 42"
              className="w-24"
              min="0"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Example Event Buttons */}
            <Button variant="outline" onClick={() => openPlayerDialog("Gol", "local")} disabled={loading || minute === ""}>Goal (Local)</Button>
            <Button variant="outline" onClick={() => openPlayerDialog("Gol", "visitante")} disabled={loading || minute === ""}>Goal (Visitor)</Button>
            <Button variant="outline" onClick={() => openPlayerDialog("Tarjeta Amarilla", "local")} disabled={loading || minute === ""}>Yellow Card (Local)</Button>
            <Button variant="outline" onClick={() => openPlayerDialog("Tarjeta Amarilla", "visitante")} disabled={loading || minute === ""}>Yellow Card (Visitor)</Button>
             <Button variant="destructive" onClick={() => openPlayerDialog("Tarjeta Roja", "local")} disabled={loading || minute === ""}>Red Card (Local)</Button>
            <Button variant="destructive" onClick={() => openPlayerDialog("Tarjeta Roja", "visitante")} disabled={loading || minute === ""}>Red Card (Visitor)</Button>
            {/* Add more buttons for Substitution, Start/End Match etc. */}
          </div>
        </CardContent>
      </Card>

      {/* Live Event Feed (Optional for Referee, but useful) */}
      <Card>
          <CardHeader>
              <CardTitle>Event Log</CardTitle>
          </CardHeader>
          <CardContent>
              {events && events.length > 0 ? (
                  <ul className="space-y-2">
                      {events.sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0)).map((event) => (
                          <li key={event._id} className="text-sm flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium w-8 text-right">{event.minuto}'</span>
                              <span>{event.tipoEvento} - {event.equipo}</span>
                              {/* TODO: Display player name if available */}
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-muted-foreground">No events logged yet.</p>
              )}
          </CardContent>
      </Card>

      {/* Player Selection Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Player for {eventTypeToLog}</DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 py-4">
            {playersForDialog.length > 0 ? (
              playersForDialog.map((player) => (
                <Button
                  key={player._id}
                  variant={selectedPlayer?._id === player._id ? "default" : "outline"}
                  onClick={() => setSelectedPlayer(player)}
                  className="w-full justify-start"
                >
                  {/* Add Number if available */}
                  {player.persona?.nombrePersona} {player.persona?.apellidoPersona}
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground">No players loaded for this team.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleLogEvent} disabled={loading || (["Gol", "Tarjeta Amarilla", "Tarjeta Roja"].includes(eventTypeToLog || "") && !selectedPlayer)}>
              {loading ? "Logging..." : "Log Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Skeleton Component ---
function RefereeMatchPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Scoreboard Skeleton */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <Skeleton className="h-8 w-1/4 inline-block" />
            <span className="mx-4"><Skeleton className="h-8 w-16 inline-block" /></span>
            <Skeleton className="h-8 w-1/4 inline-block" />
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Event Logging Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </CardContent>
      </Card>

        {/* Event Log Skeleton */}
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-24" /></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}