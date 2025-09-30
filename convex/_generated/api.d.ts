/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as equipos from "../equipos.js";
import type * as escuelas from "../escuelas.js";
import type * as http from "../http.js";
import type * as ligas from "../ligas.js";
import type * as seed from "../seed.js";
import type * as torneos from "../torneos.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  equipos: typeof equipos;
  escuelas: typeof escuelas;
  http: typeof http;
  ligas: typeof ligas;
  seed: typeof seed;
  torneos: typeof torneos;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
