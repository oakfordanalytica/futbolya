"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { CategoryForm } from "@/components/forms/CategoryForm";
import { PlusIcon } from "@heroicons/react/20/solid";

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.org as string;

  const categories = useQuery(api.categories.listByOrgSlug, { orgSlug });
  const organization = useQuery(api.organizations.getBySlug, { slug: orgSlug });

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!organization) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the organization details.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }
  
  if (!organization.clubId) {
    return (
      <Container className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Organization</CardTitle>
            <CardDescription>
              Categories can only be created for clubs, not leagues.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">
              Age-based team categories (Sub-10 to Sub-18)
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </div>

        {!categories ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading categories...</p>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No categories found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first category to organize players by age group
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category._id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    {category.ageGroup} • {category.gender}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Technical Director
                      </span>
                      <span className="font-medium">
                        {category.technicalDirectorName || "Not assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Players</span>
                      <span className="font-medium">
                        {category.playerCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          category.status === "active"
                            ? "text-green-600 bg-green-50"
                            : "text-gray-600 bg-gray-50"
                        }`}
                      >
                        {category.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() =>
                        router.push(`/${orgSlug}/admin/categories/${category._id}`)
                      }
                    >
                      Manage Category
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CategoryForm
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          clubId={organization.clubId}
        />
      </div>
    </Container>
  );
}