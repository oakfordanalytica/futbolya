/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bootstrap from "../bootstrap.js";
import type * as categories from "../categories.js";
import type * as clerk from "../clerk.js";
import type * as clubs from "../clubs.js";
import type * as dashboard from "../dashboard.js";
import type * as divisions from "../divisions.js";
import type * as http from "../http.js";
import type * as leagues from "../leagues.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_auth_types from "../lib/auth_types.js";
import type * as lib_permissions from "../lib/permissions.js";
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
  bootstrap: typeof bootstrap;
  categories: typeof categories;
  clerk: typeof clerk;
  clubs: typeof clubs;
  dashboard: typeof dashboard;
  divisions: typeof divisions;
  http: typeof http;
  leagues: typeof leagues;
  "lib/auth": typeof lib_auth;
  "lib/auth_types": typeof lib_auth_types;
  "lib/permissions": typeof lib_permissions;
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
