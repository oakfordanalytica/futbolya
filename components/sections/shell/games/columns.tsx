import { ColumnDef } from "@tanstack/react-table";
import {
  createSearchColumn,
  createSortableHeader,
} from "@/components/table/column-helpers";
import type { FilterConfig } from "@/lib/table/types";

export interface GameRow {
  _id: string;
  _creationTime: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  date: string;
  startTime: string;
  category: string;
  gender: "male" | "female" | "mixed";
  locationName?: string;
  locationCoordinates?: number[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  homeScore?: number;
  awayScore?: number;
}

type Translator = (key: string) => string;

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  in_progress:
    "text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
  completed: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950",
  cancelled: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950",
};

export function createGameColumns(t: Translator): ColumnDef<GameRow>[] {
  return [
    createSearchColumn<GameRow>([
      "homeTeamName",
      "awayTeamName",
      "locationName",
      "category",
    ]),

    {
      accessorKey: "teams",
      header: t("games.match"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.homeTeamName}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="font-medium">{row.original.awayTeamName}</span>
        </div>
      ),
    },

    {
      accessorKey: "date",
      header: createSortableHeader(t("games.dateTime")),
      cell: ({ row }) => {
        const date = row.original.date;
        const time = row.original.startTime;
        return (
          <span className="text-sm">
            {date ? new Date(date).toLocaleDateString() : "—"}
            {time && ` · ${time}`}
          </span>
        );
      },
    },

    {
      accessorKey: "category",
      header: t("games.category"),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.category || "—"}</span>
      ),
    },

    {
      accessorKey: "gender",
      header: t("games.gender"),
      cell: ({ row }) => (
        <span className="text-sm">{t(`gender.${row.original.gender}`)}</span>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    {
      accessorKey: "locationName",
      header: t("games.location"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.locationName || "—"}
        </span>
      ),
    },

    {
      accessorKey: "status",
      header: t("games.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const className = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}
          >
            {t(`games.statusOptions.${status}`)}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    {
      accessorKey: "score",
      header: t("games.score"),
      cell: ({ row }) => {
        const { homeScore, awayScore, status } = row.original;
        if (status === "scheduled" || status === "cancelled") {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <span className="text-sm font-medium">
            {homeScore ?? 0} - {awayScore ?? 0}
          </span>
        );
      },
    },
  ];
}

export function createGameFilterConfigs(t: Translator): FilterConfig[] {
  return [
    {
      id: "status",
      label: t("games.status"),
      options: [
        { value: "scheduled", label: t("games.statusOptions.scheduled") },
        { value: "in_progress", label: t("games.statusOptions.in_progress") },
        { value: "completed", label: t("games.statusOptions.completed") },
        { value: "cancelled", label: t("games.statusOptions.cancelled") },
      ],
    },
    {
      id: "gender",
      label: t("games.gender"),
      options: [
        { value: "male", label: t("gender.male") },
        { value: "female", label: t("gender.female") },
        { value: "mixed", label: t("gender.mixed") },
      ],
    },
  ];
}
