"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AvatarUpload from "@/components/ui/avatar-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";

type BasketballPosition =
  | "point_guard"
  | "shooting_guard"
  | "small_forward"
  | "power_forward"
  | "center";

interface CreatePlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
}

const POSITION_OPTIONS: { value: BasketballPosition; label: string }[] = [
  { value: "point_guard", label: "Point Guard (PG)" },
  { value: "shooting_guard", label: "Shooting Guard (SG)" },
  { value: "small_forward", label: "Small Forward (SF)" },
  { value: "power_forward", label: "Power Forward (PF)" },
  { value: "center", label: "Center (C)" },
];

export function CreatePlayerDialog({
  open,
  onOpenChange,
  clubSlug,
}: CreatePlayerDialogProps) {
  const t = useTranslations("Common");
  const createPlayer = useMutation(api.players.createPlayer);
  const generateUploadUrl = useMutation(api.players.generateUploadUrl);

  const categories = useQuery(api.categories.listByClubSlug, {
    clubSlug,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [position, setPosition] = useState<BasketballPosition | "">("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [photoFile, setPhotoFile] = useState<FileWithPreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth(undefined);
    setJerseyNumber("");
    setPosition("");
    setHeight("");
    setWeight("");
    setCategoryId("");
    setPhotoFile(null);
  };

  const uploadPhoto = async (): Promise<Id<"_storage"> | undefined> => {
    if (!photoFile || !(photoFile.file instanceof File)) {
      return undefined;
    }

    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": photoFile.file.type },
      body: photoFile.file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload photo");
    }

    const { storageId } = await response.json();
    return storageId as Id<"_storage">;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId) return;

    setIsSubmitting(true);

    try {
      const photoStorageId = await uploadPhoto();

      await createPlayer({
        firstName,
        lastName,
        photoStorageId,
        dateOfBirth: dateOfBirth
          ? format(dateOfBirth, "yyyy-MM-dd")
          : undefined,
        categoryId: categoryId as Id<"categories">,
        sportType: "basketball",
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
        position: position || undefined,
        height: height ? parseInt(height, 10) : undefined,
        weight: weight ? parseInt(weight, 10) : undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("[CreatePlayerDialog] Failed to create player:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(resetForm, 150);
    }
  };

  const handleFileChange = (file: FileWithPreview | null) => {
    setPhotoFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("players.create")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <AvatarUpload onFileChange={handleFileChange} />

            <FieldGroup className="flex-1 gap-4 w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{t("players.firstName")}</FieldLabel>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder={t("players.firstName")}
                  />
                </Field>

                <Field>
                  <FieldLabel>{t("players.lastName")}</FieldLabel>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder={t("players.lastName")}
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          <Field>
            <FieldLabel>{t("players.dateOfBirth")}</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? (
                    format(dateOfBirth, "PPP")
                  ) : (
                    <span>{t("players.dateOfBirth")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  captionLayout="dropdown"
                  fromYear={1960}
                  toYear={new Date().getFullYear()}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </Field>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("players.jerseyNumber")}</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="#"
                />
              </Field>

              <Field>
                <FieldLabel>{t("players.position")}</FieldLabel>
                <Select
                  value={position}
                  onValueChange={(value: BasketballPosition) =>
                    setPosition(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("players.selectPosition")} />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("players.height")}</FieldLabel>
                <Input
                  type="number"
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="cm"
                />
              </Field>

              <Field>
                <FieldLabel>{t("players.weight")}</FieldLabel>
                <Input
                  type="number"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="kg"
                />
              </Field>
            </div>
          </FieldGroup>

          <Field>
            <FieldLabel>{t("players.category")}</FieldLabel>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t("players.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !categoryId}>
              {isSubmitting ? t("actions.loading") : t("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
