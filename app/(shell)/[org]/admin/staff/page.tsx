"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { StaffForm } from "@/components/forms/StaffForm";
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function StaffPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  const staff = useQuery(api.staff.listByClubSlug, { clubSlug: orgSlug });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff</h1>
            <p className="text-muted-foreground">
              Manage technical directors and coaching staff
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {!staff ? (
          <div>Loading...</div>
        ) : staff.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No staff members found. Add your first technical director.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card key={`${member.profileId}-${member._id}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {member.avatarUrl && (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>{member.fullName}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {member.categoryName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium">
                          {member.categoryName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Club</span>
                      <span className="font-medium">{member.clubName}</span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={`/${orgSlug}/admin/staff/${member.profileId}`}
                      >
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <StaffForm
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          clubSlug={orgSlug}
        />
      </div>
    </Container>
  );
}