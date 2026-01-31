"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import {
  createSearchColumn,
  createSortableHeader,
} from "@/components/table/column-helpers";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CreatePlayerDialog } from "./create-player-dialog";

interface PlayerRow {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  status: "active" | "inactive";
  height?: number | null;
  weight?: number | null;
  categoryName?: string | null;
}

interface TeamPlayersTableProps {
  players: PlayerRow[];
  clubSlug: string;
  orgSlug: string;
}

const POSITION_LABELS: Record<string, string> = {
  point_guard: "PG",
  shooting_guard: "SG",
  small_forward: "SF",
  power_forward: "PF",
  center: "C",
};

export function TeamPlayersTable({
  players,
  clubSlug,
  orgSlug,
}: TeamPlayersTableProps) {
  const t = useTranslations("Common");
  const deletePlayer = useMutation(api.players.deletePlayer);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!playerToDelete) return;

    setIsDeleting(true);
    try {
      await deletePlayer({
        playerId: playerToDelete._id as Id<"players">,
      });
      setPlayerToDelete(null);
    } catch (error) {
      console.error("[TeamPlayersTable] Failed to delete player:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<PlayerRow>[] = [
    createSearchColumn<PlayerRow>(["firstName", "lastName", "position"]),

    {
      accessorKey: "firstName",
      header: createSortableHeader(t("players.name")),
      cell: ({ row }) => {
        const fullName = `${row.original.firstName} ${row.original.lastName}`;
        const initials =
          `${row.original.firstName.charAt(0)}${row.original.lastName.charAt(0)}`.toUpperCase();
        const photoUrl = row.original.photoUrl;

        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={photoUrl || undefined}
              initials={photoUrl ? undefined : initials}
              alt={fullName}
              className="size-10"
            />
            <div>
              <span className="font-medium">{fullName}</span>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "jerseyNumber",
      header: createSortableHeader("#"),
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.jerseyNumber ?? "—"}
        </span>
      ),
    },

    {
      accessorKey: "position",
      header: createSortableHeader(t("players.position")),
      cell: ({ row }) => {
        const position = row.original.position;
        const label = position ? POSITION_LABELS[position] || position : "—";
        return <span className="text-sm text-muted-foreground">{label}</span>;
      },
    },

    {
      accessorKey: "height",
      header: createSortableHeader(t("players.height")),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.height ? `${row.original.height} cm` : "—"}
        </span>
      ),
    },

    {
      accessorKey: "weight",
      header: createSortableHeader(t("players.weight")),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.weight ? `${row.original.weight} kg` : "—"}
        </span>
      ),
    },

    {
      accessorKey: "categoryName",
      header: createSortableHeader(t("players.category")),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.categoryName || t("players.notAssigned")}
        </span>
      ),
    },

    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="size-4 mr-2" />
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setPlayerToDelete(row.original)}
              >
                <Trash2 className="size-4 mr-2" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={players}
        filterColumn="search"
        filterPlaceholder={t("players.searchPlaceholder")}
        emptyMessage={t("players.emptyMessage")}
        onCreate={() => setIsCreateOpen(true)}
      />

      <CreatePlayerDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        clubSlug={clubSlug}
      />

      <AlertDialog
        open={!!playerToDelete}
        onOpenChange={() => setPlayerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("players.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("players.deleteDescription", {
                name: playerToDelete
                  ? `${playerToDelete.firstName} ${playerToDelete.lastName}`
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("actions.loading") : t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
