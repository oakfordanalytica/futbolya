"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Container } from "@/components/ui/container";
import { Label } from "@/components/ui/label";
import {
  ArrowLeftIcon,
  TrashIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;
  const staffId = params.staffId as Id<"profiles">;

  const staffData = useQuery(api.staff.getByProfileId, { profileId: staffId });
  const statistics = useQuery(api.staff.getStatistics, { profileId: staffId });

  const removeFromCategory = useMutation(api.staff.removeFromCategory);

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    categoryId: Id<"categories">;
    categoryName: string;
    clubName: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!staffData) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the staff member details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const handleRemove = async () => {
    if (!selectedAssignment) return;

    setLoading(true);
    try {
      const role =
        selectedAssignment.role === "Technical Director"
          ? ("technical_director" as const)
          : ("assistant_coach" as const);

      await removeFromCategory({
        categoryId: selectedAssignment.categoryId,
        profileId: staffId,
        role,
      });
      setIsRemoveOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to remove assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${orgSlug}/admin/staff`)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {staffData.profile.avatarUrl ? (
                <img
                  src={staffData.profile.avatarUrl}
                  alt={staffData.profile.displayName || "Staff Member"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {(staffData.profile.displayName ||
                      staffData.profile.email)[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {staffData.profile.displayName || staffData.profile.email}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {staffData.profile.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assignments
              </CardTitle>
              <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalAssignments || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Technical Director
              </CardTitle>
              <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.technicalDirectorCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Categories led</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Assistant Coach
              </CardTitle>
              <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.assistantCoachCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Categories assisted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Players
              </CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.totalPlayers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Under supervision</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Staff member contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="text-lg font-medium">
                {staffData.profile.displayName || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-lg font-medium">{staffData.profile.email}</p>
            </div>
            {staffData.profile.phoneNumber && (
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="text-lg font-medium">
                  {staffData.profile.phoneNumber}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Role Assignments</CardTitle>
            <CardDescription>
              {staffData.assignments.length} assignment
              {staffData.assignments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffData.assignments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No assignments yet</p>
                <p className="text-sm mt-1">
                  This staff member has not been assigned to any categories
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Club</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.assignments.map((assignment) => (
                      <tr
                        key={`${assignment.categoryId}-${assignment.role}`}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-4 font-medium">
                          {assignment.categoryName}
                        </td>
                        <td className="p-4">{assignment.clubName}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              assignment.role === "Technical Director"
                                ? "text-blue-600 bg-blue-50"
                                : "text-green-600 bg-green-50"
                            }`}
                          >
                            {assignment.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsRemoveOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remove Confirmation Dialog */}
        <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Assignment</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                {staffData.profile.displayName || staffData.profile.email} as{" "}
                {selectedAssignment?.role} from{" "}
                {selectedAssignment?.categoryName}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemoveOpen(false);
                  setSelectedAssignment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={loading}
              >
                {loading ? "Removing..." : "Remove Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}