"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { Application, ApplicationStatus } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";
import type { FilterConfig } from "@/lib/table/types";
import { CiBaseball, CiBasketball } from "react-icons/ci";
import { GiSoccerBall, GiTennisRacket } from "react-icons/gi";
import { PiVolleyball, PiBaseball } from "react-icons/pi";
import { IoGolfOutline } from "react-icons/io5";
import type { IconType } from "react-icons";
import { Mail, Phone, CircleX, CircleCheck } from "lucide-react";
import { ApplicationPhoto } from "./application-photo";
import { Id } from "@/convex/_generated/dataModel";

const SPORT_ICONS: Record<string, IconType> = {
  baseball: CiBaseball,
  basketball: CiBasketball,
  soccer: GiSoccerBall,
  volleyball: PiVolleyball,
  hr14_baseball: PiBaseball,
  golf: IoGolfOutline,
  tennis: GiTennisRacket,
  softball: CiBaseball,
  "volleyball-club": PiVolleyball,
  "pg-basketball": CiBasketball,
};

function getSportIcon(program: string): IconType {
  return SPORT_ICONS[program] || CiBasketball;
}

function useStatusMap() {
  const t = useTranslations("Applications.statusOptions");
  return {
    pending: { label: t("pending"), variant: "outline" as const },
    reviewing: { label: t("reviewing"), variant: "secondary" as const },
    "pre-admitted": { label: t("pre-admitted"), variant: "default" as const },
    admitted: { label: t("admitted"), variant: "default" as const },
    denied: { label: t("denied"), variant: "destructive" as const },
  };
}

