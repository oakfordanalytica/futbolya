"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function PlayersPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // TODO: Create this query in convex/players.ts
  const players = useQuery(api.players.listByClubSlug, { clubSlug: orgSlug });

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground">
              Manage your club's player roster
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4" />
            Add Player
          </Button>
        </div>

        {!players ? (
          <div>Loading...</div>
        ) : players.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              No players found. Start by adding your first player.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {player.avatarUrl && (
                          <img
                            src={player.avatarUrl}
                            alt={player.fullName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{player.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{player.categoryName || "N/A"}</TableCell>
                    <TableCell>{player.position || "N/A"}</TableCell>
                    <TableCell>
                      {player.dateOfBirth
                        ? new Date(player.dateOfBirth).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          player.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {player.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${orgSlug}/admin/players/${player._id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Container>
  );
}