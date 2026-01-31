"use client";

import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneralStepProps {
  formData: {
    personSubmitting: string;
    howDidYouHear: string;
    interestedInBoarding: string;
    profilePicture: File | null;
    message: string;
  };
  onChange: (field: string, value: string | File | null) => void;
  errors?: Record<string, string>;
}

export function GeneralStep({ formData, onChange, errors }: GeneralStepProps) {
  const t = useTranslations("preadmission.general");

  return (
    <div className="space-y-4 sm:space-y-6">
      <FieldGroup>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              {t("personSubmitting")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.personSubmitting}
              onValueChange={(value) => onChange("personSubmitting", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("personSubmittingPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">{t("personSubmittingSelf")}</SelectItem>
                <SelectItem value="parent">{t("personSubmittingParent")}</SelectItem>
                <SelectItem value="guidance">{t("personSubmittingGuidance")}</SelectItem>
                <SelectItem value="administration">{t("personSubmittingAdministration")}</SelectItem>
                <SelectItem value="coach">{t("personSubmittingCoach")}</SelectItem>
              </SelectContent>
            </Select>
            {errors?.personSubmitting && (
              <p className="text-sm text-destructive mt-1">
                {errors.personSubmitting}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              {t("howDidYouHear")}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={formData.howDidYouHear}
              onValueChange={(value) => onChange("howDidYouHear", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("howDidYouHearPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="socialMedia">{t("howDidYouHearSocialMedia")}</SelectItem>
                <SelectItem value="friend">{t("howDidYouHearFriend")}</SelectItem>
                <SelectItem value="coach">{t("howDidYouHearCoach")}</SelectItem>
                <SelectItem value="teacher">{t("howDidYouHearTeacher")}</SelectItem>
                <SelectItem value="other">{t("howDidYouHearOther")}</SelectItem>
              </SelectContent>
            </Select>
            {errors?.howDidYouHear && (
              <p className="text-sm text-destructive mt-1">
                {errors.howDidYouHear}
              </p>
            )}
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel>{t("interestedInBoarding")}</FieldLabel>
          <Select
            value={formData.interestedInBoarding}
            onValueChange={(value) => onChange("interestedInBoarding", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("interestedInBoardingPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">{t("interestedInBoardingYes")}</SelectItem>
              <SelectItem value="no">{t("interestedInBoardingNo")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel>{t("message")}</FieldLabel>
          <Textarea
            value={formData.message}
            onChange={(e) => onChange("message", e.target.value)}
            placeholder={t("messagePlaceholder")}
            rows={5}
            className="resize-none"
          />
        </Field>
      </FieldGroup>
    </div>
  );
}
