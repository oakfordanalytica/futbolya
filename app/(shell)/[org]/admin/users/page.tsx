"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusIcon, UserIcon } from "@heroicons/react/20/solid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrgUsersPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });
  const users = useQuery(api.users.listProfilesInOrg, 
    organization ? { orgSlug: orgSlug, orgType: organization.type } : "skip"
  );
  
  const createAdmin = useMutation(api.users.createAdminUser);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const [loading, setLoading] = useState(false);

  // Filter out Referees/Players to show only ADMINS
  const admins = users?.filter(u => 
    u.role === "LeagueAdmin" || u.role === "ClubAdmin"
  );

  const handleInvite = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      await createAdmin({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: organization.type === "league" ? "LeagueAdmin" : "ClubAdmin",
        organizationId: organization._id,
        organizationType: organization.type,
      });
      setIsInviteOpen(false);
      setForm({ email: "", firstName: "", lastName: "" });
    } catch (error) {
      alert("Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  if (!organization) return <Container className="py-8">Loading...</Container>;

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Administrators</h1>
          <p className="text-muted-foreground">Manage who has access to this dashboard</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins?.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                           <UserIcon className="h-4 w-4 text-primary" />
                         </div>
                         <div>
                           <div className="font-medium">{user.displayName}</div>
                           <div className="text-xs text-muted-foreground">{user.email}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">{user.role}</td>
                    <td className="p-4">
                      {user.clerkId ? (
                        <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">Active</span>
                      ) : (
                        <span className="text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-1 rounded">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Administrator</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>First Name</Label>
                 <Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Last Name</Label>
                 <Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
               </div>
             </div>
             <div className="space-y-2">
               <Label>Email</Label>
               <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
             </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}