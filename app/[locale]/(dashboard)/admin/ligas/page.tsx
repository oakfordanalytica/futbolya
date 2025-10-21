// app/[locale]/(dashboard)/admin/ligas/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Switch } from "@/components/ui/switch"; // Assuming you have this component or use Checkbox
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function AddLeagueForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [leagueName, setLeagueName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createLeague = useMutation(api.ligas.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createLeague({
        nombre: leagueName,
        descripcion: description || undefined, // Send undefined if empty
        activo: isActive,
      });
      setLeagueName("");
      setDescription("");
      setIsActive(true);
      setOpen(false); // Close dialog on success
    } catch (err) {
      console.error("Error creating league:", err);
      setError(err instanceof Error ? err.message : "Failed to create league");
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
        <Label htmlFor="league-name">League Name *</Label>
        <Input
          id="league-name"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="e.g., Premier League U15"
          required
          disabled={loading}
        />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="league-description">Description</Label>
        <Input
          id="league-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional: Regional youth league"
          disabled={loading}
        />
      </div>
      <div className="flex items-center space-x-2">
         {/* If you don't have Switch, replace with Checkbox */}
        <Switch
            id="league-active"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={loading}
        />
        <Label htmlFor="league-active">Active</Label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create League"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ManageLeaguesPage() {
  const leagues = useQuery(api.ligas.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Leagues</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New League</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New League</DialogTitle>
              <DialogDescription>
                Leagues help organize your tournaments.
              </DialogDescription>
            </DialogHeader>
            <AddLeagueForm setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Existing Leagues</CardTitle>
          </CardHeader>
          <CardContent>
              {leagues === undefined && (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-2/3" />
                 </div>
              )}

              {leagues && leagues.length === 0 && (
                <p className="text-muted-foreground">No leagues found. Add one to get started!</p>
              )}

              {leagues && leagues.length > 0 && (
                <ul className="divide-y">
                  {leagues.map((league) => (
                    <li key={league._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{league.nombre}</p>
                        {league.descripcion && <p className="text-sm text-muted-foreground">{league.descripcion}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${league.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {league.activo ? 'Active' : 'Inactive'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
      </Card>
    </div>
  );
}