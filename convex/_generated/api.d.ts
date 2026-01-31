/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as clerk from "../clerk.js";
import type * as documents from "../documents.js";
import type * as fees from "../fees.js";
import type * as files from "../files.js";
import type * as formTemplates from "../formTemplates.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_auth_types from "../lib/auth_types.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as members from "../members.js";
import type * as organizations from "../organizations.js";
import type * as square from "../square.js";
import type * as square_webhook from "../square_webhook.js";
import type * as transactions from "../transactions.js";
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
  applications: typeof applications;
  clerk: typeof clerk;
  documents: typeof documents;
  fees: typeof fees;
  files: typeof files;
  formTemplates: typeof formTemplates;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/auth_types": typeof lib_auth_types;
  "lib/permissions": typeof lib_permissions;
  "lib/validators": typeof lib_validators;
  members: typeof members;
  organizations: typeof organizations;
  square: typeof square;
  square_webhook: typeof square_webhook;
  transactions: typeof transactions;
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
