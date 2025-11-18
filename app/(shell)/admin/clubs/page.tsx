"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

type ClubFilter = "all" | "affiliated" | "invited" | "suspended";

export default function SuperAdminClubsPage() {
  const router = useRouter();
  const allClubs = useQuery(api.clubs.listAll);
  const leagues = useQuery(api.leagues.listAll);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ClubFilter>("all");

  // Filter clubs
  const filteredClubs = allClubs?.filter((club) => {
    const matchesSearch =
      !searchTerm ||
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.shortName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" || club.status === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allClubs?.length || 0,
    affiliated: allClubs?.filter((c) => c.status === "affiliated").length || 0,
    invited: allClubs?.filter((c) => c.status === "invited").length || 0,
    suspended: allClubs?.filter((c) => c.status === "suspended").length || 0,
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clubs</h1>
            <p className="text-muted-foreground">
              Manage all registered clubs across all leagues
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Club
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All clubs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Affiliated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.affiliated}
              </div>
              <p className="text-xs text-muted-foreground">Active clubs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.invited}
              </div>
              <p className="text-xs text-muted-foreground">Pending invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.suspended}
              </div>
              <p className="text-xs text-muted-foreground">Suspended clubs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Clubs</CardTitle>
            <CardDescription>Search and filter clubs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select
                  value={filter}
                  onValueChange={(value: ClubFilter) => setFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({stats.total})</SelectItem>
                    <SelectItem value="affiliated">
                      Affiliated ({stats.affiliated})
                    </SelectItem>
                    <SelectItem value="invited">
                      Invited ({stats.invited})
                    </SelectItem>
                    <SelectItem value="suspended">
                      Suspended ({stats.suspended})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!filteredClubs ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading clubs...
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No clubs found</p>
                <p className="text-sm mt-1">
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first club to get started"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => (
                  <Card key={club._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {club.logoUrl ? (
                          <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-lg">
                              {club.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">
                            {club.name}
                          </CardTitle>
                          <CardDescription>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                club.status === "affiliated"
                                  ? "text-green-600 bg-green-50"
                                  : club.status === "invited"
                                  ? "text-yellow-600 bg-yellow-50"
                                  : "text-red-600 bg-red-50"
                              }`}
                            >
                              {club.status}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">League</span>
                          <span className="font-medium truncate ml-2">
                            {club.leagueName || "Not affiliated"}
                          </span>
                        </div>
                        {club.headquarters && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium truncate ml-2">
                              {club.headquarters}
                            </span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          asChild
                        >
                          <Link href={`/admin/clubs/${club._id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Club Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Club</DialogTitle>
              <DialogDescription>
                Add a new club to a league
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="league">
                  League <span className="text-destructive">*</span>
                </Label>
                <Select>
                  <SelectTrigger id="league">
                    <SelectValue placeholder="Select a league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues?.map((league) => (
                      <SelectItem key={league._id} value={league._id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Note: You'll be redirected to the league's club creation page
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // For now, just close and show message
                  alert(
                    "Please select a league and navigate to that league's clubs page to create a new club."
                  );
                  setIsCreateOpen(false);
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}