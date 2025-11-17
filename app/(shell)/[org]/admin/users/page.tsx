"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function UsersManagementPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // Query to get profiles for the current organization
  const profiles = useQuery(api.users.listProfilesInOrg, {
    orgSlug,
    orgType: "club", // You'd determine this dynamically based on context
  });

  // Get current user's role to determine permissions
  const myRole = useQuery(api.users.getMyRoleInOrg, {
    orgSlug,
    orgType: "club",
  });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "ClubAdmin" as "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Referee",
  });

  // Check permissions
  if (!myRole || (myRole !== "SuperAdmin" && myRole !== "LeagueAdmin" && myRole !== "ClubAdmin")) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to manage users.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their access to your organization
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Invite a user and assign them a role in your organization
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="admin-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    placeholder="user@example.com"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    User will receive an invitation email
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admin-firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="admin-firstName"
                      value={adminForm.firstName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="admin-lastName"
                      value={adminForm.lastName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin-phone">Phone Number</Label>
                  <Input
                    id="admin-phone"
                    type="tel"
                    value={adminForm.phoneNumber}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, phoneNumber: e.target.value })
                    }
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={adminForm.role}
                    onValueChange={(value: "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Referee") =>
                      setAdminForm({ ...adminForm, role: value })
                    }
                  >
                    <SelectTrigger id="admin-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {myRole === "SuperAdmin" && (
                        <SelectItem value="LeagueAdmin">League Admin</SelectItem>
                      )}
                      <SelectItem value="ClubAdmin">Club Admin</SelectItem>
                      <SelectItem value="TechnicalDirector">
                        Technical Director
                      </SelectItem>
                      <SelectItem value="Referee">Referee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        // TODO: Implement user invitation mutation
                        alert("User invitation feature coming soon!");
                        setOpen(false);
                      } catch (error) {
                        console.error(error);
                        alert(error instanceof Error ? error.message : "Failed to invite user");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={
                      loading ||
                      !adminForm.email ||
                      !adminForm.firstName ||
                      !adminForm.lastName
                    }
                  >
                    {loading ? "Inviting..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Users</CardTitle>
            <CardDescription>
              Users with access to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!profiles ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No users found. Invite your first user to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {profile.avatarUrl && (
                              <img
                                src={profile.avatarUrl}
                                alt={profile.displayName || profile.email}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">
                                {profile.displayName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim()}
                              </div>
                              {profile.phoneNumber && (
                                <div className="text-sm text-muted-foreground">
                                  {profile.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {profile.email || (
                            <span className="text-muted-foreground">No email</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {profile.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {profile.clerkId ? (
                            <span className="inline-flex items-center gap-1 text-sm text-green-600">
                              <span className="h-2 w-2 rounded-full bg-green-600" />
                              Active
                            </span>
                          ) : profile.email ? (
                            <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
                              <span className="h-2 w-2 rounded-full bg-yellow-600" />
                              Invited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <span className="h-2 w-2 rounded-full bg-gray-600" />
                              No Email
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            Manage
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
      </div>
    </Container>
  );
}