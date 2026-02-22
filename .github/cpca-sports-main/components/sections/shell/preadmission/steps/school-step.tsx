"use client";

import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/components/ui/country-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchoolStepProps {
  formData: {
    currentSchoolName: string;
    currentSchoolType: string;
    currentGPA: string;
    schoolAddress: string;
    schoolCity: string;
    schoolCountry: string;
    schoolState: string;
    schoolZipCode: string;
    referenceFullName: string;
    referencePhone: string;
    referenceRelationship: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function SchoolStep({ formData, onChange, errors }: SchoolStepProps) {
  const t = useTranslations("preadmission.school");

  return (
    <div className="space-y-4 sm:space-y-6">
      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Field>
            <FieldLabel>
              {t("currentSchoolName")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.currentSchoolName}
              onChange={(e) => onChange("currentSchoolName", e.target.value)}
              placeholder={t("currentSchoolNamePlaceholder")}
              required
            />
            {errors?.currentSchoolName && (
              <p className="text-sm text-destructive mt-1">
                {errors.currentSchoolName}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              {t("currentSchoolType")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.currentSchoolType}
              onValueChange={(value) => onChange("currentSchoolType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("countryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elementary">
                  {t("programElementary")}
                </SelectItem>
                <SelectItem value="middle">{t("programMiddle")}</SelectItem>
                <SelectItem value="high">{t("programHigh")}</SelectItem>
                <SelectItem value="postgraduate">
                  {t("programPostgraduate")}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors?.currentSchoolType && (
              <p className="text-sm text-destructive mt-1">
                {errors.currentSchoolType}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              {t("currentGPA")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="text"
              value={formData.currentGPA}
              onChange={(e) => onChange("currentGPA", e.target.value)}
              placeholder={t("currentGPAPlaceholder")}
              required
            />
            {errors?.currentGPA && (
              <p className="text-sm text-destructive mt-1">
                {errors.currentGPA}
              </p>
            )}
          </Field>
        </div>
      </FieldGroup>

      <div className="space-y-4">
        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Field>
              <FieldLabel>
                {t("country")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <CountryCombobox
                value={formData.schoolCountry}
                onValueChange={(value) => onChange("schoolCountry", value)}
                placeholder={t("countryPlaceholder")}
              />
              {errors?.schoolCountry && (
                <p className="text-sm text-destructive mt-1">
                  {errors.schoolCountry}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("state")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.schoolState}
                onChange={(e) => onChange("schoolState", e.target.value)}
                placeholder={t("statePlaceholder")}
                required
              />
              {errors?.schoolState && (
                <p className="text-sm text-destructive mt-1">
                  {errors.schoolState}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("city")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.schoolCity}
                onChange={(e) => onChange("schoolCity", e.target.value)}
                placeholder={t("cityPlaceholder")}
                required
              />
              {errors?.schoolCity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.schoolCity}
                </p>
              )}
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-primary">
          {t("referenceTitle")}
        </h3>

        <FieldGroup>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>
                {t("referenceFullName")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.referenceFullName}
                onChange={(e) => onChange("referenceFullName", e.target.value)}
                placeholder={t("referenceFullNamePlaceholder")}
                required
              />
              {errors?.referenceFullName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.referenceFullName}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("referencePhone")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="tel"
                value={formData.referencePhone}
                onChange={(e) => onChange("referencePhone", e.target.value)}
                placeholder={t("referencePhonePlaceholder")}
                required
              />
              {errors?.referencePhone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.referencePhone}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>
                {t("referenceRelationship")}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.referenceRelationship}
                onChange={(e) =>
                  onChange("referenceRelationship", e.target.value)
                }
                placeholder={t("referenceRelationshipPlaceholder")}
                required
              />
              {errors?.referenceRelationship && (
                <p className="text-sm text-destructive mt-1">
                  {errors.referenceRelationship}
                </p>
              )}
            </Field>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
