"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ApplicationPhoto } from "./detail/pre-admission/application-photo";
import { formatApplicationDate } from "./date-format";
import { createSortableHeader } from "@/components/table/column-helpers";
import { getProgramIcon } from "@/lib/programs/icon-catalog";
import type { ApplicationStatus } from "@/lib/applications/types";
import type { ApplicationListItem } from "@/lib/applications/list-types";
import type { FilterConfig } from "@/lib/table/types";

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

function ApplicantPhotoThumb({
  photoUrl,
  photoStorageId,
  applicationId,
  alt,
  initials,
}: {
  photoUrl?: string;
  photoStorageId?: ApplicationListItem["applicant"]["photoStorageId"];
  applicationId: ApplicationListItem["_id"];
  alt: string;
  initials: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (photoUrl && !imageError) {
    return (
      <Image
        src={photoUrl}
        alt={alt}
        width={40}
        height={40}
        sizes="40px"
        onError={() => setImageError(true)}
        className="h-10 w-10 rounded-md border object-cover"
      />
    );
  }

  if (photoStorageId) {
    return (
      <ApplicationPhoto
        storageId={photoStorageId}
        applicationId={applicationId}
        alt={alt}
        size="sm"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
      <span className="text-sm font-semibold text-primary-foreground">
        {initials}
      </span>
    </div>
  );
}

function ApplicantCell({
  row,
  t,
}: {
  row: ApplicationListItem;
  t: ReturnType<typeof useTranslations<"Applications">>;
}) {
  const firstName = row.applicant.firstName;
  const lastName = row.applicant.lastName;
  const program = row.program.name;
  const email = row.applicant.email;
  const telephone = row.applicant.telephone;
  const Icon = getProgramIcon(row.programIconKey ?? program);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden shrink-0 md:flex">
        <ApplicantPhotoThumb
          photoUrl={row.applicant.photoUrl}
          photoStorageId={row.applicant.photoStorageId}
          applicationId={row._id}
          alt={`${firstName} ${lastName}`}
          initials={initials}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="wrap-break-word font-medium whitespace-normal">
            {firstName} {lastName}
          </div>
          <div className="flex items-center gap-1 md:hidden">
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
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground lg:hidden">
          <span className="font-mono uppercase">{t("program")}:</span>
          <Icon className="h-3 w-3" />
          <span>{program || "-"}</span>
        </div>
      </div>
    </div>
  );
}

function getAccountDisplayName(row: ApplicationListItem) {
  const fullName = `${row.account.firstName} ${row.account.lastName}`.trim();
  return fullName || row.account.email || "-";
}

function getAccountSortValue(row: ApplicationListItem) {
  const fullName = `${row.account.firstName} ${row.account.lastName}`.trim();
  return (fullName || row.account.email || "").toLowerCase();
}

function getAccountInitials(row: ApplicationListItem) {
  const fromName =
    `${row.account.firstName.charAt(0)}${row.account.lastName.charAt(0)}`.toUpperCase();
  return fromName || row.account.email.charAt(0).toUpperCase() || "U";
}

function ContactCell({ row }: { row: ApplicationListItem }) {
  const accountDisplayName = getAccountDisplayName(row);
  const accountInitials = getAccountInitials(row);

  return (
    <div className="flex flex-col gap-1 font-medium">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar
          src={row.account.imageUrl}
          initials={accountInitials}
          alt={accountDisplayName}
          className="size-6 bg-muted text-muted-foreground"
        />
        <span className="truncate">{accountDisplayName}</span>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Phone className="h-4 w-4" />
        <span>{row.applicant.telephone || "-"}</span>
      </div>
    </div>
  );
}

function useApplicationColumnsBase() {
  const locale = useLocale();
  const t = useTranslations("Applications");
  const statusMap = useStatusMap();

  return useMemo<ColumnDef<ApplicationListItem>[]>(() => {
    const fullNameHeader = (
      <>
        <span className="hidden lg:block">{t("fullName")}</span>
        <span className="lg:hidden">{t("athlete")}</span>
      </>
    );

    return [
      {
        accessorKey: "_creationTime",
        header: createSortableHeader(t("date")),
        cell: ({ row }) => {
          return formatApplicationDate(
            row.getValue("_creationTime") as number,
            locale,
          );
        },
        meta: {
          className: "hidden md:table-cell",
        },
      },
      {
        id: "fullName",
        header: createSortableHeader(fullNameHeader),
        accessorFn: (row) =>
          `${row.applicant.firstName} ${row.applicant.lastName}`.trim(),
        cell: ({ row }) => <ApplicantCell row={row.original} t={t} />,
      },
      {
        id: "program",
        header: createSortableHeader(t("program")),
        accessorFn: (row) => row.program.name,
        cell: ({ row }) => {
          const program = row.original.program.name;
          const Icon = getProgramIcon(row.original.programIconKey ?? program);
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{program || "-"}</span>
            </div>
          );
        },
        meta: {
          className: "hidden lg:table-cell",
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        id: "contact",
        header: createSortableHeader(t("contact")),
        accessorFn: (row) => getAccountSortValue(row),
        cell: ({ row }) => <ContactCell row={row.original} />,
        meta: {
          className: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: createSortableHeader(t("status")),
        cell: ({ row }) => {
          const status = row.getValue("status") as ApplicationStatus;
          const statusInfo = statusMap[status];
          return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        id: "sex",
        accessorFn: (row) => row.sex ?? "",
        enableHiding: false,
        meta: {
          className: "hidden",
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
    ];
  }, [locale, statusMap, t]);
}

export function useAdminApplicationColumns() {
  return useApplicationColumnsBase();
}

export function useClientApplicationColumns() {
  return useApplicationColumnsBase();
}

export function useApplicationFilters(
  applications: ApplicationListItem[],
): FilterConfig[] {
  const t = useTranslations("Applications");
  const tStatus = useTranslations("Applications.statusOptions");
  const tAthlete = useTranslations("preadmission.athlete");

  return useMemo(() => {
    const countValues = (values: string[]) =>
      values.reduce<Record<string, number>>((counts, value) => {
        counts[value] = (counts[value] ?? 0) + 1;
        return counts;
      }, {});

    const statusCounts = countValues(applications.map((row) => row.status));
    const programs = [...new Set(applications.map((row) => row.program.name))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const programCounts = countValues(
      applications.map((row) => row.program.name).filter(Boolean),
    );
    const sexCounts = countValues(
      applications
        .map((row) => row.sex)
        .filter((value): value is NonNullable<ApplicationListItem["sex"]> =>
          Boolean(value),
        ),
    );

    const filters: FilterConfig[] = [
      {
        id: "status",
        label: t("status"),
        options: [
          {
            value: "pending",
            label: tStatus("pending"),
            count: statusCounts.pending ?? 0,
          },
          {
            value: "reviewing",
            label: tStatus("reviewing"),
            count: statusCounts.reviewing ?? 0,
          },
          {
            value: "pre-admitted",
            label: tStatus("pre-admitted"),
            count: statusCounts["pre-admitted"] ?? 0,
          },
          {
            value: "admitted",
            label: tStatus("admitted"),
            count: statusCounts.admitted ?? 0,
          },
          {
            value: "denied",
            label: tStatus("denied"),
            count: statusCounts.denied ?? 0,
          },
        ],
      },
      {
        id: "program",
        label: t("program"),
        options: programs.map((program) => ({
          value: program,
          label: program,
          count: programCounts[program] ?? 0,
        })),
      },
    ];

    const sexOptions = [
      { value: "male", label: tAthlete("sexMale") },
      { value: "female", label: tAthlete("sexFemale") },
      { value: "other", label: tAthlete("sexOther") },
    ]
      .filter((option) => (sexCounts[option.value] ?? 0) > 0)
      .map((option) => ({
        ...option,
        count: sexCounts[option.value] ?? 0,
      }));

    if (sexOptions.length > 0) {
      filters.splice(1, 0, {
        id: "sex",
        label: tAthlete("sex"),
        options: sexOptions,
      });
    }

    return filters;
  }, [applications, t, tAthlete, tStatus]);
}
