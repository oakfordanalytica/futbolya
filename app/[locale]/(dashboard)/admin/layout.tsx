// app/[locale]/(dashboard)/admin/layout.tsx
"use client"; // Required for hooks like usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Import icons (make sure you have lucide-react installed)
import {
  UsersIcon,
  SchoolIcon,
  TrophyIcon,
  ShieldIcon,
  UserSquareIcon, // Using this for players
  ActivityIcon, // Using this for leagues
  LayoutDashboardIcon,
} from "lucide-react";

// Define navigation items
const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/users", label: "Manage Users", icon: UsersIcon },
  { href: "/admin/escuelas", label: "Manage Schools", icon: SchoolIcon },
  { href: "/admin/ligas", label: "Manage Leagues", icon: ActivityIcon },
  { href: "/admin/equipos", label: "Manage Teams", icon: ShieldIcon },
  { href: "/admin/jugadores", label: "Manage Players", icon: UserSquareIcon },
  { href: "/admin/torneos", label: "Tournaments & Matches", icon: TrophyIcon },
  // Add more items as needed
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Extract locale if needed for Link href, or rely on Next-Intl's Link
  // const locale = pathname.split('/')[1];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <TrophyIcon className="h-6 w-6" /> {/* Or your app logo */}
              <span className="">FutbolYa Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {adminNavItems.map((item) => {
                // Basic active state check - adjust if locales complicate paths
                 const isActive = pathname === `/${pathname.split('/')[1]}${item.href}` || (item.href === "/admin" && pathname === `/${pathname.split('/')[1]}/admin`);

                return (
                  <Link
                    key={item.href}
                    href={item.href} // Next-Intl's Link handles locale automatically
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Optional Sidebar Footer */}
          {/* <div className="mt-auto p-4"> ... </div> */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
         {/* Header is already in the parent (dashboard)/layout.tsx */}
         {/* We might want to move UserButton here or add breadcrumbs later */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}