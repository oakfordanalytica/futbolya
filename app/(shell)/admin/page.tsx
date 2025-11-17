import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {
  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">
            Global management across all leagues and clubs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Leagues</CardTitle>
              <CardDescription>
                Manage all leagues in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">12</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="/admin/leagues">View all leagues →</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clubs</CardTitle>
              <CardDescription>
                Manage all registered clubs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">248</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="/admin/clubs">View all clubs →</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Global user management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">1,523</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="/admin/users">Manage users →</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Platform-wide statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/admin/analytics">View analytics →</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}