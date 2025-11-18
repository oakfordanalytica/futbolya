"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClubFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: Id<"leagues">;
  clubId?: Id<"clubs">;
  onSuccess?: () => void;
}

export function ClubForm({
  open,
  onOpenChange,
  leagueId,
  clubId,
  onSuccess,
}: ClubFormProps) {
  const isEdit = !!clubId;

  const club = clubId
    ? useQuery(api.clubs.getById, { clubId })
    : undefined;

  const createClub = useMutation(api.clubs.create);
  const updateClub = useMutation(api.clubs.update);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    headquarters: "",
    foundedYear: "",
    website: "",
    email: "",
    phoneNumber: "",
    status: "affiliated" as "affiliated" | "invited" | "suspended",
  });

  // Load existing club data
  useEffect(() => {
    if (club) {
      setForm({
        name: club.name,
        shortName: club.shortName || "",
        headquarters: club.headquarters || "",
        foundedYear: club.foundedYear?.toString() || "",
        website: club.website || "",
        email: club.email || "",
        phoneNumber: club.phoneNumber || "",
        status: club.status,
      });
    } else {
      // Reset form when creating new
      setForm({
        name: "",
        shortName: "",
        headquarters: "",
        foundedYear: "",
        website: "",
        email: "",
        phoneNumber: "",
        status: "affiliated",
      });
    }
  }, [club, open]);

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Club name is required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && clubId) {
        await updateClub({
          clubId,
          name: form.name,
          shortName: form.shortName || undefined,
          headquarters: form.headquarters || undefined,
          foundedYear: form.foundedYear
            ? parseInt(form.foundedYear)
            : undefined,
          website: form.website || undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          status: form.status,
        });
      } else {
        await createClub({
          leagueId,
          name: form.name,
          shortName: form.shortName || undefined,
          headquarters: form.headquarters || undefined,
          foundedYear: form.foundedYear
            ? parseInt(form.foundedYear)
            : undefined,
          website: form.website || undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          status: form.status,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? "update" : "create"} club`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Club" : "Create Club"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the club information"
              : "Add a new club to your league"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">
              Club Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Real Madrid CF"
              required
            />
          </div>
          <div>
            <Label htmlFor="shortName">Short Name</Label>
            <Input
              id="shortName"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              placeholder="e.g., Real Madrid"
            />
          </div>
          <div>
            <Label htmlFor="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              value={form.headquarters}
              onChange={(e) =>
                setForm({ ...form, headquarters: e.target.value })
              }
              placeholder="e.g., Madrid, Spain"
            />
          </div>
          <div>
            <Label htmlFor="foundedYear">Founded Year</Label>
            <Input
              id="foundedYear"
              type="number"
              value={form.foundedYear}
              onChange={(e) =>
                setForm({ ...form, foundedYear: e.target.value })
              }
              placeholder="e.g., 1902"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g., contact@club.com"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
              placeholder="e.g., +1 234 567 8900"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="e.g., https://club.com"
            />
          </div>
          <div>
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(value: "affiliated" | "invited" | "suspended") =>
                setForm({ ...form, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="affiliated">Affiliated</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name}>
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}