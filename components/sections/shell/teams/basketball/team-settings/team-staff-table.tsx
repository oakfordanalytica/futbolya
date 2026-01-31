"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation } from "convex/react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabel } from "@/components/ui/field";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

type StaffRole = "head_coach" | "technical_director" | "assistant_coach";

const ROLE_OPTIONS: { value: StaffRole; labelKey: string }[] = [
  { value: "head_coach", labelKey: "staffRole.head_coach" },
  { value: "technical_director", labelKey: "staffRole.technical_director" },
  { value: "assistant_coach", labelKey: "staffRole.assistant_coach" },
];

interface StaffRow {
  _id: string;
  userId: Id<"users">;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  categoryName?: string;
}

interface TeamStaffTableProps {
  clubSlug: string;
  orgSlug: string;
}

const ROLE_STYLES: Record<StaffRole, string> = {
  head_coach:
    "text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  technical_director:
    "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  assistant_coach:
    "text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950",
};

export function TeamStaffTable({ clubSlug, orgSlug }: TeamStaffTableProps) {
  const t = useTranslations("Common");
  const staffData = useQuery(api.staff.listAllByClubSlug, { clubSlug });
  const clubData = useQuery(api.clubs.getBySlug, { slug: clubSlug });
  const removeStaff = useMutation(api.staff.removeStaff);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("head_coach");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staffMembers = staffData?.staff ?? [];

  const resetForm = () => {
    setEmail("");
    setRole("head_coach");
  };

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!email.trim() || !clubData?._id) return;

    setIsSubmitting(true);

    try {
      // Call our API route to create Clerk organization invitation with staff metadata
      const response = await fetch("/api/staff/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailAddress: email.trim(),
          staffRole: role,
          clubId: clubData._id,
        }),
      });

      // Handle response - check for errors first
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success(t("staff.invitationSent"));
      resetForm();
      setIsCreateOpen(false);
    } catch (error) {
      console.error("[TeamStaffTable] Failed to invite staff:", error);
      toast.error(
        error instanceof Error ? error.message : t("staff.invitationFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    setIsDeleting(true);
    try {
      await removeStaff({
        staffId: staffToDelete._id as Id<"staff">,
      });
      toast.success(t("staff.deleted"));
      setStaffToDelete(null);
    } catch (error) {
      console.error("[TeamStaffTable] Failed to delete staff member:", error);
      toast.error(t("staff.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<StaffRow>[] = [
    createSearchColumn<StaffRow>(["fullName", "email", "role"]),

    {
      accessorKey: "fullName",
      header: createSortableHeader(t("staff.name")),
      cell: ({ row }) => {
        const fullName = row.original.fullName || row.original.email;
        const initials = fullName.slice(0, 2).toUpperCase();
        const avatarUrl = row.original.avatarUrl;

        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={avatarUrl}
              initials={avatarUrl ? undefined : initials}
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
      accessorKey: "email",
      header: createSortableHeader(t("staff.email")),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.email}
        </span>
      ),
    },

    {
      accessorKey: "role",
      header: createSortableHeader(t("staff.role")),
      cell: ({ row }) => {
        const role = row.original.role as StaffRole;
        const className = ROLE_STYLES[role] || ROLE_STYLES.head_coach;

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          >
            {t(`staffRole.${role}`)}
          </span>
        );
      },
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
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setStaffToDelete(row.original)}
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
        data={staffMembers}
        filterColumn="search"
        filterPlaceholder={t("staff.searchPlaceholder")}
        emptyMessage={t("staff.emptyMessage")}
        onCreate={() => setIsCreateOpen(true)}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("staff.invite")}</DialogTitle>
            <DialogDescription>
              {t("staff.inviteDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-6 mt-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>{t("form.email")}</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <FieldLabel className="invisible">Role</FieldLabel>

                <Select
                  value={role}
                  onValueChange={(value: StaffRole) => setRole(value)}
                >
                  <SelectTrigger className="w-[180px] mt-2">
                    <SelectValue placeholder={t("staff.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                {t("actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !email.trim()}>
                {isSubmitting ? t("actions.loading") : t("staff.sendInvite")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!staffToDelete}
        onOpenChange={() => setStaffToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("staff.deleteDescription", {
                name: staffToDelete?.fullName ?? staffToDelete?.email ?? "",
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
