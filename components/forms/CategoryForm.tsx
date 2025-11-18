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

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: Id<"clubs">;
  categoryId?: Id<"categories">;
  onSuccess?: () => void;
}

export function CategoryForm({
  open,
  onOpenChange,
  clubId,
  categoryId,
  onSuccess,
}: CategoryFormProps) {
  const isEdit = !!categoryId;
  
  const category = categoryId
    ? useQuery(api.categories.getById, { categoryId })
    : undefined;

  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ageGroup: "",
    gender: "male" as "male" | "female" | "mixed",
    status: "active" as "active" | "inactive",
  });

  // Load existing category data
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        ageGroup: category.ageGroup,
        gender: category.gender,
        status: category.status,
      });
    } else {
      // Reset form when creating new
      setForm({
        name: "",
        ageGroup: "",
        gender: "male",
        status: "active",
      });
    }
  }, [category, open]);

  const handleSubmit = async () => {
    if (!form.name || !form.ageGroup) {
      alert("Name and age group are required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && categoryId) {
        await updateCategory({
          categoryId,
          name: form.name,
          ageGroup: form.ageGroup,
          gender: form.gender,
          status: form.status,
        });
      } else {
        await createCategory({
          clubId,
          name: form.name,
          ageGroup: form.ageGroup,
          gender: form.gender,
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
          : `Failed to ${isEdit ? "update" : "create"} category`
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
            {isEdit ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category information"
              : "Create a new age-based category for your club"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Sub-17"
              required
            />
          </div>
          <div>
            <Label htmlFor="ageGroup">
              Age Group <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ageGroup"
              value={form.ageGroup}
              onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
              placeholder="e.g., 15-17 years"
              required
            />
          </div>
          <div>
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.gender}
              onValueChange={(value: "male" | "female" | "mixed") =>
                setForm({ ...form, gender: value })
              }
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(value: "active" | "inactive") =>
                setForm({ ...form, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.ageGroup}
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}