"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { Application } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";

interface ApplicationParentsCardProps {
  application: Application;
}

export function ApplicationParentsCard({
  application,
}: ApplicationParentsCardProps) {
  const t = useTranslations("Applications.detail");

  const { formData } = application;
  const parent1FirstName = getFormField(
    formData,
    "parents",
    "parent1FirstName",
  );
  const parent1LastName = getFormField(formData, "parents", "parent1LastName");
  const parent1Relationship = getFormField(
    formData,
    "parents",
    "parent1Relationship",
  );
  const parent1Email = getFormField(formData, "parents", "parent1Email");
  const parent1Telephone = getFormField(
    formData,
    "parents",
    "parent1Telephone",
  );
  const parent2FirstName = getFormField(
    formData,
    "parents",
    "parent2FirstName",
  );
  const parent2LastName = getFormField(formData, "parents", "parent2LastName");
  const parent2Relationship = getFormField(
    formData,
    "parents",
    "parent2Relationship",
  );
  const parent2Email = getFormField(formData, "parents", "parent2Email");
  const parent2Telephone = getFormField(
    formData,
    "parents",
    "parent2Telephone",
  );

  const parent1Rows = [
    {
      label: t("fullName"),
      value: `${parent1FirstName} ${parent1LastName}`.trim() || "-",
    },
    {
      label: t("relationship"),
      value: parent1Relationship || "-",
    },
    {
      label: t("email"),
      value: parent1Email || "-",
    },
    {
      label: t("phone"),
      value: parent1Telephone || "-",
    },
  ];

  const parent2Rows = parent2FirstName
    ? [
        {
          label: t("fullName"),
          value: `${parent2FirstName} ${parent2LastName}`.trim() || "-",
        },
        {
          label: t("relationship"),
          value: parent2Relationship || "-",
        },
        {
          label: t("email"),
          value: parent2Email || "-",
        },
        {
          label: t("phone"),
          value: parent2Telephone || "-",
        },
      ]
    : null;

  return (
    <Card>
      <CardContent className="space-y-6">
        <h3 className="text-base font-bold text-foreground">
          {t("parentsInfo")}
        </h3>
        <div>
          <h4 className="text-base font-bold text-foreground mb-3">
            {t("parent1")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parent1Rows.map((row, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {row.label}
                  </p>
                </div>
                <p className="text-sm break-words">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {parent2Rows && (
          <div>
            <h4 className="text-base font-bold text-foreground mb-3">
              {t("parent2")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parent2Rows.map((row, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {row.label}
                    </p>
                  </div>
                  <p className="text-sm break-words">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
