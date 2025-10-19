// app/[locale]/partidos/[partidoId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // For event log

// Icons
import { ClockIcon } from 'lucide-react';

export default function SpectatorMatchPage() {
  const params = useParams();
  const partidoId = params.partidoId as Id<"partidos">;

  // --- Data Fetching ---
  // This automatically stays up-to-date!
  const matchData = useQuery(api.partidos.getWithEvents, { id: partidoId });

  // --- Loading and Error Handling ---
  if (matchData === undefined) {
    return <SpectatorMatchPageSkeleton />; // Show skeleton loader
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

  // --- Render Logic ---
  const { equipoLocal, equipoVisitante, golesLocal, golesVisitante, events } = matchData;

   // Sort events by minute for display
  const sortedEvents = events?.sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0)) || [];


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Scoreboard */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center space-x-4">
            {/* TODO: Add Team Logos if available */}
            <span className="flex-1 text-right truncate">{equipoLocal?.nombre ?? "Local"}</span>
            <span className="tabular-nums">{golesLocal ?? 0} - {golesVisitante ?? 0}</span>
            <span className="flex-1 text-left truncate">{equipoVisitante?.nombre ?? "Visitor"}</span>
          </CardTitle>
          {/* Add Live Timer/Status Display Here Later */}
          <p className="text-sm text-muted-foreground">Live</p>
        </CardHeader>
      </Card>

      {/* Live Event Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length > 0 ? (
            <Table>
              {/* <TableHeader>
                 <TableRow>
                   <TableHead className="w-16">Min</TableHead>
                   <TableHead>Event</TableHead>
                   <TableHead>Team</TableHead>
                   <TableHead>Player</TableHead>
                 </TableRow>
               </TableHeader> */}
              <TableBody>
                {sortedEvents.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell className="w-16 font-medium text-right tabular-nums">{event.minuto}'</TableCell>
                    <TableCell>{event.tipoEvento}</TableCell>
                    <TableCell className="capitalize">{event.equipo}</TableCell>
                    <TableCell>
                      {/* TODO: Fetch and display player name based on event.jugadorId */}
                      {event.jugadorId ? `Player ${event.jugadorId.substring(0, 5)}...` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No events yet in this match.</p>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Lineups/Stats Tabs - Add later */}
      {/* <Card>
          <CardHeader>
              <CardTitle>Lineups / Stats</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground">Lineups and detailed stats will appear here.</p>
          </CardContent>
      </Card> */}
    </div>
  );
}

// --- Skeleton Component ---
function SpectatorMatchPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Scoreboard Skeleton */}
      <Card>
        <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center space-x-4">
               <Skeleton className="h-8 w-1/4 inline-block" />
               <span className="tabular-nums"><Skeleton className="h-8 w-16 inline-block" /></span>
               <Skeleton className="h-8 w-1/4 inline-block" />
             </CardTitle>
            <Skeleton className="h-4 w-12 mx-auto" />
        </CardHeader>
      </Card>

      {/* Event Feed Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-24" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
               <div key={i} className="flex gap-4 p-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}