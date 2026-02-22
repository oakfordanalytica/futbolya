"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { ApplicationStatus } from "@/lib/applications/types";
import type { ApplicationListItem } from "@/lib/applications/list-types";
import type { FilterConfig } from "@/lib/table/types";
import { CiBaseball, CiBasketball } from "react-icons/ci";
import { GiSoccerBall, GiTennisRacket } from "react-icons/gi";
import { PiVolleyball, PiBaseball } from "react-icons/pi";
import { IoGolfOutline } from "react-icons/io5";
import type { IconType } from "react-icons";
import { Mail, Phone, CircleX, CircleCheck } from "lucide-react";
import { getCountryName } from "@/lib/countries/countries";
import { ApplicationPhoto } from "./detail/pre-admission/application-photo";
import { useState } from "react";
import { createSortableHeader } from "@/components/table/column-helpers";
import { Avatar } from "@/components/ui/avatar";

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

function ApplicantPhotoThumb({
  photoUrl,
  photoStorageId,
  applicationId,
  alt,
  initials,
}: {
  photoUrl?: string;
  photoStorageId?: ApplicationListItem["athlete"]["photoStorageId"];
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
        className="w-10 h-10 rounded-md border object-cover"
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
    <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
      <span className="text-primary-foreground text-sm font-semibold">
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
  const firstName = row.athlete.firstName;
  const lastName = row.athlete.lastName;
  const program = row.athlete.program;
  const telephone = row.parent.telephone;
  const email = row.parent.email;
  const countryOfBirth = row.athlete.countryOfBirth;
  const countryOfCitizen = row.athlete.countryOfCitizenship;
  const graduationYear = row.athlete.graduationYear;
  const needsI20 = row.athlete.needsI20;
  const hasVisa = needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
  const Icon = getSportIcon(program);
  const photoUrl = row.athlete.photoUrl;
  const photoStorageId = row.athlete.photoStorageId;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex shrink-0">
        <ApplicantPhotoThumb
          photoUrl={photoUrl}
          photoStorageId={photoStorageId}
          applicationId={row._id}
          alt={`${firstName} ${lastName}`}
          initials={initials}
        />
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
                {getCountryName(countryOfBirth) || "-"}
              </span>
            </div>
          )}
          {countryOfCitizen && (
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("citizenship")}:</span>
              <span className="text-muted-foreground ml-1">
                {getCountryName(countryOfCitizen) || "-"}
              </span>
            </div>
          )}
          {graduationYear && (
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">
                {t("graduationYear")}:
              </span>
              <span className="text-muted-foreground ml-1">
                {graduationYear}
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
}

function getAccountDisplayName(row: ApplicationListItem): string {
  const fullName = `${row.account.firstName} ${row.account.lastName}`.trim();
  return fullName || row.account.email || "-";
}

function getAccountSortValue(row: ApplicationListItem): string {
  const fullName = `${row.account.firstName} ${row.account.lastName}`.trim();
  return (fullName || row.account.email || "").toLowerCase();
}

function getAccountInitials(row: ApplicationListItem): string {
  const fromName =
    `${row.account.firstName.charAt(0)}${row.account.lastName.charAt(0)}`.toUpperCase();
  return fromName || row.account.email.charAt(0).toUpperCase() || "U";
}

function ContactCell({ row }: { row: ApplicationListItem }) {
  const accountDisplayName = getAccountDisplayName(row);
  const accountInitials = getAccountInitials(row);
  const telephone = row.parent.telephone;

  return (
    <div className="flex flex-col gap-1 font-medium">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar
          src={row.account.imageUrl}
          initials={accountInitials}
          alt={accountDisplayName}
          className="size-6 bg-muted text-muted-foreground"
        />
        <span className="truncate">{accountDisplayName}</span>
      </div>
      <div className="flex flex-row items-center">
        <Phone className="h-4 w-4 mr-1" />
        {telephone || "-"}
      </div>
    </div>
  );
}

export function useAdminApplicationColumns(): ColumnDef<ApplicationListItem>[] {
  const t = useTranslations("Applications");
  const statusMap = useStatusMap();
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
        const date = new Date(row.getValue("_creationTime") as number);
        return date.toLocaleDateString("en-EN");
      },
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      id: "fullName",
      header: createSortableHeader(fullNameHeader),
      accessorFn: (row) =>
        `${row.athlete.firstName} ${row.athlete.lastName}`.trim(),
      cell: ({ row }) => <ApplicantCell row={row.original} t={t} />,
    },
    {
      id: "sex",
      accessorFn: (row) => row.athlete.sex,
      header: t("detail.sex"),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => row.original.athlete.sex,
      meta: {
        className: "hidden",
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "program",
      header: createSortableHeader(t("program")),
      meta: { className: "hidden lg:table-cell" },
      accessorFn: (row) => row.athlete.program,
      cell: ({ row }) => {
        const program = row.original.athlete.program;
        const Icon = getSportIcon(program);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{program}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "country",
      header: createSortableHeader(t("country")),
      accessorFn: (row) => row.athlete.countryOfBirth,
      cell: ({ row }) => {
        const countryOfBirth = row.original.athlete.countryOfBirth;
        const countryOfCitizen = row.original.athlete.countryOfCitizenship;
        return (
          <div className="flex flex-col">
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("birth")}:</span>
              <span className="text-muted-foreground ml-1">
                {getCountryName(countryOfBirth) || "-"}
              </span>
            </div>
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("citizenship")}:</span>
              <span className="text-muted-foreground ml-1">
                {getCountryName(countryOfCitizen) || "-"}
              </span>
            </div>
          </div>
        );
      },
      meta: {
        className: "hidden lg:table-cell",
      },
    },
    {
      id: "graduationYear",
      header: createSortableHeader(t("graduationYear")),
      accessorFn: (row) => row.athlete.graduationYear,
      cell: ({ row }) => {
        return (
          <div className="text-sm">{row.original.athlete.graduationYear}</div>
        );
      },
      meta: {
        className: "hidden lg:table-cell",
      },
    },
    {
      id: "visaStatus",
      header: createSortableHeader(t("visaStatus")),
      accessorFn: (row) => row.athlete.needsI20,
      cell: ({ row }) => {
        const needsI20 = row.original.athlete.needsI20;
        const hasVisa =
          needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        return (
          <div className="flex">
            {hasVisa ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <CircleX className="h-4 w-4 text-red-600" />
            )}
          </div>
        );
      },
      meta: {
        className: "hidden lg:table-cell",
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

export function useClientApplicationColumns(): ColumnDef<ApplicationListItem>[] {
  const t = useTranslations("Applications");
  const statusMap = useStatusMap();
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
        const date = new Date(row.getValue("_creationTime") as number);
        return date.toLocaleDateString("en-EN");
      },
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      id: "fullName",
      header: createSortableHeader(fullNameHeader),
      accessorFn: (row) =>
        `${row.athlete.firstName} ${row.athlete.lastName}`.trim(),
      cell: ({ row }) => <ApplicantCell row={row.original} t={t} />,
    },
    {
      id: "program",
      header: createSortableHeader(t("program")),
      meta: { className: "hidden lg:table-cell" },
      accessorFn: (row) => row.athlete.program,
      cell: ({ row }) => {
        const program = row.original.athlete.program;
        const Icon = getSportIcon(program);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{program}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "country",
      header: createSortableHeader(t("country")),
      meta: { className: "hidden lg:table-cell" },
      accessorFn: (row) => row.athlete.countryOfBirth,
      cell: ({ row }) => {
        const countryOfBirth = row.original.athlete.countryOfBirth;
        const countryOfCitizen = row.original.athlete.countryOfCitizenship;
        return (
          <div className="flex flex-col">
            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("birth")}:</span>
              <span className="text-muted-foreground ml-1">
                {getCountryName(countryOfBirth) || "-"}
              </span>
            </div>

            <div className="inline-flex items-center text-xs">
              <span className="font-mono uppercase">{t("citizenship")}:</span>
              <span className="text-muted-foreground ml-1">
                {getCountryName(countryOfCitizen) || "-"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "graduationYear",
      header: createSortableHeader(t("graduationYear")),
      meta: { className: "hidden lg:table-cell" },
      accessorFn: (row) => row.athlete.graduationYear,
      cell: ({ row }) => {
        return (
          <div className="text-sm">{row.original.athlete.graduationYear}</div>
        );
      },
    },
    {
      id: "visaStatus",
      header: createSortableHeader(t("visaStatus")),
      meta: { className: "hidden lg:table-cell" },
      accessorFn: (row) => row.athlete.needsI20,
      cell: ({ row }) => {
        const needsI20 = row.original.athlete.needsI20;
        const hasVisa =
          needsI20 === "no-citizen" || needsI20 === "no-non-citizen";
        return (
          <div className="flex">
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
      header: createSortableHeader(t("contact")),
      accessorFn: (row) => getAccountSortValue(row),
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => <ContactCell row={row.original} />,
    },
    {
      accessorKey: "status",
      header: createSortableHeader(t("status")),
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
  const tGender = useTranslations("Common.gender");

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
      id: "sex",
      label: t("detail.sex"),
      options: [
        { value: "male", label: tGender("male") },
        { value: "female", label: tGender("female") },
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
