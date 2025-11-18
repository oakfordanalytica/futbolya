import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRolesFromClaims } from "@/lib/auth/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}