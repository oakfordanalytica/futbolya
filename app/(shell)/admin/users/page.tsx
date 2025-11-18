"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SuperAdminUsersPage() {
  const allProfiles = useQuery(api.users.listAllProfiles, {});

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
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Complete list of all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!allProfiles ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : allProfiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No users found in the system.
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Clerk ID</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map((profile) => (
                      <tr
                        key={profile._id}
                        className="border-b hover:bg-muted/50"
                      >
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
                                {profile.displayName ||
                                  `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
                                  "No name"}
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
                            <span className="text-muted-foreground">
                              No email
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {profile.clerkId || "N/A"}
                          </code>
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
                              No Account
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            View Details
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