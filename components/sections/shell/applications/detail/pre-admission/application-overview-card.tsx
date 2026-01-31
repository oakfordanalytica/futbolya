"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { Application } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";

interface ApplicationOverviewCardProps {
  application: Application;
}

export function ApplicationOverviewCard({
  application,
}: ApplicationOverviewCardProps) {
  const t = useTranslations("Applications.detail");
  const tPrograms = useTranslations("Applications.programs");

  const { formData } = application;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const firstName = getFormField(formData, "athlete", "firstName");
  const lastName = getFormField(formData, "athlete", "lastName");
  const email = getFormField(formData, "athlete", "email");
  const telephone = getFormField(formData, "athlete", "telephone");
  const birthDate = getFormField(formData, "athlete", "birthDate");
  const sex = getFormField(formData, "athlete", "sex");
  const height = getFormField(formData, "athlete", "height");
  const countryOfBirth = getFormField(formData, "athlete", "countryOfBirth");
  const countryOfCitizenship = getFormField(
    formData,
    "athlete",
    "countryOfCitizenship",
  );
  const highlightsLink = getFormField(formData, "athlete", "highlightsLink");
  const program = getFormField(formData, "athlete", "program");
  const format = getFormField(formData, "athlete", "format");
  const gradeEntering = getFormField(formData, "athlete", "gradeEntering");
  const enrollmentYear = getFormField(formData, "athlete", "enrollmentYear");
  const graduationYear = getFormField(formData, "athlete", "graduationYear");
  const programOfInterest = getFormField(
    formData,
    "athlete",
    "programOfInterest",
  );
  const interestedInBoarding = getFormField(
    formData,
    "general",
    "interestedInBoarding",
  );

  const athleteRows = [
    {
      label: t("fullName"),
      value: `${firstName} ${lastName}`.trim() || "-",
    },
    {
      label: t("email"),
      value: email || "-",
    },
    {
      label: t("phone"),
      value: telephone || "-",
    },
    {
      label: t("birthDate"),
      value: formatDate(birthDate),
    },
    {
      label: t("sex"),
      value: sex === "male" ? t("male") : sex === "female" ? t("female") : "-",
    },
    {
      label: t("height"),
      value: height || "-",
    },
    {
      label: t("birthCountry"),
      value: countryOfBirth || "-",
    },
    {
      label: t("citizenship"),
      value: countryOfCitizenship || "-",
    },
  ];

  const programRows = [
    {
      label: t("program"),
      value: program ? tPrograms(program) : "-",
    },
    {
      label: t("format"),
      value:
        format === "full-time"
          ? t("fullTime")
          : format === "part-time"
            ? t("partTime")
            : "-",
    },
    {
      label: t("gradeEntering"),
      value: gradeEntering || "-",
    },
    {
      label: t("enrollmentYear"),
      value: enrollmentYear || "-",
    },
    {
      label: t("graduationYear"),
      value: graduationYear || "-",
    },
    {
      label: t("programOfInterest"),
      value: programOfInterest || "-",
    },
    {
      label: t("boarding"),
      value: interestedInBoarding === "yes" ? t("yes") : t("no"),
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">
            {t("athleteInfo")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {athleteRows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
                <p className="text-sm break-words">{row.value}</p>
              </div>
            ))}
            {highlightsLink && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {t("highlights")}
                </p>
                <a
                  href={highlightsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {highlightsLink}
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground mb-3">
            {t("programInfo")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programRows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
                <p className="text-sm capitalize">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
