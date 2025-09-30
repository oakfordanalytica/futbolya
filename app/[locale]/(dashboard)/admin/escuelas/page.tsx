// app/[locale]/(dashboard)/admin/escuelas/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// A new component for our form
function AddSchoolForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [schoolName, setSchoolName] = useState("");
  const createSchool = useMutation(api.escuelas.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSchool({ nombreEscuela: schoolName });
      alert("School created successfully!");
      setSchoolName(""); // Reset form
      setOpen(false); // Close dialog on success
    } catch (error) {
      alert(`Error creating school: ${error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="school-name">School Name</Label>
        <Input
          id="school-name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="e.g., Real Madrid Academy"
          required
        />
      </div>
      <Button type="submit">Create School</Button>
    </form>
  );
}

export default function ManageEscuelasPage() {
  const escuelas = useQuery(api.escuelas.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Schools</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New School</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New School</DialogTitle>
            </DialogHeader>
            <AddSchoolForm setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      {escuelas === undefined && <div>Loading schools...</div>}

      {escuelas && (
        <div className="border rounded-lg p-4">
          {escuelas.length === 0 && <p>No schools found. Add one to get started!</p>}
          <ul>
            {escuelas.map((escuela) => (
              <li key={escuela._id} className="py-2 border-b last:border-b-0">
                {escuela.nombreEscuela}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}