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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeagueForm } from "@/components/forms/LeagueForm";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

type LeagueFilter = "all" | "active" | "inactive";

export default function SuperAdminLeaguesPage() {
  const router = useRouter();
  const allLeagues = useQuery(api.leagues.listAll);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<LeagueFilter>("all");

  // Filter leagues
  const filteredLeagues = allLeagues?.filter((league) => {
    const matchesSearch =
      !searchTerm ||
      league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      league.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      league.country.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "all" || league.status === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allLeagues?.length || 0,
    active: allLeagues?.filter((l) => l.status === "active").length || 0,
    inactive: allLeagues?.filter((l) => l.status === "inactive").length || 0,
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leagues & Federations</h1>
            <p className="text-muted-foreground">
              Manage all registered leagues and federations
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create League
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Leagues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All leagues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.inactive}
              </div>
              <p className="text-xs text-muted-foreground">Not active</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Leagues</CardTitle>
            <CardDescription>Search and filter leagues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select
                  value={filter}
                  onValueChange={(value: LeagueFilter) => setFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({stats.total})</SelectItem>
                    <SelectItem value="active">
                      Active ({stats.active})
                    </SelectItem>
                    <SelectItem value="inactive">
                      Inactive ({stats.inactive})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!filteredLeagues ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading leagues...
              </div>
            ) : filteredLeagues.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No leagues found</p>
                <p className="text-sm mt-1">
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first league to get started"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLeagues.map((league) => (
                  <Card
                    key={league._id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {league.logoUrl ? (
                          <img
                            src={league.logoUrl}
                            alt={league.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-lg">
                              {league.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">
                            {league.name}
                          </CardTitle>
                          <CardDescription>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                league.status === "active"
                                  ? "text-green-600 bg-green-50"
                                  : "text-gray-600 bg-gray-50"
                              }`}
                            >
                              {league.status}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Country
                          </span>
                          <span className="font-medium truncate ml-2">
                            {league.country}
                          </span>
                        </div>
                        {league.region && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Region
                            </span>
                            <span className="font-medium truncate ml-2">
                              {league.region}
                            </span>
                          </div>
                        )}
                        {league.foundedYear && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Founded
                            </span>
                            <span className="font-medium">
                              {league.foundedYear}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/admin/leagues/${league._id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/${league.slug}/admin`}>
                              Dashboard
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create League Dialog */}
        <LeagueForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </Container>
  );
}