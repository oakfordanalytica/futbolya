"use client";

import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import {
  createSearchColumn,
  createSortableHeader,
} from "@/components/table/column-helpers";
import { Calendar, MapPin } from "lucide-react";

interface GameRow {
  _id: string;
  date?: string;
  opponent: string;
  location?: string;
  teamPoints?: number;
  opponentPoints?: number;
  status: "scheduled" | "completed" | "cancelled";
}

interface TeamGamesListProps {
  clubSlug: string;
}

const STATUS_STYLES: Record<GameRow["status"], string> = {
  scheduled: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  completed: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950",
  cancelled: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950",
};

export function TeamGamesList({ clubSlug }: TeamGamesListProps) {
  const t = useTranslations("Common");

  // Stub: empty games list for now until games table exists in Convex
  const games: GameRow[] = [];

  const columns: ColumnDef<GameRow>[] = [
    createSearchColumn<GameRow>(["opponent", "location"]),

    {
      accessorKey: "date",
      header: createSortableHeader(t("games.date")),
      cell: ({ row }) => {
        const date = row.original.date;
        if (!date) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(date).toLocaleDateString()}
            </span>
          </div>
        );
      },
    },

    {
      accessorKey: "opponent",
      header: createSortableHeader(t("games.opponent")),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.opponent}</span>
      ),
    },

    {
      accessorKey: "location",
      header: createSortableHeader(t("games.location")),
      cell: ({ row }) => {
        const location = row.original.location;
        if (!location) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{location}</span>
          </div>
        );
      },
    },

    {
      accessorKey: "score",
      header: createSortableHeader(t("games.score")),
      cell: ({ row }) => {
        const { teamPoints, opponentPoints, status } = row.original;

        if (
          status !== "completed" ||
          teamPoints === undefined ||
          opponentPoints === undefined
        ) {
          return <span className="text-muted-foreground">—</span>;
        }

        const isWin = teamPoints > opponentPoints;
        const isLoss = teamPoints < opponentPoints;

        return (
          <span
            className={`font-medium ${
              isWin
                ? "text-green-600 dark:text-green-400"
                : isLoss
                  ? "text-red-600 dark:text-red-400"
                  : ""
            }`}
          >
            {teamPoints} - {opponentPoints}
          </span>
        );
      },
    },

    {
      accessorKey: "status",
      header: createSortableHeader(t("games.status")),
      cell: ({ row }) => {
        const status = row.original.status;
        const className = STATUS_STYLES[status];

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          >
            {t(`games.statusOptions.${status}`)}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={games}
      filterColumn="search"
      filterPlaceholder={t("games.searchPlaceholder")}
      emptyMessage={t("games.emptyMessage")}
    />
  );
}
