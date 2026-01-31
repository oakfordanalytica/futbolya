"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/table/data-table";
import {
  useAdminApplicationColumns,
  useClientApplicationColumns,
  useApplicationFilters,
} from "@/components/sections/shell/applications/columns";
import { ROUTES } from "@/lib/navigation/routes";
import type { Application } from "@/lib/applications/types";
import { getFormField } from "@/lib/applications/types";

interface ApplicationsTableProps {
  applications: Application[];
  organizationSlug: string;
  isAdmin: boolean;
}

export function ApplicationsTable({
  applications,
  organizationSlug,
  isAdmin,
}: ApplicationsTableProps) {
  const router = useRouter();
  const t = useTranslations("Applications");
  const tTable = useTranslations("Common.table");
  const tActions = useTranslations("Common.actions");
  const adminColumns = useAdminApplicationColumns();
  const clientColumns = useClientApplicationColumns();
  const filters = useApplicationFilters();

  const handleRowClick = (application: Application) => {
    router.push(
      ROUTES.org.applications.detail(organizationSlug, application._id),
    );
  };

  const handleCreate = () => {
    router.push(ROUTES.org.applications.create(organizationSlug));
  };

  const handleExport = isAdmin
    ? (rows: Application[]) => {
        const csv = convertToCSV(rows, t);
        downloadCSV(
          csv,
          `applications-${organizationSlug}-${new Date().toISOString().split("T")[0]}.csv`,
        );
      }
    : undefined;

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
      onCreate={!isAdmin ? handleCreate : undefined}
      onExport={handleExport}
      onRowClick={handleRowClick}
    />
  );
}

function convertToCSV(
  data: Application[],
  t: ReturnType<typeof useTranslations<"Applications">>,
): string {
  if (data.length === 0) return "";

  const headers = [
    "Código",
    t("status"),
    "Nombre",
    "Apellido",
    "Email",
    "Teléfono",
    t("program"),
    t("grade"),
    "Fecha Nacimiento",
    "País",
    "Escuela Actual",
    "GPA",
    t("parent"),
    "Email Tutor",
    "Teléfono Tutor",
    "Fecha Creación",
  ];

  const rows = data.map((app) => {
    const { formData } = app;
    return [
      app.applicationCode,
      app.status,
      getFormField(formData, "athlete", "firstName"),
      getFormField(formData, "athlete", "lastName"),
      getFormField(formData, "athlete", "email"),
      getFormField(formData, "athlete", "telephone"),
      getFormField(formData, "athlete", "program"),
      getFormField(formData, "athlete", "gradeEntering"),
      getFormField(formData, "athlete", "birthDate"),
      getFormField(formData, "athlete", "countryOfBirth"),
      getFormField(formData, "school", "currentSchoolName"),
      getFormField(formData, "school", "currentGPA"),
      `${getFormField(formData, "parents", "parent1FirstName")} ${getFormField(formData, "parents", "parent1LastName")}`,
      getFormField(formData, "parents", "parent1Email"),
      getFormField(formData, "parents", "parent1Telephone"),
      new Date(app._creationTime).toLocaleDateString("es-ES"),
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
