"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAction, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  createSearchColumn,
  createSortableHeader,
} from "@/components/table/column-helpers";
import { DataTable } from "@/components/table/data-table";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type MemberRole = "superadmin" | "admin" | "coach" | "member";

type OrganizationMemberRow = {
  userId: Id<"users">;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  role: MemberRole;
  createdAt: number;
  headCoachTeams: Array<{
    clubId: Id<"clubs">;
    clubName: string;
    clubSlug: string;
  }>;
  headCoachTeamsText: string;
};

function getUserDisplayName(
  user: Pick<OrganizationMemberRow, "firstName" | "lastName" | "email">,
) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.email || "-";
}

function getUserInitials(
  user: Pick<OrganizationMemberRow, "firstName" | "lastName" | "email">,
) {
  const fromName =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  return fromName || user.email.charAt(0).toUpperCase() || "U";
}

interface OrganizationMembersTableProps {
  organizationSlug: string;
}

export function OrganizationMembersTable({
  organizationSlug,
}: OrganizationMembersTableProps) {
  const t = useTranslations("Settings.general.members.table");
  const tCommon = useTranslations("Common");
  const tTable = useTranslations("Common.table");
  const tActions = useTranslations("Common.actions");
  const { userId: currentClerkUserId } = useAuth();

  const [deleteTarget, setDeleteTarget] =
    useState<OrganizationMemberRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const organization = useQuery(api.organizations.getBySlug, {
    slug: organizationSlug,
  });
  const members = useQuery(
    api.members.listByOrganization,
    organization?._id ? { organizationId: organization._id } : "skip",
  );

  const deleteSingleTenantUser = useAction(api.users.deleteSingleTenantUser);

  const rows = useMemo<OrganizationMemberRow[]>(() => {
    if (!members) {
      return [];
    }

    return members.map(({ membership, user, headCoachTeams }) => ({
      userId: user._id,
      clerkUserId: user.clerkId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl,
      role: user.isSuperAdmin ? "superadmin" : membership.role,
      createdAt: membership._creationTime,
      headCoachTeams,
      headCoachTeamsText: headCoachTeams.map((team) => team.clubName).join(" "),
    }));
  }, [members]);

  const columns = useMemo<ColumnDef<OrganizationMemberRow>[]>(() => {
    return [
      createSearchColumn<OrganizationMemberRow>([
        "firstName",
        "lastName",
        "email",
        "role",
        "headCoachTeamsText",
      ]),
      {
        accessorKey: "createdAt",
        header: createSortableHeader(t("columns.createdAt")),
        meta: { className: "hidden md:table-cell" },
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt") as number;
          return new Date(createdAt).toLocaleDateString();
        },
      },
      {
        id: "user",
        header: createSortableHeader(t("columns.user")),
        accessorFn: (row) => getUserDisplayName(row).toLowerCase(),
        cell: ({ row }) => {
          const user = row.original;
          const displayName = getUserDisplayName(user);

          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                src={user.imageUrl}
                initials={getUserInitials(user)}
                alt={displayName}
                className="size-7 bg-muted text-muted-foreground"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={displayName}>
                  {displayName}
                </p>
                <p
                  className="truncate text-xs text-muted-foreground"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: createSortableHeader(t("columns.role")),
        cell: ({ row }) => {
          const member = row.original;
          const isSuper = member.role === "superadmin";

          if (isSuper) {
            return <Badge variant="secondary">{t("roles.superadmin")}</Badge>;
          }

          const isAdmin = member.role === "admin";
          const roleLabel = isAdmin
            ? t("roles.admin")
            : member.headCoachTeams.length > 0
              ? tCommon("staffRole.head_coach")
              : t("roles.coach");
          const teamLabel =
            member.headCoachTeams.length > 0
              ? member.headCoachTeams.map((team) => team.clubName).join(", ")
              : null;

          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              {teamLabel ? (
                <span className="text-xs text-muted-foreground">
                  {teamLabel}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: t("columns.actions"),
        meta: { className: "w-[1%] whitespace-nowrap" },
        cell: ({ row }) => {
          const member = row.original;
          const isSelf = member.clerkUserId === currentClerkUserId;
          const isSuper = member.role === "superadmin";
          const canDelete = !isSelf && !isSuper;

          return (
            <Button
              variant="ghost"
              size="icon"
              disabled={!canDelete}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canDelete) {
                  toast.error(t("toasts.cannotDelete"));
                  return;
                }
                setDeleteTarget(member);
              }}
              title={t("actions.delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          );
        },
      },
    ];
  }, [currentClerkUserId, t, tCommon]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSingleTenantUser({
        organizationSlug,
        clerkUserId: deleteTarget.clerkUserId,
      });
      toast.success(t("toasts.userDeleted"));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(t("toasts.userDeleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (organization === undefined) {
    return <TableSkeleton rows={8} />;
  }

  if (organization && members === undefined) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <>
      <div className="mt-2 text-xs text-muted-foreground">
        {t("summary", { count: rows.length })}
      </div>
      <DataTable
        data={rows}
        columns={columns}
        filterColumn="search"
        filterPlaceholder={t("searchPlaceholder")}
        emptyMessage={t("emptyMessage")}
        columnsMenuLabel={tTable("columns")}
        filtersMenuLabel={tTable("filters")}
        exportButtonLabel={tActions("export")}
        initialSorting={[{ id: "createdAt", desc: true }]}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", {
                email: deleteTarget?.email ?? "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tActions("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("actions.deleting") : tActions("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
