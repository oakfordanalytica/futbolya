"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PositionAddForm({
  value,
  isSubmitting,
  onChange,
  onSubmit,
  labels,
}: {
  value: {
    name: string;
    abbreviation: string;
  };
  isSubmitting: boolean;
  onChange: (field: "name" | "abbreviation", value: string) => void;
  onSubmit: () => void;
  labels: {
    name: string;
    namePlaceholder: string;
    abbreviation: string;
    abbreviationPlaceholder: string;
  };
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{labels.name}</Label>
        <Input
          placeholder={labels.namePlaceholder}
          value={value.name}
          onChange={(event) => onChange("name", event.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">
          {labels.abbreviation}
        </Label>
        <Input
          placeholder={labels.abbreviationPlaceholder}
          value={value.abbreviation}
          onChange={(event) => onChange("abbreviation", event.target.value)}
          className="w-24"
          maxLength={5}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="invisible text-xs text-muted-foreground">&nbsp;</Label>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !value.name || !value.abbreviation}
          size="icon"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
