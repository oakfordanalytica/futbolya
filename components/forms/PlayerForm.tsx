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

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  playerId?: Id<"players">;
  onSuccess?: () => void;
}

export function PlayerForm({
  open,
  onOpenChange,
  clubSlug,
  playerId,
  onSuccess,
}: PlayerFormProps) {
  const isEdit = !!playerId;

  const player = playerId
    ? useQuery(api.players.getById, { playerId })
    : undefined;
  const categories = useQuery(api.categories.listByOrgSlug, { orgSlug: clubSlug });

  const createPlayer = useMutation(api.players.createPlayer);
  const updatePlayer = useMutation(api.players.updatePlayer);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    categoryId: "",
    position: "",
    jerseyNumber: "",
    nationality: "",
    height: "",
    weight: "",
    preferredFoot: "",
    status: "active" as "active" | "injured" | "on_loan" | "inactive",
  });

  // Load existing player data
  useEffect(() => {
    if (player && player.profileData) {
      setForm({
        firstName: player.profileData.displayName?.split(" ")[0] || "",
        lastName: player.profileData.displayName?.split(" ").slice(1).join(" ") || "",
        email: player.profileData.email || "",
        phoneNumber: player.profileData.phoneNumber || "",
        dateOfBirth: player.profileData.dateOfBirth || "",
        categoryId: player.currentCategoryId || "",
        position: player.position || "",
        jerseyNumber: player.jerseyNumber?.toString() || "",
        nationality: player.nationality || "",
        height: player.height?.toString() || "",
        weight: player.weight?.toString() || "",
        preferredFoot: player.preferredFoot || "",
        status: player.status,
      });
    } else if (!isEdit) {
      // Reset form when creating new
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        categoryId: "",
        position: "",
        jerseyNumber: "",
        nationality: "",
        height: "",
        weight: "",
        preferredFoot: "",
        status: "active",
      });
    }
  }, [player, open, isEdit]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.categoryId) {
      alert("First name, last name, and category are required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && playerId) {
        await updatePlayer({
          playerId,
          position: form.position
            ? (form.position as "goalkeeper" | "defender" | "midfielder" | "forward")
            : undefined,
          jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined,
          height: form.height ? parseFloat(form.height) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          preferredFoot: form.preferredFoot
            ? (form.preferredFoot as "left" | "right" | "both")
            : undefined,
          status: form.status,
        });
      } else {
        await createPlayer({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          categoryId: form.categoryId as Id<"categories">,
          position: form.position
            ? (form.position as "goalkeeper" | "defender" | "midfielder" | "forward")
            : undefined,
          jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined,
          nationality: form.nationality || undefined,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? "update" : "create"} player`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Player" : "Add Player"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update player information"
              : "Add a new player to your club roster"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="e.g., Lionel"
                required
                disabled={isEdit}
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="e.g., Messi"
                required
                disabled={isEdit}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g., player@example.com"
              disabled={isEdit}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Optional. If provided, an account will be created automatically.
              </p>
            )}
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
              placeholder="e.g., +1234567890"
              disabled={isEdit}
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
              disabled={isEdit}
            />
          </div>

          <div>
            <Label htmlFor="categoryId">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) =>
                setForm({ ...form, categoryId: value })
              }
              disabled={isEdit}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name} ({category.ageGroup})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Select
              value={form.position}
              onValueChange={(value) => setForm({ ...form, position: value })}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                <SelectItem value="defender">Defender</SelectItem>
                <SelectItem value="midfielder">Midfielder</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                type="number"
                value={form.jerseyNumber}
                onChange={(e) =>
                  setForm({ ...form, jerseyNumber: e.target.value })
                }
                placeholder="e.g., 10"
                min="1"
                max="99"
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={form.nationality}
                onChange={(e) =>
                  setForm({ ...form, nationality: e.target.value })
                }
                placeholder="e.g., Argentina"
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="e.g., 180"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="e.g., 75"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferredFoot">Preferred Foot</Label>
            <Select
              value={form.preferredFoot}
              onValueChange={(value) =>
                setForm({ ...form, preferredFoot: value })
              }
            >
              <SelectTrigger id="preferredFoot">
                <SelectValue placeholder="Select preferred foot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div>
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.status}
                onValueChange={(
                  value: "active" | "injured" | "on_loan" | "inactive"
                ) => setForm({ ...form, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="injured">Injured</SelectItem>
                  <SelectItem value="on_loan">On Loan</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading || !form.firstName || !form.lastName || !form.categoryId
            }
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Add Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}