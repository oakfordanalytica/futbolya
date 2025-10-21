// app/[locale]/admin/partidos/[partidoId]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MatchLineupEditor } from "@/components/match-lineup-editor"; // Adjust path
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EditMatchPage() {
    const params = useParams();
    const partidoId = params.partidoId as Id<"partidos">;

    // Fetch match details to get team IDs and names
    const matchData = useQuery(api.partidos.getWithEvents, { id: partidoId });

    if (matchData === undefined) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-64 w-full" />
             <Skeleton className="h-64 w-full" />
        </div>;
    }

    if (!matchData) {
         return <div className="p-8">
            <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Match not found.</AlertDescription></Alert>
         </div>;
    }

    const { equipoLocal, equipoVisitante } = matchData;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <h1 className="text-2xl font-bold">Manage Match Lineups</h1>
            <p className="text-muted-foreground">
                Match: {equipoLocal?.nombre ?? 'Local'} vs {equipoVisitante?.nombre ?? 'Visitor'}
            </p>

            {/* Editor for Local Team */}
            {equipoLocal && (
                <MatchLineupEditor
                    partidoId={partidoId}
                    equipoId={equipoLocal._id}
                    teamName={equipoLocal.nombre}
                 />
            )}

            {/* Separator */}
             <div className="py-4"></div>

            {/* Editor for Visitor Team */}
             {equipoVisitante && (
                <MatchLineupEditor
                    partidoId={partidoId}
                    equipoId={equipoVisitante._id}
                    teamName={equipoVisitante.nombre}
                 />
            )}
        </div>
    );

}