// app/[locale]/(dashboard)/admin/equipos/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // For team selection
import { AddPlayerToTeam } from "@/components/add-player-to-team";


function AddTeamForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  // --- Form State ---
  const [teamName, setTeamName] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"escuelas"> | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categoriasEdad"> | "">("");
  // Optional: Select Entrenador later
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Convex Data ---
  const createTeam = useMutation(api.equipos.create);
  const schools = useQuery(api.escuelas.list);
  const ageCategories = useQuery(api.seed.getCategoriasEdad); // Assuming a query exists

  // --- Event Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId || !teamName) {
        setError("School and Team Name are required.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      await createTeam({
        nombre: teamName,
        escuelaId: selectedSchoolId,
        categoriaEdadId: selectedCategoryId || undefined, // Optional
        // entrenadorId: Add later if needed
      });
      setTeamName("");
      setSelectedSchoolId("");
      setSelectedCategoryId("");
      setOpen(false);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
         <Alert variant="destructive">
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="team-name">Team Name *</Label>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g., Eagles U12"
          required
          disabled={loading}
        />
      </div>

       <div className="grid gap-2">
        <Label htmlFor="school-select">School *</Label>
        <Select
            value={selectedSchoolId}
            onValueChange={(value) => setSelectedSchoolId(value as Id<"escuelas">)}
            required
            disabled={loading || schools === undefined}
         >
            <SelectTrigger id="school-select">
                <SelectValue placeholder="Select School..." />
            </SelectTrigger>
            <SelectContent>
                {schools === undefined && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                {schools && schools.map((school) => (
                    <SelectItem key={school._id} value={school._id}>
                        {school.nombreEscuela}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

       <div className="grid gap-2">
        <Label htmlFor="category-select">Age Category (Optional)</Label>
         <Select
            value={selectedCategoryId}
            onValueChange={(value) => setSelectedCategoryId(value as Id<"categoriasEdad">)}
            disabled={loading || ageCategories === undefined}
         >
            <SelectTrigger id="category-select">
                <SelectValue placeholder="Select Category..." />
            </SelectTrigger>
            <SelectContent>
                {ageCategories === undefined && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                {ageCategories && ageCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                        {category.nombre} (Max {category.edadMaxima})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {/* Add Entrenador Select later */}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Team"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ManageTeamsPage() {
  const teams = useQuery(api.equipos.list, {});
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  // --- NEW STATE: Track selected team for roster management ---
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"equipos"> | null>(null);
  const selectedTeamRosterData = useQuery(
    api.equipos.getWithPlayers,
    selectedTeamId ? { id: selectedTeamId } : "skip" // Skip query if no team is selected
  );

  const selectedTeam = teams?.find(t => t._id === selectedTeamId);

  // --- Function to refetch team data (passed as callback) ---
  // Note: Convex useQuery usually handles refetching automatically after mutations.
  // This is more for explicitly triggering UI updates if needed, might not be necessary.
  const handlePlayerAdded = () => {
    console.log("Player added, Convex should update roster automatically.");
    // You could potentially force a refetch if automatic updates seem delayed,
    // but it's often better to rely on Convex's reactivity.
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* --- Section: Add New Team --- */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Manage Teams</h1>
        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Team</Button>
          </DialogTrigger>
          {/* ... DialogContent for AddTeamForm ... */}
           <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Assign teams to schools and age categories.
              </DialogDescription>
            </DialogHeader>
            <AddTeamForm setOpen={setIsTeamDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      {/* --- Section: Select Team & Manage Roster --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List/Selector */}
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Select Team</CardTitle>
                <CardDescription>Choose a team to manage its roster.</CardDescription>
            </CardHeader>
            <CardContent>
                {teams === undefined && (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                )}
                {teams && teams.length === 0 && (
                    <p className="text-muted-foreground">No teams created yet.</p>
                )}
                {teams && teams.length > 0 && (
                    <RadioGroup
                        value={selectedTeamId ?? ""}
                        onValueChange={(value) => setSelectedTeamId(value as Id<"equipos">)}
                        className="space-y-2"
                    >
                       {teams.map((team) => (
                         <div key={team._id} className="flex items-center space-x-2">
                            <RadioGroupItem value={team._id} id={`team-${team._id}`} />
                            <Label htmlFor={`team-${team._id}`} className="cursor-pointer">{team.nombre}</Label>
                         </div>
                       ))}
                    </RadioGroup>
                )}
            </CardContent>
        </Card>

        {/* Add Player Form (Conditional) */}
        <div className="lg:col-span-2">
            {selectedTeamId ? (
                <AddPlayerToTeam
                    key={selectedTeamId} // Add key to force re-render/refetch on team change
                    equipoId={selectedTeamId}
                    teamName={selectedTeam?.nombre}
                    onPlayerAdded={handlePlayerAdded}
                 />
            ) : (
                <Card className="flex items-center justify-center h-40 border-dashed">
                    <p className="text-muted-foreground">Select a team to add players</p>
                </Card>
            )}

            {/* --- Display Current Roster --- */}
            {selectedTeamId && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Current Roster for {selectedTeam?.nombre || 'Selected Team'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTeamRosterData === undefined && (
                    <div className="space-y-2"> {/* Skeleton Loader */}
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  )}
                  {selectedTeamRosterData === null && ( // Team query returned null (shouldn't happen if selected from list)
                      <p className="text-destructive">Error loading roster.</p>
                  )}
                  {selectedTeamRosterData && selectedTeamRosterData.players && selectedTeamRosterData.players.length === 0 && (
                    <p className="text-muted-foreground">No players currently on this roster.</p>
                  )}
                  {selectedTeamRosterData && selectedTeamRosterData.players && selectedTeamRosterData.players.length > 0 && (
                    <ul className="divide-y">
                      {selectedTeamRosterData.players.map((player) => (
                        player && ( // Add check for null player just in case filter(Boolean) wasn't enough previously
                          <li key={player._id} className="py-2 flex justify-between items-center">
                            <span>
                                {player.persona?.nombrePersona} {player.persona?.apellidoPersona}
                            </span>
                            {/* TODO: Display jersey number from jugadoresPorEquipo if needed */}
                            {/* We don't have jersey # directly here, need jugadoresPorEquipo */}
                            {/* <span className="text-sm text-muted-foreground">#{player.numeroCamiseta}</span> */}
                            {/* TODO: Add a Remove Player button */}
                          </li>
                        )
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

// Helper query in convex/seed.ts (or a dedicated lookup file)
// convex/seed.ts - add this query
/*
export const getCategoriasEdad = query({
    handler: async ({ db }) => {
        return await db.query("categoriasEdad").collect();
    }
})
*/