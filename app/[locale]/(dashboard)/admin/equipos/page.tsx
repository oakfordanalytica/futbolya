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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";


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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // TODO: Add filtering by school later

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Teams</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Assign teams to schools and age categories.
              </DialogDescription>
            </DialogHeader>
            <AddTeamForm setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Existing Teams</CardTitle>
              {/* TODO: Add School Filter Dropdown */}
          </CardHeader>
          <CardContent>
              {teams === undefined && (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-2/3" />
                 </div>
              )}

              {teams && teams.length === 0 && (
                <p className="text-muted-foreground">No teams found. Add one to get started!</p>
              )}

              {teams && teams.length > 0 && (
                <ul className="divide-y">
                  {teams.map((team) => (
                    <li key={team._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{team.nombre}</p>
                        {/* TODO: Fetch and display School Name */}
                        {/* <p className="text-sm text-muted-foreground">School Name Here</p> */}
                      </div>
                       {/* TODO: Fetch and display Category Name */}
                      {/* <span className="text-sm text-muted-foreground">Category Name</span> */}
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
      </Card>
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