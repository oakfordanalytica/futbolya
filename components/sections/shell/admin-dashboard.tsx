"use client";

import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DashboardLink = {
  title: string;
  description: string;
  stat?: string | number;
  href: string;
  linkText: string;
};

type AdminDashboardProps = {
  title: string;
  description: string;
  links: DashboardLink[];
  loading?: boolean;
};

export function AdminDashboard({
  title,
  description,
  links,
  loading = false,
}: AdminDashboardProps) {
  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Loading dashboard...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {link.stat !== undefined && (
                    <p className="text-2xl font-bold">{link.stat}</p>
                  )}
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a href={link.href}>{link.linkText} →</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}