// app/[locale]/(dashboard)/admin/jugadores/page.tsx
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
import { Calendar } from "@/components/ui/calendar"; // Assuming calendar component exists
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // For date picker
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns"; // For date formatting
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function AddPlayerForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  // --- Form State ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [dropdown, setDropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>(
      "dropdown"
    )
  const [docNumber, setDocNumber] = useState("");
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<Id<"tiposDocumento"> | "">("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"escuelas"> | "">("");
  const [selectedPositionId, setSelectedPositionId] = useState<Id<"posicionesCancha"> | "">("");
  const [cometId, setCometId] = useState("");
  // Optional fields: nacionId, genero, categoriaEdadId

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Convex Data ---
  const createPlayer = useMutation(api.jugadores.create);
  const schools = useQuery(api.escuelas.list);
  const docTypes = useQuery(api.seed.getTiposDocumento); // Assuming query exists
  const positions = useQuery(api.seed.getPosicionesCancha); // Assuming query exists


  // --- Event Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !birthDate || !docNumber || !selectedDocTypeId || !selectedSchoolId || !selectedPositionId || !cometId) {
        setError("Please fill in all required fields.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      await createPlayer({
        // Persona details
        nombrePersona: firstName,
        apellidoPersona: lastName,
        fechaNacimiento: format(birthDate, "yyyy-MM-dd"), // Format date to string
        numeroDocumento: docNumber,
        tipoDocumentoId: selectedDocTypeId,
        // nacionId: ... // Add if needed
        // genero: ... // Add if needed
        // Jugador details
        escuelaId: selectedSchoolId,
        posicionId: selectedPositionId,
        comet: cometId,
        // categoriaEdadId: ... // Add if needed
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setBirthDate(undefined);
      setDocNumber("");
      setSelectedDocTypeId("");
      setSelectedSchoolId("");
      setSelectedPositionId("");
      setCometId("");
      setOpen(false);

    } catch (err) {
      console.error("Error creating player:", err);
      setError(err instanceof Error ? err.message : "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  return (
     <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
       {error && (
         <Alert variant="destructive">
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">First Name *</Label>
            <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last Name *</Label>
            <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading} />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="birth-date">Birth Date *</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !birthDate && "text-muted-foreground"
                        )}
                        disabled={loading}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        captionLayout={dropdown}
                        initialFocus
                    />
                    {/* <div className="flex flex-col gap-3">
                      <Label htmlFor="dropdown" className="px-1">
                        Dropdown
                      </Label>
                      <Select
                        value={dropdown}
                        onValueChange={(value) =>
                          setDropdown(
                            value as React.ComponentProps<typeof Calendar>["captionLayout"]
                          )
                        }
                      >
                        <SelectTrigger
                          id="dropdown"
                          size="sm"
                          className="bg-background w-full"
                        >
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent align="center">
                          <SelectItem value="dropdown">Month and Year</SelectItem>
                          <SelectItem value="dropdown-months">Month Only</SelectItem>
                          <SelectItem value="dropdown-years">Year Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-type">Document Type *</Label>
             <Select value={selectedDocTypeId} onValueChange={(v) => setSelectedDocTypeId(v as Id<"tiposDocumento">)} required disabled={loading || !docTypes}>
                <SelectTrigger id="doc-type"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                    {!docTypes && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {docTypes?.map(type => <SelectItem key={type._id} value={type._id}>{type.nombreDocumento} ({type.codigoDocumento})</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="doc-number">Document Number *</Label>
            <Input id="doc-number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required disabled={loading} />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="comet-id">COMET ID *</Label>
            <Input id="comet-id" value={cometId} onChange={(e) => setCometId(e.target.value)} required disabled={loading} />
          </div>

           <div className="grid gap-2">
            <Label htmlFor="school-select">School *</Label>
            <Select value={selectedSchoolId} onValueChange={(v) => setSelectedSchoolId(v as Id<"escuelas">)} required disabled={loading || !schools}>
                <SelectTrigger id="school-select"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                    {!schools && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {schools?.map(school => <SelectItem key={school._id} value={school._id}>{school.nombreEscuela}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position-select">Position *</Label>
            <Select value={selectedPositionId} onValueChange={(v) => setSelectedPositionId(v as Id<"posicionesCancha">)} required disabled={loading || !positions}>
                <SelectTrigger id="position-select"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                    {!positions && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {positions?.map(pos => <SelectItem key={pos._id} value={pos._id}>{pos.nombre} ({pos.codigo})</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          {/* Add optional selects for Nation, Gender, Age Category here */}
      </div>


      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Player"}
        </Button>
      </DialogFooter>
    </form>
  );
}


export default function ManagePlayersPage() {
  // Use the getWithPersona query for a richer list display
  const players = useQuery(api.jugadores.listWithPersonas); // Assuming this query exists
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
     <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Players</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Player</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create a New Player</DialogTitle>
              <DialogDescription>
                Enter player details. This will create both a person and a player record.
              </DialogDescription>
            </DialogHeader>
            <AddPlayerForm setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Registered Players</CardTitle>
               {/* TODO: Add School/Team Filter Dropdown */}
          </CardHeader>
          <CardContent>
               {players === undefined && (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-2/3" />
                 </div>
              )}

              {players && players.length === 0 && (
                <p className="text-muted-foreground">No players found. Add one to get started!</p>
              )}

               {players && players.length > 0 && (
                 // Use a Table for better structure
                 <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Document</th>
                            <th className="text-left p-2">COMET</th>
                             {/* Add School, Position etc. */}
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={player._id} className="border-b last:border-b-0 hover:bg-muted/50">
                                <td className="p-2">{player.persona?.nombrePersona} {player.persona?.apellidoPersona}</td>
                                <td className="p-2">{player.persona?.numeroDocumento}</td>
                                <td className="p-2">{player.comet}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
              )}
          </CardContent>
      </Card>
    </div>
  );
}

// Add these queries to convex/seed.ts (or a dedicated lookups file)
/*
export const getTiposDocumento = query({
    handler: async ({ db }) => await db.query("tiposDocumento").collect()
});
export const getPosicionesCancha = query({
    handler: async ({ db }) => await db.query("posicionesCancha").collect()
});

// Add this query to convex/jugadores.ts
export const listWithPersonas = query({
    handler: async (ctx) => {
        const jugadores = await ctx.db.query("jugadores").collect();
        return Promise.all(
            jugadores.map(async (jugador) => {
                const persona = await ctx.db.get(jugador.personaId);
                // Optionally fetch school, position names too
                return { ...jugador, persona };
            })
        );
    }
});
*/