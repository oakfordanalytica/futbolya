"use client";

import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/components/ui/country-combobox";

interface AddressStepProps {
  formData: {
    country: string;
    state: string;
    city: string;
    streetAddress: string;
    zipCode: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function AddressStep({ formData, onChange, errors }: AddressStepProps) {
  const t = useTranslations("preadmission.address");

  return (
    <div className="space-y-4 sm:space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>
            {t("country")}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <CountryCombobox
            value={formData.country}
            onValueChange={(value) => onChange("country", value)}
            placeholder={t("countryPlaceholder")}
          />
          {errors?.country && (
            <p className="text-sm text-destructive mt-1">{errors.country}</p>
          )}
        </Field>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("state")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.state}
              onChange={(e) => onChange("state", e.target.value)}
              placeholder={t("statePlaceholder")}
              required
            />
            {errors?.state && (
              <p className="text-sm text-destructive mt-1">{errors.state}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              {t("city")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder={t("cityPlaceholder")}
              required
            />
            {errors?.city && (
              <p className="text-sm text-destructive mt-1">{errors.city}</p>
            )}
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("streetAddress")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.streetAddress}
              onChange={(e) => onChange("streetAddress", e.target.value)}
              placeholder={t("streetAddressPlaceholder")}
              required
            />
            {errors?.streetAddress && (
              <p className="text-sm text-destructive mt-1">
                {errors.streetAddress}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel>
              {t("zipCode")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={formData.zipCode}
              onChange={(e) => onChange("zipCode", e.target.value)}
              placeholder={t("zipCodePlaceholder")}
              required
            />
            {errors?.zipCode && (
              <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>
            )}
          </Field>
        </div>
      </FieldGroup>
    </div>
  );
}
