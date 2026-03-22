import { ColumnDef } from "@tanstack/react-table";
import {
  createSearchColumn,
  createSortableHeader,
} from "@/components/table/column-helpers";
import type { FilterConfig } from "@/lib/table/types";
import type { GameStatus } from "@/lib/games/status";
import { Avatar } from "@/components/ui/avatar";
import { formatIsoDateAsLocal } from "@/lib/utils/date";

export interface GameRow {
  _id: string;
  _creationTime: number;
  seasonId?: string;
  gameType?: "quick" | "season";
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  date: string;
  startTime: string;
  category: string;
  gender: "male" | "female" | "mixed";
  locationName?: string;
  locationCoordinates?: number[];
  status: GameStatus;
  homeScore?: number;
  awayScore?: number;
}

type Translator = (key: string) => string;

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  in_progress:
    "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
  halftime:
    "text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950",
  completed: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950",
  cancelled: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950",
};

const GAME_TYPE_STYLES: Record<"quick" | "season", string> = {
  quick: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-900/70",
  season:
    "text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950",
};

function MatchTeam({ name, logoUrl }: { name: string; logoUrl?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        src={logoUrl}
        initials={name.charAt(0).toUpperCase()}
        alt={name}
        className="size-6 bg-muted text-muted-foreground"
      />
      <span className="truncate font-medium">{name}</span>
    </div>
  );
}

export function createGameColumns(t: Translator): ColumnDef<GameRow>[] {
  return [
    createSearchColumn<GameRow>([
      "homeTeamName",
      "awayTeamName",
      "locationName",
      "category",
      "gameType",
    ]),

    {
      accessorKey: "teams",
      header: t("games.match"),
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <MatchTeam
            name={row.original.homeTeamName}
            logoUrl={row.original.homeTeamLogo}
          />
          <span className="text-muted-foreground">vs</span>
          <MatchTeam
            name={row.original.awayTeamName}
            logoUrl={row.original.awayTeamLogo}
          />
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
            {date ? formatIsoDateAsLocal(date) : "—"}
            {time && ` · ${time}`}
          </span>
        );
      },
    },

    {
      accessorKey: "gameType",
      header: t("games.type"),
      cell: ({ row }) => {
        const resolvedGameType: "quick" | "season" =
          row.original.gameType ?? (row.original.seasonId ? "season" : "quick");
        const className = GAME_TYPE_STYLES[resolvedGameType];
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}
          >
            {t(`games.typeOptions.${resolvedGameType}`)}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        const resolvedGameType =
          (row.original.gameType ??
            (row.original.seasonId ? "season" : "quick")) === "season"
            ? "season"
            : "quick";
        return value.includes(resolvedGameType);
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
        const hasRecordedScore =
          typeof homeScore === "number" && typeof awayScore === "number";
        if (status === "cancelled" || !hasRecordedScore) {
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
        {
          value: "in_progress",
          label: t("games.statusOptions.in_progress"),
        },
        { value: "halftime", label: t("games.statusOptions.halftime") },
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
    {
      id: "gameType",
      label: t("games.type"),
      options: [
        { value: "quick", label: t("games.typeOptions.quick") },
        { value: "season", label: t("games.typeOptions.season") },
      ],
    },
  ];
}
