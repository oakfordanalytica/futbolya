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
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as entrenadores from "../entrenadores.js";
import type * as equipos from "../equipos.js";
import type * as escuelas from "../escuelas.js";
import type * as gruposEntrenamiento from "../gruposEntrenamiento.js";
import type * as http from "../http.js";
import type * as jugadores from "../jugadores.js";
import type * as ligas from "../ligas.js";
import type * as partidos from "../partidos.js";
import type * as seed from "../seed.js";
import type * as sesionesYAsistencias from "../sesionesYAsistencias.js";
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
  admin: typeof admin;
  auth: typeof auth;
  entrenadores: typeof entrenadores;
  equipos: typeof equipos;
  escuelas: typeof escuelas;
  gruposEntrenamiento: typeof gruposEntrenamiento;
  http: typeof http;
  jugadores: typeof jugadores;
  ligas: typeof ligas;
  partidos: typeof partidos;
  seed: typeof seed;
  sesionesYAsistencias: typeof sesionesYAsistencias;
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
