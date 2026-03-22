"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgeCategoryAddForm({
  value,
  isSubmitting,
  onChange,
  onSubmit,
  labels,
}: {
  value: {
    name: string;
    minAge: string;
    maxAge: string;
  };
  isSubmitting: boolean;
  onChange: (field: "name" | "minAge" | "maxAge", value: string) => void;
  onSubmit: () => void;
  labels: {
    name: string;
    namePlaceholder: string;
    minAge: string;
    maxAge: string;
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
          className="w-32"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{labels.minAge}</Label>
        <Input
          type="number"
          placeholder="0"
          value={value.minAge}
          onChange={(event) => onChange("minAge", event.target.value)}
          className="w-20"
          min={0}
          max={99}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">{labels.maxAge}</Label>
        <Input
          type="number"
          placeholder="99"
          value={value.maxAge}
          onChange={(event) => onChange("maxAge", event.target.value)}
          className="w-20"
          min={0}
          max={99}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="invisible text-xs text-muted-foreground">&nbsp;</Label>
        <Button
          onClick={onSubmit}
          disabled={
            isSubmitting || !value.name || !value.minAge || !value.maxAge
          }
          size="icon"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
