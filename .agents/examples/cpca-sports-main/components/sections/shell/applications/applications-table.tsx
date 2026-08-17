"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/table/data-table";
import {
  useAdminApplicationColumns,
  useClientApplicationColumns,
  useApplicationFilters,
} from "@/components/sections/shell/applications/columns";
import { formatApplicationDate } from "@/components/sections/shell/applications/date-format";
import { ROUTES } from "@/lib/navigation/routes";
import type { ApplicationListItem } from "@/lib/applications/list-types";

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  organizationSlug: string;
  isAdmin: boolean;
}

export function ApplicationsTable({
  applications,
  organizationSlug,
  isAdmin,
}: ApplicationsTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Applications");
  const tTable = useTranslations("Common.table");
  const tActions = useTranslations("Common.actions");
  const adminColumns = useAdminApplicationColumns();
  const clientColumns = useClientApplicationColumns();
  const filters = useApplicationFilters(applications);

  const handleRowClick = (application: ApplicationListItem) => {
    router.push(
      ROUTES.org.applications.detail(organizationSlug, application._id),
    );
  };

  const handleCreate = () => {
    router.push(ROUTES.org.applications.create(organizationSlug));
  };

  const handleExport = isAdmin
    ? (rows: ApplicationListItem[]) => {
        const csv = convertToCSV(rows, t, locale);
        downloadCSV(
          csv,
          `applications-${organizationSlug}-${new Date().toISOString().split("T")[0]}.csv`,
        );
      }
    : undefined;
  const resultsCountLabel = (
    filtered: number,
    total: number,
    isFiltered: boolean,
  ) => {
    if (isFiltered) {
      return t("table.filteredCount", { count: filtered, total });
    }
    return isAdmin
      ? t("table.totalCountAdmin", { count: total })
      : t("table.totalCountClient", { count: total });
  };

  return (
    <DataTable
      data={applications}
      columns={isAdmin ? adminColumns : clientColumns}
      filterColumn="fullName"
      filterPlaceholder={t("searchPlaceholder")}
      emptyMessage={isAdmin ? t("emptyMessageAdmin") : t("emptyMessageClient")}
      columnsMenuLabel={tTable("columns")}
      exportButtonLabel={tActions("export")}
      filtersMenuLabel={tTable("filters")}
      filterConfigs={isAdmin ? filters : undefined}
      initialSorting={[{ id: "_creationTime", desc: true }]}
      resultsCountLabel={resultsCountLabel}
      onCreate={!isAdmin ? handleCreate : undefined}
      onExport={handleExport}
      onRowClick={handleRowClick}
    />
  );
}

function convertToCSV(
  data: ApplicationListItem[],
  t: ReturnType<typeof useTranslations<"Applications">>,
  locale: string,
): string {
  if (data.length === 0) return "";

  const headers = [
    t("table.exportHeaders.code"),
    t("status"),
    t("fullName"),
    t("table.exportHeaders.email"),
    t("table.exportHeaders.phone"),
    t("program"),
    t("contact"),
    t("table.exportHeaders.accountEmail"),
    t("table.exportHeaders.createdAt"),
  ];

  const rows = data.map((app) => {
    const fullName =
      `${app.applicant.firstName} ${app.applicant.lastName}`.trim();
    const accountName =
      `${app.account.firstName} ${app.account.lastName}`.trim() ||
      app.account.email;

    return [
      app.applicationCode,
      app.status,
      fullName,
      app.applicant.email,
      app.applicant.telephone,
      app.program.name,
      accountName,
      app.account.email,
      formatApplicationDate(app._creationTime, locale),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  return csvContent;
}

function downloadCSV(csv: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
