"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgeCategory } from "./types";

export function AgeCategoryItem({
  category,
  editingCategory,
  ageLabel,
  saving,
  onStartEdit,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  category: AgeCategory;
  editingCategory:
    | {
        id: string;
        name: string;
        minAge: string;
        maxAge: string;
      }
    | null;
  ageLabel: string;
  saving: boolean;
  onStartEdit: () => void;
  onChange: (field: "name" | "minAge" | "maxAge", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const isEditing = editingCategory?.id === category.id;

  return (
    <li className="group marker:text-primary">
      {isEditing && editingCategory ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Input
            value={editingCategory.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="h-7 w-32"
          />
          <Input
            type="number"
            value={editingCategory.minAge}
            onChange={(event) => onChange("minAge", event.target.value)}
            className="h-7 w-16"
            min={0}
            max={99}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            value={editingCategory.maxAge}
            onChange={(event) => onChange("maxAge", event.target.value)}
            className="h-7 w-16"
            min={0}
            max={99}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onSave}
            disabled={saving}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="size-3.5" />
          </Button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-primary">
          <span>
            {category.name} ({category.minAge}-{category.maxAge} {ageLabel})
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            onClick={onStartEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-destructive opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </span>
      )}
    </li>
  );
}
