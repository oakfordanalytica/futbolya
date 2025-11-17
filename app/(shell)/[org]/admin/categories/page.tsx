"use client";

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
import { PlusIcon } from "@heroicons/react/20/solid";

export default function CategoriesPage() {
  const params = useParams();
  const orgSlug = params.org as string;

  // TODO: Create this query in convex/categories.ts
  const categories = useQuery(api.categories.listByOrgSlug, { orgSlug });

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
          <Button>
            <PlusIcon className="h-4 w-4" />
            Create Category
          </Button>
        </div>

        {!categories ? (
          <div>Loading...</div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No categories found. Create your first category.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category._id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    {category.ageGroup} • {category.gender} • {category.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                      <span className="font-medium capitalize">
                        {category.status}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`/${orgSlug}/admin/categories/${category._id}`}>
                        Manage Category
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}