"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Position } from "./types";

export function PositionItem({
  position,
  editingPosition,
  saving,
  onStartEdit,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  position: Position;
  editingPosition:
    | {
        id: string;
        name: string;
        abbreviation: string;
      }
    | null;
  saving: boolean;
  onStartEdit: () => void;
  onChange: (field: "name" | "abbreviation", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const isEditing = editingPosition?.id === position.id;

  return (
    <li className="group marker:text-primary">
      {isEditing && editingPosition ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Input
            value={editingPosition.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="h-7 w-40"
          />
          <Input
            value={editingPosition.abbreviation}
            onChange={(event) => onChange("abbreviation", event.target.value)}
            className="h-7 w-20"
            maxLength={5}
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
            {position.name} ({position.abbreviation})
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
