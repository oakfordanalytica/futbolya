"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { Application } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";

interface ApplicationSchoolCardProps {
  application: Application;
}

export function ApplicationSchoolCard({
  application,
}: ApplicationSchoolCardProps) {
  const t = useTranslations("Applications.detail");

  const { formData } = application;
  const currentSchoolName = getFormField(
    formData,
    "school",
    "currentSchoolName",
  );
  const schoolAddress = getFormField(formData, "school", "schoolAddress");
  const schoolCity = getFormField(formData, "school", "schoolCity");
  const schoolState = getFormField(formData, "school", "schoolState");
  const schoolZipCode = getFormField(formData, "school", "schoolZipCode");
  const schoolCountry = getFormField(formData, "school", "schoolCountry");
  const currentSchoolType = getFormField(
    formData,
    "school",
    "currentSchoolType",
  );
  const currentGPA = getFormField(formData, "school", "currentGPA");
  const referenceFullName = getFormField(
    formData,
    "school",
    "referenceFullName",
  );
  const referenceRelationship = getFormField(
    formData,
    "school",
    "referenceRelationship",
  );
  const referencePhone = getFormField(formData, "school", "referencePhone");

  const fullSchoolAddress = [
    schoolAddress,
    schoolCity,
    schoolState,
    schoolZipCode,
    schoolCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const rows = [
    {
      label: t("currentSchool"),
      value: currentSchoolName || "-",
    },
    {
      label: t("schoolAddress"),
      value: fullSchoolAddress || "-",
    },
    {
      label: t("schoolType"),
      value: currentSchoolType || "-",
    },
    {
      label: t("gpa"),
      value: currentGPA || "-",
    },
  ];

  const referenceRows = [
    {
      label: t("referenceName"),
      value: referenceFullName || "-",
    },
    {
      label: t("referenceRelationship"),
      value: referenceRelationship || "-",
    },
    {
      label: t("referencePhone"),
      value: referencePhone || "-",
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-6">
        <h3 className="text-base font-bold text-foreground">
          {t("schoolInfo")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
              </div>
              <p className="text-sm wrap-break-word">{row.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-base font-bold text-foreground mb-3">
            {t("reference")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {referenceRows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {row.label}
                  </p>
                </div>
                <p className="text-sm">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
