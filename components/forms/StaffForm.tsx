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
    firstName: "",
    lastName: "",
    phoneNumber: "",
    categoryId: "",
    role: "technical_director" as "technical_director" | "assistant_coach",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        categoryId: "",
        role: "technical_director",
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.categoryId) {
      alert("Please fill in all required fields (Email, Name, Category)");
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
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber || undefined,
        role: form.role,
      });
      
      onOpenChange(false);
      onSuccess?.();
      alert("Staff member added successfully! They can now sign in with their email.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to add staff member"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Assign a staff member to a category. We will create an account for them automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          
          {/* Personal Info Group */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="e.g. Carlos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="e.g. Valderrama"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g., coach@club.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="e.g., +57 300 123 4567"
            />
          </div>

          {/* Assignment Group */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
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

            <div className="space-y-2">
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
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {form.role === "technical_director"
              ? "The Technical Director is the head coach responsible for the category."
              : "The Assistant Coach supports the Technical Director."}
          </p>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.firstName || !form.categoryId}
          >
            {loading ? "Creating..." : "Create & Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}