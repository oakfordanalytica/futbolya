// app/[locale]/(dashboard)/layout.tsx
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="ml-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}