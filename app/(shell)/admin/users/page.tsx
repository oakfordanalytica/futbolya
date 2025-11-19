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
  BuildingOfficeIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type UserFilter = "all" | "active" | "pending" | "no_account";
type TargetRole = "SuperAdmin" | "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Referee";

export default function SuperAdminUsersPage() {
  // Data Fetching
  const allProfiles = useQuery(api.users.listAllProfiles, {});
  const leagues = useQuery(api.leagues.listAll) || [];
  const clubs = useQuery(api.clubs.listAll) || [];
  
  const createAdminUser = useMutation(api.users.createAdminUser);
  const deleteUser = useMutation(api.users.deleteUser);

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  // Form State
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "" as TargetRole | "",
    orgId: "",
  });

  // Determine Organization Type based on Role
  const getOrgTypeForRole = (role: string) => {
    switch (role) {
      case "SuperAdmin": return "system";
      case "LeagueAdmin":
      case "Referee": return "league";
      case "ClubAdmin":
      case "TechnicalDirector": return "club";
      default: return null;
    }
  };

  const handleCreate = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.role) {
      alert("Please fill in all required fields");
      return;
    }

    const orgType = getOrgTypeForRole(form.role);
    
    // Validate Org Selection (unless SuperAdmin)
    if (form.role !== "SuperAdmin" && !form.orgId) {
      alert(`Please select a ${orgType} for this user`);
      return;
    }

    setLoading(true);
    try {
      await createAdminUser({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber || undefined,
        role: form.role as any, // Casting to strict union type
        organizationId: form.role === "SuperAdmin" ? undefined : form.orgId,
        organizationType: orgType as "league" | "club" | "system",
      });

      alert(`User created successfully! They can now sign in with ${form.email}`);
      
      setIsCreateOpen(false);
      setForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "",
        orgId: "",
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!managingUser) return;
    
    if (!confirm(`Are you sure you want to delete ${managingUser.email}? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteUser({ profileId: managingUser._id });
      setManagingUser(null); // Close dialog
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter profiles logic
  const filteredProfiles = allProfiles?.filter((profile) => {
    const matchesSearch =
      !searchTerm ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

    const hasClerkAccount = !!profile.clerkId;
    const hasEmail = !!profile.email;
    
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && hasClerkAccount) ||
      (filter === "pending" && !hasClerkAccount && hasEmail) ||
      (filter === "no_account" && !hasClerkAccount && !hasEmail);

    return matchesSearch && matchesFilter;
  });

  // Stats calculation
  const stats = {
    total: allProfiles?.length || 0,
    active: allProfiles?.filter((p) => p.clerkId).length || 0,
    pending: allProfiles?.filter((p) => !p.clerkId && p.email).length || 0,
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
              Provision users and assign their access rights
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Provision User
          </Button>
        </div>

        {/* Stats Cards - Kept consistent */}
        <div className="grid gap-6 md:grid-cols-3">
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
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Synced with Clerk</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting sign-in</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Search and filter all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-0"
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="no_account">No Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            {!filteredProfiles ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm mt-1">Adjust your filters or provision a new user</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">User Details</th>
                      <th className="text-left p-4 font-medium">Role & Organization</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr key={profile._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {profile.avatarUrl ? (
                              <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {(profile.displayName || profile.email || "?")[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{profile.displayName || "Unknown"}</div>
                              <div className="text-sm text-muted-foreground">{profile.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {profile.roles.length > 0 ? (
                              profile.roles.map((r, idx) => {
                                // Helper to find org name (optimistic UI)
                                const league = leagues?.find(l => l._id === r.organizationId);
                                const club = clubs?.find(c => c._id === r.organizationId);
                                const orgName = r.organizationType === "system" ? "Global" : 
                                              league?.name || club?.name || "Unknown Org";
                                
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                      r.role === "SuperAdmin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                      r.role === "LeagueAdmin" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      "bg-gray-50 text-gray-700 border-gray-200"
                                    }`}>
                                      {r.role}
                                    </span>
                                    <span className="text-muted-foreground">at {orgName}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No roles assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {profile.clerkId ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                              <CheckCircleIcon className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-yellow-600 font-medium">
                              <ClockIcon className="h-4 w-4" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setManagingUser(profile)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* NEW: Manage User Dialog */}
            <Dialog open={!!managingUser} onOpenChange={(open) => !open && setManagingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage User</DialogTitle>
                  <DialogDescription>
                    View details and manage access for this user.
                  </DialogDescription>
                </DialogHeader>

                {managingUser && (
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                      {managingUser.avatarUrl ? (
                        <img 
                          src={managingUser.avatarUrl} 
                          className="h-16 w-16 rounded-full object-cover border" 
                          alt="" 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                          {(managingUser.displayName || managingUser.email || "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium leading-none">
                          {managingUser.displayName || "No Name Set"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {managingUser.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {managingUser.clerkId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircleIcon className="h-3 w-3" /> Account Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full">
                              <ClockIcon className="h-3 w-3" /> Invite Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Assigned Roles</Label>
                      <div className="rounded-md border p-1 bg-muted/30 min-h-[60px]">
                        {managingUser.roles.length > 0 ? (
                            <div className="flex flex-col gap-1 p-2">
                              {managingUser.roles.map((r: any, idx: number) => (
                                // You can copy the role rendering logic from the table here if you want nicely formatted names
                                <div key={idx} className="text-sm flex justify-between items-center">
                                    <span className="font-medium">{r.role}</span>
                                    <span className="text-muted-foreground text-xs font-mono">
                                      {r.organizationType === 'system' ? 'Global' : r.organizationType === 'league' ? 'League' : r.organizationType === 'club' ? 'Club' : r.organizationId}
                                    </span>
                                </div>
                              ))}
                            </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                            No active roles
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleDeleteUser}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? "Deleting..." : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete User Permanently
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        This will remove the user profile, all roles, and their login account.
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Enhanced Create User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Provision New User</DialogTitle>
              <DialogDescription>
                Create a user account and immediately assign their organizational role.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="e.g. John"
                    value={form.firstName}
                    onChange={e => setForm({...form, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="e.g. Doe"
                    value={form.lastName}
                    onChange={e => setForm({...form, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  They will use this email to sign in. No password setup required.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Assignment</Label>
                  <Select 
                    value={form.role} 
                    onValueChange={(v: TargetRole) => setForm({...form, role: v, orgId: ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SuperAdmin" className="font-bold text-purple-600">Global SuperAdmin</SelectItem>
                      <SelectItem value="LeagueAdmin">League Administrator</SelectItem>
                      <SelectItem value="Referee">Referee (League)</SelectItem>
                      <SelectItem value="ClubAdmin">Club Administrator</SelectItem>
                      <SelectItem value="TechnicalDirector">Technical Director (Club)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Organization Select */}
                <div className="space-y-2">
                  <Label>
                    {form.role === "SuperAdmin" ? "Context" : 
                     form.role === "LeagueAdmin" || form.role === "Referee" ? "Select League" : 
                     form.role ? "Select Club" : "Organization"}
                  </Label>
                  
                  {form.role === "SuperAdmin" ? (
                    <Input disabled value="System (Global)" />
                  ) : (
                    <Select 
                      value={form.orgId} 
                      onValueChange={(v) => setForm({...form, orgId: v})}
                      disabled={!form.role}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!form.role ? "Select Role First" : "Select Organization"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(form.role === "LeagueAdmin" || form.role === "Referee") ? (
                          leagues?.map(l => (
                            <SelectItem key={l._id} value={l._id}>
                              <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="h-4 w-4" /> {l.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          clubs?.map(c => (
                            <SelectItem key={c._id} value={c._id}>
                              <div className="flex items-center gap-2">
                                <BuildingOfficeIcon className="h-4 w-4" /> {c.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Provisioning..." : "Create & Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}