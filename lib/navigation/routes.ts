/**
 * Centralized route definitions for the Payments Platform.
 *
 * This file provides type-safe route builders to avoid hardcoded paths
 * throughout the application. When architecture changes, update routes here
 * and TypeScript will flag any breaking usages.
 *
 * Route Hierarchy:
 *   /admin/*                       - Superadmin platform routes
 *   /{organization}/*              - Organization-level routes
 */

export const ROUTES = {
  home: "/",

  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    organizations: "/organizations",
  },

  tenant: {
    auth: {
      signIn: (orgSlug: string) => `/${orgSlug}/sign-in`,
      signUp: (orgSlug: string) => `/${orgSlug}/sign-up`,
    },
    onboarding: (orgSlug: string) => `/${orgSlug}/onboarding`,
  },

  admin: {
    root: "/admin",

    organizations: {
      list: "/admin/organizations",
      detail: (orgId: string) => `/admin/organizations/${orgId}`,
      create: "/admin/organizations/create",
    },

    settings: {
      root: "/admin/settings",
      teamConfig: "/admin/settings/team-config",
      appearance: "/admin/settings/appearance",
      profileSecurity: "/admin/settings/user-profile",
      billing: "/admin/settings/billing",
    },
  },

  org: {
    root: (orgSlug: string) => `/${orgSlug}`,

    teams: {
      list: (orgSlug: string) => `/${orgSlug}/teams`,
      detail: (orgSlug: string, teamId: string) =>
        `/${orgSlug}/teams/${teamId}`,
      playerDetail: (orgSlug: string, teamId: string, playerId: string) =>
        `/${orgSlug}/teams/${teamId}/players/${playerId}`,
      settings: (orgSlug: string, teamId: string) =>
        `/${orgSlug}/teams/${teamId}/settings`,
      create: (orgSlug: string) => `/${orgSlug}/teams/create`,
    },

    roster: {
      list: (orgSlug: string) => `/${orgSlug}/roster`,
    },

    offerings: {
      list: (orgSlug: string) => `/${orgSlug}/offerings`,
      detail: (orgSlug: string, offeringId: string) =>
        `/${orgSlug}/offerings/${offeringId}`,
      create: (orgSlug: string) => `/${orgSlug}/offerings/create`,
    },

    applications: {
      list: (orgSlug: string) => `/${orgSlug}/applications`,
      detail: (orgSlug: string, applicationId: string) =>
        `/${orgSlug}/applications/${applicationId}`,
      create: (orgSlug: string) => `/${orgSlug}/preadmission`,
    },

    members: {
      list: (orgSlug: string) => `/${orgSlug}/members`,
      detail: (orgSlug: string, memberId: string) =>
        `/${orgSlug}/members/${memberId}`,
    },

    fees: {
      list: (orgSlug: string) => `/${orgSlug}/fees`,
      assignments: (orgSlug: string) => `/${orgSlug}/fees/assignments`,
    },

    forms: {
      list: (orgSlug: string) => `/${orgSlug}/forms`,
      detail: (orgSlug: string, formId: string) =>
        `/${orgSlug}/forms/${formId}`,
      create: (orgSlug: string) => `/${orgSlug}/forms/create`,
    },

    staff: {
      list: (orgSlug: string) => `/${orgSlug}/staff`,
      detail: (orgSlug: string, staffId: string) =>
        `/${orgSlug}/staff/${staffId}`,
    },

    payments: (orgSlug: string) => `/${orgSlug}/payments`,

    divisions: {
      list: (orgSlug: string) => `/${orgSlug}/divisions`,
      detail: (orgSlug: string, divisionId: string) =>
        `/${orgSlug}/divisions/${divisionId}`,
      create: (orgSlug: string) => `/${orgSlug}/divisions/create`,
    },

    tournaments: {
      list: (orgSlug: string) => `/${orgSlug}/tournaments`,
      detail: (orgSlug: string, tournamentId: string) =>
        `/${orgSlug}/tournaments/${tournamentId}`,
      create: (orgSlug: string) => `/${orgSlug}/tournaments/create`,
    },

    games: {
      list: (orgSlug: string) => `/${orgSlug}/games`,
      detail: (orgSlug: string, gameId: string) =>
        `/${orgSlug}/games/${gameId}`,
      create: (orgSlug: string) => `/${orgSlug}/games/create`,
    },

    stats: {
      list: (orgSlug: string) => `/${orgSlug}/stats`,
    },

    settings: {
      root: (orgSlug: string) => `/${orgSlug}/settings`,
      teamConfig: (orgSlug: string) => `/${orgSlug}/settings/team-config`,
      appearance: (orgSlug: string) => `/${orgSlug}/settings/appearance`,
      profileSecurity: (orgSlug: string) => `/${orgSlug}/settings/user-profile`,
      billing: (orgSlug: string) => `/${orgSlug}/settings/billing`,
    },
  },
} as const;

/**
 * Team-level routes (within org context)
 * Used for club/team management pages
 */
export const TEAM_ROUTES = {
  root: (orgSlug: string, teamSlug: string) => `/${orgSlug}/${teamSlug}`,
  roster: (orgSlug: string, teamSlug: string) =>
    `/${orgSlug}/${teamSlug}/roster`,
  rosterPlayerDetail: (orgSlug: string, teamSlug: string, playerId: string) =>
    `/${orgSlug}/${teamSlug}/roster/${playerId}`,
  staff: (orgSlug: string, teamSlug: string) => `/${orgSlug}/${teamSlug}/staff`,
  categories: (orgSlug: string, teamSlug: string) =>
    `/${orgSlug}/${teamSlug}/categories`,
  stats: {
    list: (orgSlug: string, teamSlug: string) =>
      `/${orgSlug}/${teamSlug}/stats`,
  },
  games: {
    list: (orgSlug: string, teamSlug: string) =>
      `/${orgSlug}/${teamSlug}/games`,
    detail: (orgSlug: string, teamSlug: string, gameId: string) =>
      `/${orgSlug}/${teamSlug}/games/${gameId}`,
  },
  settings: {
    root: (orgSlug: string, teamSlug: string) =>
      `/${orgSlug}/${teamSlug}/settings`,
    appearance: (orgSlug: string, teamSlug: string) =>
      `/${orgSlug}/${teamSlug}/settings/appearance`,
    profileSecurity: (orgSlug: string, teamSlug: string) =>
      `/${orgSlug}/${teamSlug}/settings/user-profile`,
  },
} as const;

export type Routes = typeof ROUTES;
export type TeamRoutes = typeof TEAM_ROUTES;
