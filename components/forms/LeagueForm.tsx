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

interface LeagueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId?: Id<"leagues">;
  onSuccess?: () => void;
}

export function LeagueForm({
  open,
  onOpenChange,
  leagueId,
  onSuccess,
}: LeagueFormProps) {
  const isEdit = !!leagueId;

  const league = leagueId
    ? useQuery(api.leagues.getById, { leagueId })
    : undefined;

  const createLeague = useMutation(api.leagues.create);
  const updateLeague = useMutation(api.leagues.update);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    slug: "",
    country: "",
    region: "",
    foundedYear: "",
    website: "",
    email: "",
    phoneNumber: "",
    address: "",
    federationId: "",
    status: "active" as "active" | "inactive",
  });

  // Load existing league data
  useEffect(() => {
    if (league) {
      setForm({
        name: league.name,
        shortName: league.shortName || "",
        slug: league.slug,
        country: league.country,
        region: league.region || "",
        foundedYear: league.foundedYear?.toString() || "",
        website: league.website || "",
        email: league.email || "",
        phoneNumber: league.phoneNumber || "",
        address: league.address || "",
        federationId: league.federationId || "",
        status: league.status,
      });
    } else {
      // Reset form when creating new
      setForm({
        name: "",
        shortName: "",
        slug: "",
        country: "",
        region: "",
        foundedYear: "",
        website: "",
        email: "",
        phoneNumber: "",
        address: "",
        federationId: "",
        status: "active",
      });
    }
  }, [league, open]);

  const handleSubmit = async () => {
    if (!form.name || !form.country) {
      alert("League name and country are required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && leagueId) {
        await updateLeague({
          leagueId,
          name: form.name,
          shortName: form.shortName || undefined,
          country: form.country,
          region: form.region || undefined,
          foundedYear: form.foundedYear
            ? parseInt(form.foundedYear)
            : undefined,
          website: form.website || undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          address: form.address || undefined,
          status: form.status,
        });
      } else {
        await createLeague({
          name: form.name,
          slug: form.slug || undefined,
          shortName: form.shortName || undefined,
          country: form.country,
          region: form.region || undefined,
          foundedYear: form.foundedYear
            ? parseInt(form.foundedYear)
            : undefined,
          website: form.website || undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          address: form.address || undefined,
          federationId: form.federationId || undefined,
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
          : `Failed to ${isEdit ? "update" : "create"} league`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit League" : "Create League"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the league information"
              : "Create a new league or federation"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">
              League Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Spanish Football Federation"
              required
            />
          </div>
          <div>
            <Label htmlFor="shortName">Short Name</Label>
            <Input
              id="shortName"
              value={form.shortName}
              onChange={(e) =>
                setForm({ ...form, shortName: e.target.value })
              }
              placeholder="e.g., RFEF"
            />
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g., rfef (auto-generated if empty)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate from league name
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="e.g., Spain"
              required
            />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="e.g., Andalusia"
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
              placeholder="e.g., 1909"
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
              placeholder="e.g., contact@league.com"
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
              placeholder="e.g., +34 912 345 678"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g., Calle Principal 123, Madrid"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="e.g., https://league.com"
            />
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="federationId">Federation ID</Label>
              <Input
                id="federationId"
                value={form.federationId}
                onChange={(e) =>
                  setForm({ ...form, federationId: e.target.value })
                }
                placeholder="e.g., FED-2024-001"
              />
            </div>
          )}
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
            disabled={loading || !form.name || !form.country}
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create League"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}