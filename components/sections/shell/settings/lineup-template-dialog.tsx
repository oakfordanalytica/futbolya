"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FootballFieldTemplateEditor } from "@/components/ui/football-field-template-editor";
import type { FootballLineupTemplateSlot } from "@/components/ui/football-field.types";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSlotsFromFormation,
  FREE_FORM_FORMATION,
  isFormationPreset,
  LINEUP_FORMATION_OPTIONS,
} from "@/lib/lineups/formation-presets";

interface LineupTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueSlug: string;
  lineup?: {
    id: string;
    name: string;
    slots: FootballLineupTemplateSlot[];
  } | null;
}

export function LineupTemplateDialog({
  open,
  onOpenChange,
  leagueSlug,
  lineup = null,
}: LineupTemplateDialogProps) {
  const t = useTranslations("Settings.general.teamConfig");
  const tCommon = useTranslations("Common");
  const addLineup = useMutation(api.leagueSettings.addLineup);
  const updateLineup = useMutation(api.leagueSettings.updateLineup);

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>("4-3-3");
  const [slots, setSlots] = useState<FootballLineupTemplateSlot[]>(
    createSlotsFromFormation("4-3-3"),
  );
  const isEditMode = Boolean(lineup);
  const isFreeForm = selectedFormation === FREE_FORM_FORMATION;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (lineup) {
      setName(lineup.name);
      setSlots(lineup.slots);
      setSelectedFormation(
        isFormationPreset(lineup.name) ? lineup.name : FREE_FORM_FORMATION,
      );
      return;
    }

    setName("4-3-3");
    setSelectedFormation("4-3-3");
    setSlots(createSlotsFromFormation("4-3-3"));
  }, [open, lineup]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setName("4-3-3");
        setSelectedFormation("4-3-3");
        setSlots(createSlotsFromFormation("4-3-3"));
        setIsSubmitting(false);
      }, 150);
    }
  };

  const handleFormationChange = (value: string) => {
    const shouldSyncName =
      !name.trim() || isFormationPreset(name) || name === FREE_FORM_FORMATION;

    setSelectedFormation(value);
    setSlots(createSlotsFromFormation(value));

    if (shouldSyncName) {
      setName(value === FREE_FORM_FORMATION ? "" : value);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = isFreeForm ? name.trim() : selectedFormation;
    if (!trimmedName) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (lineup) {
        await updateLineup({
          leagueSlug,
          lineupId: lineup.id,
          name: trimmedName,
          slots,
        });
        toast.success(t("lineups.updated"));
      } else {
        await addLineup({
          leagueSlug,
          lineup: {
            id: crypto.randomUUID(),
            name: trimmedName,
            slots,
          },
        });
        toast.success(t("lineups.created"));
      }
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tCommon("errors.generic"),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>
            {isEditMode ? t("lineups.editTitle") : t("lineups.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>{t("lineups.baseFormation")}</FieldLabel>
                <Select
                  value={selectedFormation}
                  onValueChange={handleFormationChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINEUP_FORMATION_OPTIONS.map((formation) => (
                      <SelectItem key={formation} value={formation}>
                        {formation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {isFreeForm && (
                <Field>
                  <FieldLabel>{t("lineups.name")}</FieldLabel>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("lineups.namePlaceholder")}
                    required
                  />
                </Field>
              )}

              <div className="space-y-2">
                <FieldLabel>{t("lineups.preview")}</FieldLabel>
                <div className="mx-auto w-full max-w-[280px]">
                  <FootballFieldTemplateEditor
                    slots={slots}
                    onChange={setSlots}
                  />
                </div>
              </div>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (isFreeForm && !name.trim())}
            >
              {isSubmitting
                ? tCommon("actions.loading")
                : isEditMode
                  ? tCommon("actions.save")
                  : tCommon("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
