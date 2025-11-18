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

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  onSuccess?: () => void;
}

export function StaffForm({
  open,
  onOpenChange,
  clubSlug,
  onSuccess,
}: StaffFormProps) {
  const categories = useQuery(api.categories.listByOrgSlug, {
    orgSlug: clubSlug,
  });

  const addToCategory = useMutation(api.staff.addToCategory);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    categoryId: "",
    role: "technical_director" as "technical_director" | "assistant_coach",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        email: "",
        categoryId: "",
        role: "technical_director",
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.email || !form.categoryId) {
      alert("Email and category are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await addToCategory({
        categoryId: form.categoryId as Id<"categories">,
        email: form.email,
        role: form.role,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to add staff member"
      );
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    technical_director: "Technical Director",
    assistant_coach: "Assistant Coach",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Assign a staff member to a category. If the person doesn't have an
            account, we'll create one for them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g., coach@example.com"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll send them an invitation to join the platform
            </p>
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
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.role}
              onValueChange={(
                value: "technical_director" | "assistant_coach"
              ) => setForm({ ...form, role: value })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical_director">
                  Technical Director
                </SelectItem>
                <SelectItem value="assistant_coach">
                  Assistant Coach
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {form.role === "technical_director"
                ? "Main coach responsible for the category"
                : "Supporting coach for the category"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.categoryId}
          >
            {loading ? "Adding..." : "Add Staff Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}