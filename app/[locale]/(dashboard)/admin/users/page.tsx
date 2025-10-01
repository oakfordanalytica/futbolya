"use client";

import { useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FutbolYaRole } from "@/lib/role-utils";
import { useState, useEffect } from "react";

function UserRow({ user, onRoleChange }: { user: any, onRoleChange: () => void }) {
  const setUserRole = useAction(api.admin.setUserRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole: FutbolYaRole) => {
    setIsUpdating(true);
    try {
      await setUserRole({ clerkId: user.clerkId, role: newRole });
      onRoleChange(); // This will re-fetch the user list
    } catch (error) {
      alert(`Error updating role: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TableRow>
      <TableCell>{`${user.persona?.nombrePersona || ''} ${user.persona?.apellidoPersona || ''}`}</TableCell>
      <TableCell>{user.email || user.userName}</TableCell>
      <TableCell>
        <Select
          defaultValue={user.role}
          onValueChange={(value) => handleRoleChange(value as FutbolYaRole)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assign Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" disabled>Pending</SelectItem>
            <SelectItem value="jugador">Jugador</SelectItem>
            <SelectItem value="entrenador">Entrenador</SelectItem>
            <SelectItem value="arbitro">Arbitro</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export default function ManageUsersPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();
  const fetchUsers = useAction(api.admin.listUsersWithClerkRoles);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load users on component mount and when refreshKey changes
  useEffect(() => {
    async function loadUsers() {
      if (!isAuthenticated || authLoading) {
        return; // Wait until auth is ready
      }
      
      setLoading(true);
      setError(null);
      try {
        const result = await fetchUsers({});
        setUsers(result);
      } catch (e) {
        console.error("Error fetching users:", e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    loadUsers();
  }, [fetchUsers, refreshKey, isAuthenticated, authLoading]);

  // Function to refresh user list
  const refreshUsers = () => setRefreshKey(k => k + 1);

  if (authLoading) {
    return <div className="p-8">Verifying authentication...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8">Please sign in to access this page.</div>;
  }

  if (loading) {
    return <div className="p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading users: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Identifier</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <UserRow key={user._id} user={user} onRoleChange={refreshUsers} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}