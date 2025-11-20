"use client";

import { useQuery, useConvexAuth } from "convex/react"; // 1. Import useConvexAuth
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrophyIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  UserGroupIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const { isAuthenticated } = useConvexAuth();
  const stats = useQuery(
    api.dashboard.getSuperAdminStats,
    isAuthenticated ? {} : "skip"
  );

  if (stats === undefined) {
    return (
      <Container className="py-8">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-muted/50 rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Global Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and system-wide metrics
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Leagues Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leagues</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeagues}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeLeagues} active competitions
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs" asChild>
                <Link href="/admin/leagues">Manage Leagues →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Clubs Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clubs</CardTitle>
              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClubs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.affiliatedClubs} affiliated teams
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs" asChild>
                <Link href="/admin/clubs">Manage Clubs →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs" asChild>
                <Link href="/admin/users">Directory →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                Registered athletes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform operational status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              All Systems Operational
            </div>
            <span className="text-xs text-muted-foreground">Database connected • Clerk synced</span>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}