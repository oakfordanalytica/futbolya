"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DivisionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: Id<"leagues">;
  divisionId?: Id<"divisions">;
  onSuccess?: () => void;
}

export function DivisionForm({
  open,
  onOpenChange,
  leagueId,
  divisionId,
  onSuccess,
}: DivisionFormProps) {
  const isEdit = !!divisionId;

  const division = divisionId
    ? useQuery(api.divisions.getById, { divisionId })
    : undefined;

  const createDivision = useMutation(api.divisions.create);
  const updateDivision = useMutation(api.divisions.update);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    description: "",
    level: "",
  });

  // Load existing division data
  useEffect(() => {
    if (division) {
      setForm({
        name: division.name,
        displayName: division.displayName,
        description: division.description || "",
        level: division.level.toString(),
      });
    } else {
      // Reset form when creating new
      setForm({
        name: "",
        displayName: "",
        description: "",
        level: "",
      });
    }
  }, [division, open]);

  const handleSubmit = async () => {
    if (!form.displayName || !form.level) {
      alert("Display name and level are required");
      return;
    }

    const level = parseInt(form.level);
    if (isNaN(level) || level < 1) {
      alert("Level must be a positive number");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && divisionId) {
        await updateDivision({
          divisionId,
          displayName: form.displayName,
          description: form.description || undefined,
          level,
        });
      } else {
        // Generate name from displayName if not provided
        const name = form.name || form.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^_|_$)/g, "");

        await createDivision({
          leagueId,
          name,
          displayName: form.displayName,
          description: form.description || undefined,
          level,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? "update" : "create"} division`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Division" : "Create Division"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the division information"
              : "Create a new division for your league"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              placeholder="e.g., Primera División"
              required
            />
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="name">Internal Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., primera_division (auto-generated if empty)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate from display name
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="level">
              Level <span className="text-destructive">*</span>
            </Label>
            <Input
              id="level"
              type="number"
              min="1"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              placeholder="e.g., 1 (higher = better)"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              1 = highest level, 2+ = lower levels
            </p>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g., The top tier of competition"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.displayName || !form.level}
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Division"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}