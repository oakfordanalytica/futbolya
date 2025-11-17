import type { auth } from "@clerk/nextjs/server";
import type { AppRole, AppClaims } from "@/convex/lib/auth_types";

export type { AppRole, AppClaims };

type AuthObject = Awaited<ReturnType<typeof auth>>;

export type AppAuth = {
  userId: string | null;
  orgSlug: string | null;
  sessionClaims: (AuthObject["sessionClaims"] & {
    publicMetadata?: AppClaims;
  }) | null;
};