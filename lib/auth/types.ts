import type { auth } from "@clerk/nextjs/server";
export type PlatformRole = "SuperAdmin";
export type OrganizationRole =
  | "LeagueAdmin"
  | "ClubAdmin"
  | "Coach"
  | "Player"
  | "Referee";
export type AppRole = PlatformRole | OrganizationRole;

export type AppClaims = {
  roles?: Record<string, AppRole>;
};

// Get the resolved type of the auth() object
type AuthObject = Awaited<ReturnType<typeof auth>>;

// Extend with our custom metadata
export type AppAuth = {
  userId: string | null;
  orgSlug: string | null;
  sessionClaims: (AuthObject["sessionClaims"] & {
    metadata?: {
      publicMetadata?: AppClaims;
    };
  }) | null;
};