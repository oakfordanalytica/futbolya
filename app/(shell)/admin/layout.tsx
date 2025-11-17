import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRolesFromClaims } from "@/lib/auth/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authData = await auth();
  const roles = getRolesFromClaims(authData);

  // Check if user has SuperAdmin role in ANY org
  const isSuperAdmin = roles && Object.values(roles).includes("SuperAdmin");

  if (!isSuperAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}