export function useAdminApplicationColumns(): ColumnDef<Application>[] {
  const t = useTranslations("Applications");
  const statusMap = useStatusMap();

  return [
    {
      accessorKey: "_creationTime",
      header: () => <div className="hidden md:block">{t("date")}</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("_creationTime") as number);
        return (
          <div className="hidden md:block">
            {date.toLocaleDateString("en-EN")}
          </div>
        );
      },
    },
    {
      id: "fullName",
      header: () => (
        <>
          <div className="hidden lg:block">{t("fullName")}</div>
          <div className="lg:hidden">{t("athlete")}</div>
        </>
      ),

      accessorFn: (row) => getFormField(row.formData, "athlete", "firstName"),
      cell: ({ row }) => {
        const { formData } = row.original;
        const firstName = getFormField(formData, "athlete", "firstName");
        const lastName = getFormField(formData, "athlete", "lastName");
        const program = getFormField(formData, "athlete", "program");
        const telephone = getFormField(formData, "parents", "parent1Telephone");
        const email = getFormField(formData, "parents", "parent1Email");
        const countryOfBirth = getFormField(
          formData,
          "athlete",
          "countryOfBirth",
        );
        const countryOfCitizen = getFormField(
          formData,
          "athlete",
          "countryOfCitizenship",
        );
        const graduationYear = getFormField(
          formData,
          "athlete",
          "graduationYear",
        );
        const needsI20 = getFormField(formData, "athlete", "needsI20");
        const hasVisa = needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        const Icon = getSportIcon(program);
        const photoStorageId = formData.athlete?.photo as Id<"_storage"> | undefined;

        return (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex shrink-0">
              {photoStorageId ? (
                <ApplicationPhoto
                  storageId={photoStorageId}
                  alt={`${firstName} ${lastName}`}
                  size="sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-semibold">
                    {firstName.charAt(0).toUpperCase()}
                    {lastName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium">
                  {firstName} {lastName}
                </div>
                <div className="md:hidden flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-4 w-4" asChild>
                    <a href={`tel:${telephone}`}>
                      <Phone className="h-2 w-2" />
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-4 w-4" asChild>
                    <a href={`mailto:${email}`}>
                      <Mail className="h-2 w-2" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="lg:hidden flex flex-col gap-0.5 mt-1">
              <div className="inline-flex items-center text-xs">
                <span className="font-mono uppercase">{t("program")}:</span>
                <Icon className="ml-1 h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {program}
                </span>
              </div>
              {countryOfBirth && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">{t("birth")}:</span>
                  <span className="text-muted-foreground ml-1">
                    {countryOfBirth}
                  </span>
                </div>
              )}
              {countryOfCitizen && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">
                    {t("citizenship")}:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {countryOfCitizen}
                  </span>
                </div>
              )}
              {graduationYear && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">
                    {t("graduationYear")}:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {new Date(graduationYear).toLocaleDateString("en-EN")}
                  </span>
                </div>
              )}
              <div className="inline-flex items-center text-xs">
                <span className="font-mono uppercase">{t("visaStatus")}:</span>
                <span className="ml-1">
                  {hasVisa ? (
                    <CircleCheck className="h-3 w-3 text-green-600" />
                  ) : (
                    <CircleX className="h-3 w-3 text-red-600" />
                  )}
                </span>
              </div>
            </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "program",
      header: () => <div className="hidden lg:block">{t("program")}</div>,
      accessorFn: (row) => getFormField(row.formData, "athlete", "program"),
      cell: ({ row }) => {
        const program = getFormField(
          row.original.formData,
          "athlete",
          "program",
        );
        const Icon = getSportIcon(program);
        return (
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{program}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const program = getFormField(
          row.original.formData,
          "athlete",
          "program",
        );
        return value.includes(program);
      },
    },
    {
      id: "country",
      header: () => <div className="hidden lg:block">{t("country")}</div>,
      accessorFn: (row) =>
        getFormField(row.formData, "athlete", "countryOfBirth"),
      cell: ({ row }) => {
        const countryOfBirth = getFormField(
          row.original.formData,
          "athlete",
          "countryOfBirth",
        );
        const countryOfCitizen = getFormField(
          row.original.formData,
          "athlete",
          "countryOfCitizenship",
        );
        return (
          <div className="hidden lg:flex lg:flex-col">
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("birth")}:</span>
              <span className="text-muted-foreground ml-1">
                {countryOfBirth}
              </span>
            </div>

            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("citizenship")}:</span>
              <span className="text-muted-foreground ml-1">
                {countryOfCitizen}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "graduationYear",
      header: () => (
        <div className="hidden lg:block">{t("graduationYear")}</div>
      ),
      accessorFn: (row) =>
        getFormField(row.formData, "athlete", "graduationYear"),
      cell: ({ row }) => {
        const graduationYear = getFormField(
          row.original.formData,
          "athlete",
          "graduationYear",
        );
        return (
          <div className="hidden lg:block text-sm">
            {graduationYear
              ? new Date(graduationYear).toLocaleDateString("en-EN")
              : "-"}
          </div>
        );
      },
    },
    {
      id: "visaStatus",
      header: () => <div className="hidden lg:block">{t("visaStatus")}</div>,
      accessorFn: (row) => getFormField(row.formData, "athlete", "needsI20"),
      cell: ({ row }) => {
        const needsI20 = getFormField(
          row.original.formData,
          "athlete",
          "needsI20",
        );
        const hasVisa = needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        return (
          <div className="hidden lg:flex">
            {hasVisa ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <CircleX className="h-4 w-4 text-red-600" />
            )}
          </div>
        );
      },
    },
    {
      id: "contact",
      header: () => <div className="hidden md:block">{t("contact")}</div>,
      cell: ({ row }) => {
        const { formData } = row.original;
        const telephone = getFormField(formData, "parents", "parent1Telephone");
        const email = getFormField(formData, "parents", "parent1Email");
        return (
          <div className="hidden md:flex md:flex-col font-medium">
            <div className="hidden md:flex md:flex-row">
              <Mail className="h-4 w-4 mr-1" />
              {email}
            </div>
            <div className="hidden md:flex md:flex-row">
              <Phone className="h-4 w-4 mr-1" />
              {telephone}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as ApplicationStatus;
        const statusInfo = statusMap[status];

        return (
          <div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  ];
}

export function useClientApplicationColumns(): ColumnDef<Application>[] {
  const t = useTranslations("Applications");
  const statusMap = useStatusMap();

  return [
    {
      accessorKey: "_creationTime",
      header: () => <div className="hidden md:block">{t("date")}</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("_creationTime") as number);
        return (
          <div className="hidden md:block">
            {date.toLocaleDateString("en-EN")}
          </div>
        );
      },
    },
    {
      id: "fullName",
      header: () => (
        <>
          <div className="hidden lg:block">{t("fullName")}</div>
          <div className="lg:hidden">{t("athlete")}</div>
        </>
      ),

      accessorFn: (row) => getFormField(row.formData, "athlete", "firstName"),
      cell: ({ row }) => {
        const { formData, status } = row.original;
        const firstName = getFormField(formData, "athlete", "firstName");
        const lastName = getFormField(formData, "athlete", "lastName");
        const program = getFormField(formData, "athlete", "program");
        const telephone = getFormField(formData, "parents", "parent1Telephone");
        const email = getFormField(formData, "parents", "parent1Email");
        const countryOfBirth = getFormField(
          formData,
          "athlete",
          "countryOfBirth",
        );
        const countryOfCitizen = getFormField(
          formData,
          "athlete",
          "countryOfCitizenship",
        );
        const graduationYear = getFormField(
          formData,
          "athlete",
          "graduationYear",
        );
        const needsI20 = getFormField(formData, "athlete", "needsI20");
        const hasVisa = needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        const Icon = getSportIcon(program);
        const photoStorageId = formData.athlete?.photo as Id<"_storage"> | undefined;

        return (
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {photoStorageId ? (
                <ApplicationPhoto
                  storageId={photoStorageId}
                  alt={`${firstName} ${lastName}`}
                  size="sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-semibold">
                    {firstName.charAt(0).toUpperCase()}
                    {lastName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium">
                  {firstName} {lastName}
                </div>
                <div className="md:hidden flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-4 w-4" asChild>
                    <a href={`tel:${telephone}`}>
                      <Phone className="h-2 w-2" />
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-4 w-4" asChild>
                    <a href={`mailto:${email}`}>
                      <Mail className="h-2 w-2" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="lg:hidden flex flex-col gap-0.5 mt-1">
              <div className="inline-flex items-center text-xs">
                <span className="font-mono uppercase">{t("program")}:</span>
                <Icon className="ml-1 h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {program}
                </span>
              </div>
              {countryOfBirth && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">{t("birth")}:</span>
                  <span className="text-muted-foreground ml-1">
                    {countryOfBirth}
                  </span>
                </div>
              )}
              {countryOfCitizen && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">
                    {t("citizenship")}:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {countryOfCitizen}
                  </span>
                </div>
              )}
              {graduationYear && (
                <div className="inline-flex items-center text-xs">
                  <span className="font-mono uppercase">
                    {t("graduationYear")}:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {new Date(graduationYear).toLocaleDateString("en-EN")}
                  </span>
                </div>
              )}
              <div className="inline-flex items-center text-xs">
                <span className="font-mono uppercase">{t("visaStatus")}:</span>
                <span className="ml-1">
                  {hasVisa ? (
                    <CircleCheck className="h-3 w-3 text-green-600" />
                  ) : (
                    <CircleX className="h-3 w-3 text-red-600" />
                  )}
                </span>
              </div>
            </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "program",
      header: () => <div className="hidden lg:block">{t("program")}</div>,
      accessorFn: (row) => getFormField(row.formData, "athlete", "program"),
      cell: ({ row }) => {
        const program = getFormField(
          row.original.formData,
          "athlete",
          "program",
        );
        const Icon = getSportIcon(program);
        return (
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{program}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const program = getFormField(
          row.original.formData,
          "athlete",
          "program",
        );
        return value.includes(program);
      },
    },
    {
      id: "country",
      header: () => <div className="hidden lg:block">{t("country")}</div>,
      accessorFn: (row) =>
        getFormField(row.formData, "athlete", "countryOfBirth"),
      cell: ({ row }) => {
        const countryOfBirth = getFormField(
          row.original.formData,
          "athlete",
          "countryOfBirth",
        );
        const countryOfCitizen = getFormField(
          row.original.formData,
          "athlete",
          "countryOfCitizenship",
        );
        return (
          <div className="hidden lg:flex lg:flex-col">
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("birth")}:</span>
              <span className="text-muted-foreground ml-1">
                {countryOfBirth}
              </span>
            </div>

            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("citizenship")}:</span>
              <span className="text-muted-foreground ml-1">
                {countryOfCitizen}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "graduationYear",
      header: () => (
        <div className="hidden lg:block">{t("graduationYear")}</div>
      ),
      accessorFn: (row) =>
        getFormField(row.formData, "athlete", "graduationYear"),
      cell: ({ row }) => {
        const graduationYear = getFormField(
          row.original.formData,
          "athlete",
          "graduationYear",
        );
        return (
          <div className="hidden lg:block text-sm">
            {graduationYear
              ? new Date(graduationYear).toLocaleDateString("en-EN")
              : "-"}
          </div>
        );
      },
    },
    {
      id: "visaStatus",
      header: () => <div className="hidden lg:block">{t("visaStatus")}</div>,
      accessorFn: (row) => getFormField(row.formData, "athlete", "needsI20"),
      cell: ({ row }) => {
        const needsI20 = getFormField(
          row.original.formData,
          "athlete",
          "needsI20",
        );
        const hasVisa = needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        return (
          <div className="hidden lg:flex">
            {hasVisa ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <CircleX className="h-4 w-4 text-red-600" />
            )}
          </div>
        );
      },
    },
    {
      id: "contact",
      header: () => <div className="hidden md:block">{t("contact")}</div>,
      cell: ({ row }) => {
        const { formData } = row.original;
        const telephone = getFormField(formData, "parents", "parent1Telephone");
        const email = getFormField(formData, "parents", "parent1Email");
        return (
          <div className="hidden md:flex md:flex-col font-medium">
            <div className="hidden md:flex md:flex-row">
              <Mail className="h-4 w-4 mr-1" />
              {email}
            </div>
            <div className="hidden md:flex md:flex-row">
              <Phone className="h-4 w-4 mr-1" />
              {telephone}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => t("status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as ApplicationStatus;
        const statusInfo = statusMap[status];

        return (
          <div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  ];
}

export function useApplicationFilters(): FilterConfig[] {
  const t = useTranslations("Applications");
  const tStatus = useTranslations("Applications.statusOptions");
  const tPrograms = useTranslations("Applications.programs");

  return [
    {
      id: "status",
      label: t("status"),
      options: [
        { value: "pending", label: tStatus("pending") },
        { value: "reviewing", label: tStatus("reviewing") },
        { value: "pre-admitted", label: tStatus("pre-admitted") },
        { value: "admitted", label: tStatus("admitted") },
        { value: "denied", label: tStatus("denied") },
      ],
    },
    {
      id: "program",
      label: t("program"),
      options: [
        { value: "basketball", label: tPrograms("basketball") },
        { value: "soccer", label: tPrograms("soccer") },
        { value: "volleyball", label: tPrograms("volleyball") },
        { value: "baseball", label: tPrograms("baseball") },
        { value: "tennis", label: tPrograms("tennis") },
      ],
    },
  ];
}
