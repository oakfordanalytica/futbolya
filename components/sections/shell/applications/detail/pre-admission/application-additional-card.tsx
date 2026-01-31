"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Application, getFormField } from "@/lib/applications/types";

interface ApplicationAdditionalCardProps {
  application: Application;
}

export function ApplicationAdditionalCard({
  application,
}: ApplicationAdditionalCardProps) {
  const t = useTranslations("Applications.detail");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const needsI20 = getFormField(application.formData, "additional", "needsI20");

  const rows = [
    {
      label: t("submittedBy"),
      value: getFormField(
        application.formData,
        "additional",
        "personSubmitting",
      ),
    },
    {
      label: t("howDidYouHear"),
      value: getFormField(application.formData, "additional", "howDidYouHear"),
    },
    {
      label: t("needsI20"),
      value: needsI20 === "yes" ? t("yes") : t("no"),
    },
    {
      label: t("submittedAt"),
      value: formatDate(application._creationTime),
    },
  ];

  const message = getFormField(application.formData, "additional", "message");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("additionalInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
              </div>
              <p className="text-sm capitalize">{row.value}</p>
            </div>
          ))}
        </div>

        {message && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              {t("message")}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
