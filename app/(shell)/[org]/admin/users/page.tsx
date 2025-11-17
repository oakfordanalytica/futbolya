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

export default function UsersManagementPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  const createAdminUser = useMutation(api.users.createAdminUser);
  const createPlayer = useMutation(api.users.createPlayer);
  const profiles = useQuery(api.users.listAllProfiles, {});

  // Get current user's role to determine permissions
  const myRole = useQuery(api.users.getMyRoleInOrg, {
    orgSlug,
    orgType: "league", // You'd determine this dynamically
  });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "LeagueAdmin" as "LeagueAdmin" | "ClubAdmin" | "TechnicalDirector" | "Referee",
  });

  // Player form state
  const [playerForm, setPlayerForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const handleCreateAdmin = async () => {
    setLoading(true);
    try {
      // TODO: Get the actual organization ID from context
      await createAdminUser({
        ...adminForm,
        organizationId: "your-org-id", // Replace with actual org ID
        organizationType: "league",
      });
      setOpen(false);
      setAdminForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "LeagueAdmin",
      });
      alert("Admin user created successfully!");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    setLoading(true);
    try {
      await createPlayer({
        ...playerForm,
        email: playerForm.email || undefined,
        organizationId: "your-club-id", // Replace with actual club ID
      });
      setOpen(false);
      setPlayerForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
      });
      alert("Player created successfully!");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  // Check permissions
  if (!myRole || (myRole !== "SuperAdmin" && myRole !== "LeagueAdmin" && myRole !== "ClubAdmin")) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to manage users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Create and manage users for your organization
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Add User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Choose the type of user you want to create
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin/Staff</TabsTrigger>
                <TabsTrigger value="player">Player</TabsTrigger>
              </TabsList>

              {/* Admin Form */}
              <TabsContent value="admin" className="space-y-4 mt-4">
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
                    placeholder="admin@example.com"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Required. Clerk account will be created immediately.
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
                    onClick={handleCreateAdmin}
                    disabled={
                      loading ||
                      !adminForm.email ||
                      !adminForm.firstName ||
                      !adminForm.lastName
                    }
                  >
                    {loading ? "Creating..." : "Create Admin User"}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* Player Form */}
              <TabsContent value="player" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="player-email">Email (Optional)</Label>
                  <Input
                    id="player-email"
                    type="email"
                    value={playerForm.email}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, email: e.target.value })
                    }
                    placeholder="player@example.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Can be added later. Clerk account created when email is provided.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="player-firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="player-firstName"
                      value={playerForm.firstName}
                      onChange={(e) =>
                        setPlayerForm({ ...playerForm, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="player-lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="player-lastName"
                      value={playerForm.lastName}
                      onChange={(e) =>
                        setPlayerForm({ ...playerForm, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="player-phone">Phone Number</Label>
                  <Input
                    id="player-phone"
                    type="tel"
                    value={playerForm.phoneNumber}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, phoneNumber: e.target.value })
                    }
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="player-dob">Date of Birth</Label>
                  <Input
                    id="player-dob"
                    type="date"
                    value={playerForm.dateOfBirth}
                    onChange={(e) =>
                      setPlayerForm({ ...playerForm, dateOfBirth: e.target.value })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePlayer}
                    disabled={
                      loading || !playerForm.firstName || !playerForm.lastName
                    }
                  >
                    {loading ? "Creating..." : "Create Player"}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage users and their access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role(s)</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users found. Create your first user to get started.
                    </td>
                  </tr>
                ) : (
                  profiles?.map((profile) => (
                    <tr key={profile._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{profile.displayName}</div>
                        {profile.phoneNumber && (
                          <div className="text-sm text-muted-foreground">
                            {profile.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {profile.email || (
                          <span className="text-muted-foreground">No email</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {profile.roles.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {r.role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        {profile.hasAccount ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                            Active
                          </span>
                        ) : profile.email ? (
                          <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
                            <span className="h-2 w-2 rounded-full bg-yellow-600" />
                            Pending
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
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}