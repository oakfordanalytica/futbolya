/**
 * These types are shared between the frontend and backend.
 */

// The types of organizations a user can have a role in
export type OrgType = "league" | "club";

// All possible roles in the application
export type PlatformRole = "SuperAdmin";
export type OrganizationRole = "LeagueAdmin" | "ClubAdmin" | "Coach" | "Player" | "Referee";
export type AppRole = PlatformRole | OrganizationRole;