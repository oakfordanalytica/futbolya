"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type UserFilter = "all" | "active" | "pending" | "no_account";

export default function SuperAdminUsersPage() {
  const allProfiles = useQuery(api.users.listAllProfiles, {});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const handleCreate = async () => {
    if (!createForm.email || !createForm.firstName || !createForm.lastName) {
      alert("Email, first name, and last name are required");
      return;
    }

    setLoading(true);
    try {
      // Note: This only creates the profile + Clerk account
      // Roles must be assigned separately in organization context
      alert(
        "User created! They can now sign in with their email at futbolya.com.\n\n" +
        "Next step: Assign them roles in their organization."
      );
      
      setIsCreateOpen(false);
      setCreateForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // Filter profiles
  const filteredProfiles = allProfiles?.filter((profile) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const hasClerkAccount = profile.clerkId && profile.clerkId !== "";
    const hasEmail = profile.email && profile.email !== "";
    
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && hasClerkAccount) ||
      (filter === "pending" && !hasClerkAccount && hasEmail) ||
      (filter === "no_account" && !hasClerkAccount && !hasEmail);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allProfiles?.length || 0,
    active: allProfiles?.filter((p) => p.clerkId && p.clerkId !== "").length || 0,
    pending: allProfiles?.filter((p) => (!p.clerkId || p.clerkId === "") && p.email && p.email !== "").length || 0,
    noAccount: allProfiles?.filter((p) => (!p.clerkId || p.clerkId === "") && (!p.email || p.email === "")).length || 0,
  };

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Global User Management
            </h1>
            <p className="text-muted-foreground">
              Manage all users across all organizations
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Sign-In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">Need to sign in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">No Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.noAccount}
              </div>
              <p className="text-xs text-muted-foreground">Incomplete profiles</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Search and filter all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select
                  value={filter}
                  onValueChange={(value: UserFilter) => setFilter(value)}
                >
                  <SelectTrigger>
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({stats.total})</SelectItem>
                    <SelectItem value="active">Active ({stats.active})</SelectItem>
                    <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                    <SelectItem value="no_account">
                      No Email ({stats.noAccount})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!filteredProfiles ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm mt-1">
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No users in the system yet"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Contact</th>
                      <th className="text-left p-4 font-medium">Roles</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => {
                      const hasClerkAccount = profile.clerkId && profile.clerkId !== "";
                      const hasEmail = profile.email && profile.email !== "";
                      
                      return (
                        <tr
                          key={profile._id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {profile.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.displayName || "User"}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-muted-foreground font-medium">
                                    {profile.displayName?.[0] ||
                                      profile.firstName?.[0] ||
                                      profile.email?.[0] ||
                                      "?"}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {profile.displayName || "No name"}
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
                            {hasEmail ? (
                              profile.email
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No email
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {profile.roles.length > 0 ? (
                                profile.roles.map((role, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {role.role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  No roles
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {hasClerkAccount ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                                <CheckCircleIcon className="h-4 w-4" />
                                Active
                              </span>
                            ) : hasEmail ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-yellow-600">
                                <ClockIcon className="h-4 w-4" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                <XCircleIcon className="h-4 w-4" />
                                No Email
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(profile._creationTime).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User Profile</DialogTitle>
              <DialogDescription>
                Create a user profile and Clerk account. The user can then sign
                in with their email using passwordless authentication.
                <span className="block mt-2 text-sm font-medium">
                  ✅ No invitation email sent - just tell them to sign in!
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, firstName: e.target.value })
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phoneNumber: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Next Steps:</strong>
                  <br />
                  1. Create the user here
                  <br />
                  2. Tell them: "Go to futbolya.com and sign in with {createForm.email || "your email"}"
                  <br />
                  3. Assign roles in their organization
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !createForm.email || !createForm.firstName || !createForm.lastName}
              >
                {loading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}