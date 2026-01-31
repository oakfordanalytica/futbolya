"use client";

import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParentsStepProps {
  formData: {
    parent1FirstName: string;
    parent1LastName: string;
    parent1Relationship: string;
    parent1Email: string;
    parent1Telephone: string;
    parent2FirstName: string;
    parent2LastName: string;
    parent2Relationship: string;
    parent2Email: string;
    parent2Telephone: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function ParentsStep({ formData, onChange, errors }: ParentsStepProps) {
  const t = useTranslations("preadmission.parents");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-primary">{t("parent1Title")}</h3>

        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>
                {t("firstName")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.parent1FirstName}
                onChange={(e) => onChange("parent1FirstName", e.target.value)}
                placeholder={t("firstNamePlaceholder")}
                required
              />
              {errors?.parent1FirstName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent1FirstName}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("lastName")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.parent1LastName}
                onChange={(e) => onChange("parent1LastName", e.target.value)}
                placeholder={t("lastNamePlaceholder")}
                required
              />
              {errors?.parent1LastName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent1LastName}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("relationship")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={formData.parent1Relationship}
                onValueChange={(value) =>
                  onChange("parent1Relationship", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("firstNamePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">{t("relationshipFather")}</SelectItem>
                  <SelectItem value="mother">{t("relationshipMother")}</SelectItem>
                </SelectContent>
              </Select>
              {errors?.parent1Relationship && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent1Relationship}
                </p>
              )}
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                {t("email")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="email"
                value={formData.parent1Email}
                onChange={(e) => onChange("parent1Email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
              {errors?.parent1Email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent1Email}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("telephone")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="tel"
                value={formData.parent1Telephone}
                onChange={(e) => onChange("parent1Telephone", e.target.value)}
                placeholder={t("telephonePlaceholder")}
                required
              />
              {errors?.parent1Telephone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parent1Telephone}
                </p>
              )}
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-primary">{t("parent2Title")}</h3>

        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>{t("firstName")}</FieldLabel>
              <Input
                value={formData.parent2FirstName}
                onChange={(e) => onChange("parent2FirstName", e.target.value)}
                placeholder={t("firstNamePlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("lastName")}</FieldLabel>
              <Input
                value={formData.parent2LastName}
                onChange={(e) => onChange("parent2LastName", e.target.value)}
                placeholder={t("lastNamePlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("relationship")}</FieldLabel>
              <Select
                value={formData.parent2Relationship}
                onValueChange={(value) =>
                  onChange("parent2Relationship", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("firstNamePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">{t("relationshipFather")}</SelectItem>
                  <SelectItem value="mother">{t("relationshipMother")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("email")}</FieldLabel>
              <Input
                type="email"
                value={formData.parent2Email}
                onChange={(e) => onChange("parent2Email", e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("telephone")}</FieldLabel>
              <Input
                type="tel"
                value={formData.parent2Telephone}
                onChange={(e) => onChange("parent2Telephone", e.target.value)}
                placeholder={t("telephonePlaceholder")}
              />
            </Field>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}