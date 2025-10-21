// app/[locale]/(dashboard)/admin/torneos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Import necessary Shadcn components (Button, Dialog, Input, Label, Select, Card, etc.)
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";


// --- Add Tournament Form ---
function AddTournamentForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [selectedLeagueId, setSelectedLeagueId] = useState<Id<"ligas"> | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categoriasEdad"> | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTournament = useMutation(api.torneos.create);
  const addPhase = useMutation(api.torneos.addPhase); // For dummy phase/group
  const addGroup = useMutation(api.torneos.addGroup); // For dummy phase/group

  const leagues = useQuery(api.ligas.list);
  const ageCategories = useQuery(api.seed.getCategoriasEdad);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !selectedLeagueId || !selectedCategoryId) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Create Tournament
      const tournamentId = await createTournament({
        nombre: name,
        fechaInicio: format(startDate, "yyyy-MM-dd"),
        ligaId: selectedLeagueId,
        categoriaEdadId: selectedCategoryId,
        estado: "activo", // Default state
      });

      // --- POC Simplification: Create a default Phase and Group ---
      const phaseId = await addPhase({
          torneoId: tournamentId,
          nombre: "Main Phase",
          tipoFase: "Grupos", // Or "Liga" if simpler
          orden: 1,
      });
      await addGroup({
          torneoFaseId: phaseId,
          nombre: "Group A", // Default group name
      });
      // --- End POC Simplification ---

      setName("");
      setStartDate(undefined);
      setSelectedLeagueId("");
      setSelectedCategoryId("");
      setOpen(false);

    } catch (err) {
      console.error("Error creating tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

   return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="grid gap-2">
            <Label htmlFor="tour-name">Tournament Name *</Label>
            <Input id="tour-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="tour-start-date">Start Date *</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")} disabled={loading} >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
            </Popover>
        </div>
         <div className="grid gap-2">
            <Label htmlFor="tour-league">League *</Label>
             <Select value={selectedLeagueId} onValueChange={(v) => setSelectedLeagueId(v as Id<"ligas">)} required disabled={loading || !leagues}>
                <SelectTrigger id="tour-league"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                    {!leagues && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {leagues?.map(l => <SelectItem key={l._id} value={l._id}>{l.nombre}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="tour-category">Age Category *</Label>
             <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v as Id<"categoriasEdad">)} required disabled={loading || !ageCategories}>
                <SelectTrigger id="tour-category"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                    {!ageCategories && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {ageCategories?.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.nombre}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Tournament"}</Button>
        </DialogFooter>
    </form>
   );
}


