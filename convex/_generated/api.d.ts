/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clerk from "../clerk.js";
import type * as clubs from "../clubs.js";
import type * as conferences from "../conferences.js";
import type * as files from "../files.js";
import type * as gameCenter from "../gameCenter.js";
import type * as gameEvents from "../gameEvents.js";
import type * as gameLineups from "../gameLineups.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as leagueSettings from "../leagueSettings.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_auth_types from "../lib/auth_types.js";
import type * as lib_categories_helpers from "../lib/categories/helpers.js";
import type * as lib_game_events_helpers from "../lib/game_events/helpers.js";
import type * as lib_game_events_mutations from "../lib/game_events/mutations.js";
import type * as lib_game_events_queries from "../lib/game_events/queries.js";
import type * as lib_game_events_validators from "../lib/game_events/validators.js";
import type * as lib_game_lineups_helpers from "../lib/game_lineups/helpers.js";
import type * as lib_game_lineups_mutations from "../lib/game_lineups/mutations.js";
import type * as lib_game_lineups_queries from "../lib/game_lineups/queries.js";
import type * as lib_game_lineups_validators from "../lib/game_lineups/validators.js";
import type * as lib_games_mutations from "../lib/games/mutations.js";
import type * as lib_games_queries from "../lib/games/queries.js";
import type * as lib_games_season_stats from "../lib/games/season_stats.js";
import type * as lib_games_utils from "../lib/games/utils.js";
import type * as lib_games_validators from "../lib/games/validators.js";
import type * as lib_league_settings_age_categories from "../lib/league_settings/age_categories.js";
import type * as lib_league_settings_general from "../lib/league_settings/general.js";
import type * as lib_league_settings_helpers from "../lib/league_settings/helpers.js";
import type * as lib_league_settings_lineups from "../lib/league_settings/lineups.js";
import type * as lib_league_settings_positions from "../lib/league_settings/positions.js";
import type * as lib_league_settings_queries from "../lib/league_settings/queries.js";
import type * as lib_league_settings_seasons from "../lib/league_settings/seasons.js";
import type * as lib_league_settings_validators from "../lib/league_settings/validators.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_players_helpers from "../lib/players/helpers.js";
import type * as lib_players_mutations from "../lib/players/mutations.js";
import type * as lib_players_queries from "../lib/players/queries.js";
import type * as lib_players_validators from "../lib/players/validators.js";
import type * as lib_tenancy from "../lib/tenancy.js";
import type * as lib_validators from "../lib/validators.js";
import type * as members from "../members.js";
import type * as organizations from "../organizations.js";
import type * as players from "../players.js";
import type * as staff from "../staff.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clerk: typeof clerk;
  clubs: typeof clubs;
  conferences: typeof conferences;
  files: typeof files;
  gameCenter: typeof gameCenter;
  gameEvents: typeof gameEvents;
  gameLineups: typeof gameLineups;
  games: typeof games;
  http: typeof http;
  leagueSettings: typeof leagueSettings;
  "lib/auth": typeof lib_auth;
  "lib/auth_types": typeof lib_auth_types;
  "lib/categories/helpers": typeof lib_categories_helpers;
  "lib/game_events/helpers": typeof lib_game_events_helpers;
  "lib/game_events/mutations": typeof lib_game_events_mutations;
  "lib/game_events/queries": typeof lib_game_events_queries;
  "lib/game_events/validators": typeof lib_game_events_validators;
  "lib/game_lineups/helpers": typeof lib_game_lineups_helpers;
  "lib/game_lineups/mutations": typeof lib_game_lineups_mutations;
  "lib/game_lineups/queries": typeof lib_game_lineups_queries;
  "lib/game_lineups/validators": typeof lib_game_lineups_validators;
  "lib/games/mutations": typeof lib_games_mutations;
  "lib/games/queries": typeof lib_games_queries;
  "lib/games/season_stats": typeof lib_games_season_stats;
  "lib/games/utils": typeof lib_games_utils;
  "lib/games/validators": typeof lib_games_validators;
  "lib/league_settings/age_categories": typeof lib_league_settings_age_categories;
  "lib/league_settings/general": typeof lib_league_settings_general;
  "lib/league_settings/helpers": typeof lib_league_settings_helpers;
  "lib/league_settings/lineups": typeof lib_league_settings_lineups;
  "lib/league_settings/positions": typeof lib_league_settings_positions;
  "lib/league_settings/queries": typeof lib_league_settings_queries;
  "lib/league_settings/seasons": typeof lib_league_settings_seasons;
  "lib/league_settings/validators": typeof lib_league_settings_validators;
  "lib/permissions": typeof lib_permissions;
  "lib/players/helpers": typeof lib_players_helpers;
  "lib/players/mutations": typeof lib_players_mutations;
  "lib/players/queries": typeof lib_players_queries;
  "lib/players/validators": typeof lib_players_validators;
  "lib/tenancy": typeof lib_tenancy;
  "lib/validators": typeof lib_validators;
  members: typeof members;
  organizations: typeof organizations;
  players: typeof players;
  staff: typeof staff;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
