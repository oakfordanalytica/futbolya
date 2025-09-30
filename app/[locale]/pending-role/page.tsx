// app/[locale]/pending-role/page.tsx
"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"; // Import your button component

export default function PendingRolePage() {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold">Account Pending Approval</h1>
        <p className="mt-4 text-lg">
          Welcome, {user?.firstName || "user"}!
        </p>
        <p className="mt-2 text-muted-foreground">
          Your account has been successfully created but requires an administrator to assign you a role before you can proceed.
        </p>
        <div className="mt-6">
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}