// --- Schedule Match Form ---
function ScheduleMatchForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const [selectedTournamentId, setSelectedTournamentId] = useState<Id<"torneos"> | "">("");
    const [selectedGroupId, setSelectedGroupId] = useState<Id<"torneoGrupos"> | "">("");
    const [selectedLocalTeamId, setSelectedLocalTeamId] = useState<Id<"equipos"> | "">("");
    const [selectedVisitorTeamId, setSelectedVisitorTeamId] = useState<Id<"equipos"> | "">("");
    const [matchDate, setMatchDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scheduleMatch = useMutation(api.partidos.schedule);
    const tournaments = useQuery(api.torneos.list);
    const teams = useQuery(api.equipos.list, {});

    const firstGroup = useQuery(
        api.torneos.getFirstGroupOfTournament,
        selectedTournamentId ? { tournamentId: selectedTournamentId } : "skip" // Only run if tournamentId is selected
    );

    // --- Automatically set the group ID when it's fetched ---
    useEffect(() => {
        if (firstGroup) {
            setSelectedGroupId(firstGroup._id);
            // Update availableGroups for display (though it's just one)
            setAvailableGroups([firstGroup]);
        } else {
             // Reset if tournament changes or group not found
             setSelectedGroupId("");
             setAvailableGroups([]);
        }
    }, [firstGroup]); // Re-run when firstGroup data changes


    // State to hold groups of the selected tournament (now holds fetched group)
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);

    const handleTournamentChange = async (tournamentId: Id<"torneos">) => {
        setSelectedTournamentId(tournamentId);
    };


     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroupId || !selectedLocalTeamId || !selectedVisitorTeamId || !matchDate) {
            setError("Please select tournament, ensure group is loaded, select teams, and date.");
            return;
        }
        if (selectedLocalTeamId === selectedVisitorTeamId) {
            setError("Home and Visitor teams cannot be the same.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await scheduleMatch({
                grupoId: selectedGroupId,
                equipoLocalId: selectedLocalTeamId,
                equipoVisitante: selectedVisitorTeamId,
                fecha: matchDate.toISOString(),
            });
            setSelectedTournamentId("");
            setSelectedGroupId("");
            setSelectedLocalTeamId("");
            setSelectedVisitorTeamId("");
            setMatchDate(undefined);
            setOpen(false);
        } catch (err) {
            console.error("Error scheduling match:", err);
            setError(err instanceof Error ? err.message : "Failed to schedule match");
        } finally {
            setLoading(false);
        }
     };

     // Filter teams based on selected tournament category (if possible)
     // const filteredTeams = teams?.filter(team => team.categoriaEdadId === selectedTournamentCategoryId);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid gap-2">
                <Label htmlFor="match-tournament">Tournament *</Label>
                    <Select
                    value={selectedTournamentId}
                    onValueChange={(v) => handleTournamentChange(v as Id<"torneos">)}
                    required
                    disabled={loading || !tournaments}
                    >
                    <SelectTrigger id="match-tournament"><SelectValue placeholder="Select Tournament..." /></SelectTrigger>
                    <SelectContent>
                        {!tournaments && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {tournaments?.map(t => <SelectItem key={t._id} value={t._id}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="match-group">Group *</Label>
                <Select
                    value={selectedGroupId}
                    // onValueChange={(v) => setSelectedGroupId(v as Id<"torneoGrupos">)} // Can make read-only
                    required
                    // Disable selection, it's auto-set based on tournament
                    disabled={loading || !selectedTournamentId || firstGroup === undefined || firstGroup === null}
                >
                    <SelectTrigger id="match-group">
                        <SelectValue placeholder={!selectedTournamentId ? "Select Tournament First" : (firstGroup === undefined ? "Loading Group..." : "Select Group...")} />
                    </SelectTrigger>
                    <SelectContent>
                            {/* Display the fetched group */}
                            {firstGroup === undefined && selectedTournamentId && <SelectItem value="loading" disabled>Loading Group...</SelectItem>}
                            {firstGroup === null && selectedTournamentId && <SelectItem value="noGroup" disabled>No Group Found</SelectItem>}
                            {firstGroup && <SelectItem key={firstGroup._id} value={firstGroup._id}>{firstGroup.nombre}</SelectItem>}
                    </SelectContent>
                </Select>
            </div>


            <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="match-local">Home Team *</Label>
                <Select value={selectedLocalTeamId} onValueChange={(v) => setSelectedLocalTeamId(v as Id<"equipos">)} required disabled={loading || !teams}>
                    <SelectTrigger id="match-local"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                        {!teams && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {teams?.map(t => <SelectItem key={t._id} value={t._id}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
                <div className="grid gap-2">
                <Label htmlFor="match-visitor">Visitor Team *</Label>
                    <Select value={selectedVisitorTeamId} onValueChange={(v) => setSelectedVisitorTeamId(v as Id<"equipos">)} required disabled={loading || !teams}>
                    <SelectTrigger id="match-visitor"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                        {!teams && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {teams?.map(t => <SelectItem key={t._id} value={t._id}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="match-date">Date & Time *</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !matchDate && "text-muted-foreground")} disabled={loading} >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {matchDate ? format(matchDate, "PPP p") : <span>Pick date & time</span>}
                        </Button>
                    </PopoverTrigger>
                    {/* ... PopoverContent ... */}
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={matchDate} onSelect={setMatchDate} initialFocus />
                            <div className="p-2 border-t">
                            <Input type="time" className="w-full" onChange={e => {
                                if(matchDate){
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = new Date(matchDate);
                                    newDate.setHours(hours, minutes);
                                    setMatchDate(newDate);
                                }
                            }} />
                            </div>
                    </PopoverContent>
                </Popover>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={loading || !selectedGroupId}>{loading ? "Scheduling..." : "Schedule Match"}</Button>
            </DialogFooter>
        </form>
    );
}

// --- Main Page Component ---
export default function ManageTournamentsPage() {
  const tournaments = useQuery(api.torneos.list);
  // Fetch matches separately or enhance tournament query
  const matches = useQuery(api.partidos.listAll); // Assuming this query exists

  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Tournament Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Tournaments</h2>
          <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
            <DialogTrigger asChild><Button>Add Tournament</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Tournament</DialogTitle></DialogHeader>
              <AddTournamentForm setOpen={setIsTournamentDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
           <CardContent className="pt-6">
                {tournaments === undefined && <Skeleton className="h-10 w-full" />}
                {tournaments?.length === 0 && <p className="text-muted-foreground">No tournaments created yet.</p>}
                <ul className="divide-y">
                    {tournaments?.map(t => <li key={t._id} className="py-2">{t.nombre} ({t.estado})</li>)}
                </ul>
           </CardContent>
        </Card>
      </div>

      {/* Matches Section */}
       <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Scheduled Matches</h2>
           <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
            <DialogTrigger asChild><Button>Schedule Match</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Schedule New Match</DialogTitle></DialogHeader>
              <ScheduleMatchForm setOpen={setIsMatchDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
           <CardContent className="pt-6">
                 {matches === undefined && <Skeleton className="h-10 w-full" />}
                 {matches?.length === 0 && <p className="text-muted-foreground">No matches scheduled yet.</p>}
                 <ul className="divide-y">
                    {/* TODO: Display match details (teams, date) - requires fetching team names */}
                    {matches?.map(m => <li key={m._id} className="py-2">{m.equipoLocalId.substring(0,5)} vs {m.equipoVisitanteId.substring(0,5)} - {format(new Date(m.fecha), "Pp")}</li>)}
                </ul>
           </CardContent>
        </Card>
       </div>
    </div>
  );
}