"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { Application } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";

interface ApplicationAddressCardProps {
  application: Application;
}

export function ApplicationAddressCard({
  application,
}: ApplicationAddressCardProps) {
  const t = useTranslations("Applications.detail");

  const { formData } = application;
  const country = getFormField(formData, "address", "country");
  const state = getFormField(formData, "address", "state");
  const city = getFormField(formData, "address", "city");
  const streetAddress = getFormField(formData, "address", "streetAddress");
  const zipCode = getFormField(formData, "address", "zipCode");

  const rows = [
    {
      label: t("country"),
      value: country || "-",
    },
    {
      label: t("state"),
      value: state || "-",
    },
    {
      label: t("city"),
      value: city || "-",
    },
    {
      label: t("streetAddress"),
      value: streetAddress || "-",
    },
    {
      label: t("zipCode"),
      value: zipCode || "-",
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-6">
        <h3 className="text-base font-bold text-foreground">
          {t("addressInfo")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rows.map((row, index) => (
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
      </CardContent>
    </Card>
  );
}
