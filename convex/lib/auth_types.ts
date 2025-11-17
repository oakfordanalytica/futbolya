/**
 * Shared authentication types.
 * This is the single source of truth for role definitions.
 */

export type OrgType = "league" | "club";

export type PlatformRole = "SuperAdmin";

export type OrganizationRole = 
  | "LeagueAdmin" 
  | "ClubAdmin" 
  | "TechnicalDirector"
  | "Player" 
  | "Referee";

export type AppRole = PlatformRole | OrganizationRole;

export type AppClaims = {
  roles?: Record<string, AppRole>;
};