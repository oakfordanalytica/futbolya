"use client";

import { FormEvent, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type Gender = "male" | "female" | "mixed";
type DivisionType = "alphabetic" | "greek" | "numeric";

interface AgeCategory {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubSlug: string;
  orgSlug: string;
}

interface FormState {
  ageGroup: string;
  gender: Gender;
  division: string;
}

const INITIAL_FORM_STATE: FormState = {
  ageGroup: "",
  gender: "male",
  division: "",
};

const ALPHABETIC_DIVISIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const GREEK_DIVISIONS = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Eta",
  "Theta",
  "Iota",
  "Kappa",
  "Lambda",
  "Mu",
  "Nu",
  "Xi",
  "Omicron",
  "Pi",
  "Rho",
  "Sigma",
  "Tau",
  "Upsilon",
  "Phi",
  "Chi",
  "Psi",
  "Omega",
];

const NUMERIC_DIVISIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
];

function getDivisionOptions(type: DivisionType): string[] {
  switch (type) {
    case "alphabetic":
      return ALPHABETIC_DIVISIONS;
    case "greek":
      return GREEK_DIVISIONS;
    case "numeric":
      return NUMERIC_DIVISIONS;
    default:
      return ALPHABETIC_DIVISIONS;
  }
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  clubSlug,
  orgSlug,
}: CreateCategoryDialogProps) {
  const t = useTranslations("Common");
  const createCategory = useMutation(api.categories.create);
  const teamConfig = useQuery(api.leagueSettings.getTeamConfig, {
    leagueSlug: orgSlug,
  });
  const existingCategories = useQuery(api.categories.listByClubSlug, {
    clubSlug,
  });

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ageCategories: AgeCategory[] = teamConfig?.ageCategories || [];
  const enabledGenders = (teamConfig?.enabledGenders as Gender[]) || [
    "male",
    "female",
  ];
  const horizontalDivisions = teamConfig?.horizontalDivisions || {
    enabled: false,
    type: "alphabetic" as DivisionType,
  };

  const availableDivisions = useMemo(() => {
    if (!horizontalDivisions.enabled) {
      return [];
    }

    const allDivisions = getDivisionOptions(
      horizontalDivisions.type as DivisionType,
    );

    if (!formState.ageGroup || !formState.gender || !existingCategories) {
      return allDivisions;
    }

    const usedDivisions = existingCategories
      .filter(
        (cat) =>
          cat.ageGroup === formState.ageGroup &&
          cat.gender === formState.gender,
      )
      .map((cat) => {
        // Extract division from name (e.g., "Sub-17 A" -> "A")
        const parts = cat.name.split(" ");
        return parts[parts.length - 1];
      });

    return allDivisions.filter((div) => !usedDivisions.includes(div));
  }, [
    horizontalDivisions.enabled,
    horizontalDivisions.type,
    formState.ageGroup,
    formState.gender,
    existingCategories,
  ]);

  const generateCategoryName = (): string => {
    if (horizontalDivisions.enabled && formState.division) {
      return `${formState.ageGroup} ${formState.division}`;
    }
    return formState.ageGroup;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formState.ageGroup || !formState.gender) return;
    if (horizontalDivisions.enabled && !formState.division) return;

    setIsSubmitting(true);
    try {
      await createCategory({
        clubSlug,
        name: generateCategoryName(),
        ageGroup: formState.ageGroup,
        gender: formState.gender,
      });
      setFormState(INITIAL_FORM_STATE);
      onOpenChange(false);
    } catch (error) {
      console.error("[CreateCategoryDialog] Failed to create category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormState(INITIAL_FORM_STATE);
    }
    onOpenChange(newOpen);
  };

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "ageGroup" || field === "gender") {
        newState.division = "";
      }
      return newState;
    });
  };

  const isFormValid =
    formState.ageGroup &&
    formState.gender &&
    (!horizontalDivisions.enabled || formState.division);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">
            {t("actions.create")} {t("categories.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <FieldLabel>{t("categories.ageGroup")}</FieldLabel>
              <Select
                value={formState.ageGroup}
                onValueChange={(value) => updateField("ageGroup", value)}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder={t("categories.ageGroup")} />
                </SelectTrigger>
                <SelectContent>
                  {ageCategories.length > 0 ? (
                    ageCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name} ({cat.minAge}-{cat.maxAge})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default" disabled>
                      {t("categories.emptyMessage")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {horizontalDivisions.enabled && (
              <div className="w-24 shrink-0">
                <FieldLabel>{t("categories.horizontalDivision")}</FieldLabel>
                <Select
                  value={formState.division}
                  onValueChange={(value) => updateField("division", value)}
                  disabled={!formState.ageGroup || !formState.gender}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder={t("categories.selectDivision")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDivisions.length > 0 ? (
                      availableDivisions.map((division) => (
                        <SelectItem key={division} value={division}>
                          {division}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {t("categories.noDivisionsAvailable")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <FieldLabel>{t("categories.gender")}</FieldLabel>
            <Select
              value={formState.gender}
              onValueChange={(value) => updateField("gender", value as Gender)}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder={t("categories.gender")} />
              </SelectTrigger>
              <SelectContent>
                {enabledGenders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {t(`categories.genderOptions.${gender}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? t("actions.loading") : t("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
