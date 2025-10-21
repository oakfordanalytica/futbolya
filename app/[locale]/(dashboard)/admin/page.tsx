// app/[locale]/(dashboard)/admin/page.tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Icons
import {
  UsersIcon,
  SchoolIcon,
  TrophyIcon,
  ShieldIcon,
  UserSquareIcon,
  ActivityIcon,
} from "lucide-react";


export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Users</CardTitle>
             <UsersIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <CardDescription className="mb-4">
                Assign roles and manage user accounts.
             </CardDescription>
             <Button asChild size="sm">
               <Link href="/admin/users">Manage Users</Link>
             </Button>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Schools</CardTitle>
             <SchoolIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
              <CardDescription className="mb-4">
                Add and view football schools or academies.
             </CardDescription>
              <Button asChild size="sm">
               <Link href="/admin/escuelas">Manage Schools</Link>
             </Button>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Leagues</CardTitle>
             <ActivityIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
                <CardDescription className="mb-4">
                    Organize tournaments into leagues.
                </CardDescription>
                <Button asChild size="sm">
                    <Link href="/admin/ligas">Manage Leagues</Link>
                </Button>
           </CardContent>
         </Card>

          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Teams</CardTitle>
             <ShieldIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
                 <CardDescription className="mb-4">
                    Create and manage teams within schools.
                 </CardDescription>
                 <Button asChild size="sm">
                    <Link href="/admin/equipos">Manage Teams</Link>
                 </Button>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Players</CardTitle>
             <UserSquareIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
                <CardDescription className="mb-4">
                    Register players and assign them to schools.
                 </CardDescription>
                 <Button asChild size="sm">
                    <Link href="/admin/jugadores">Manage Players</Link>
                 </Button>
           </CardContent>
         </Card>

          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Tournaments & Matches</CardTitle>
             <TrophyIcon className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
                 <CardDescription className="mb-4">
                    Set up tournaments and schedule matches.
                 </CardDescription>
                 <Button asChild size="sm">
                    <Link href="/admin/torneos">Manage Tournaments</Link>
                 </Button>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}