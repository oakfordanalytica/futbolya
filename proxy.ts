import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing, locales } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Only sign-in and sign-up routes are public
const isPublicRoute = createRouteMatcher([
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/:slug/sign-in(.*)",
  "/:locale/:slug/sign-up(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/:slug/sign-in(.*)",
  "/:slug/sign-up(.*)",
]);

// Admin routes - only accessible by superadmins
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/:locale/admin(.*)"]);

// Reserved paths that are not tenant slugs
const RESERVED_PATHS = new Set([
  "admin",
  "sign-in",
  "sign-up",
  "api",
  "_next",
  "static",
  ...locales,
]);

/**
 * Extract tenant slug from pathname.
 */
function extractTenant(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);

  // Skip locale if present
  let startIndex = 0;
  if (
    segments[0] &&
    locales.includes(segments[0] as (typeof locales)[number])
  ) {
    startIndex = 1;
  }

  const potentialTenant = segments[startIndex];
  return potentialTenant && !RESERVED_PATHS.has(potentialTenant)
    ? potentialTenant
    : null;
}

export default clerkMiddleware(
  async (auth, req) => {
    const authObject = await auth();
    const { userId, sessionClaims } = authObject;
    const isAuthenticated = !!userId;

    // Protect all routes except public ones
    if (!isAuthenticated && !isPublicRoute(req)) {
      const tenant = extractTenant(req.nextUrl.pathname);
      const signInPath = tenant ? `/${tenant}/sign-in` : "/sign-in";
      const signInUrl = new URL(signInPath, req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Protect admin routes - only superadmins can access
    if (isAdminRoute(req)) {
      const metadata = sessionClaims?.metadata as
        | { isSuperAdmin?: boolean }
        | undefined;
      const isSuperAdmin = metadata?.isSuperAdmin === true;

      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return intlMiddleware(req);
  },
  {
    organizationSyncOptions: {
      // Sync organization based on URL slug (excludes admin via RESERVED_PATHS)
      organizationPatterns: [
        "/:slug",
        "/:slug/(.*)",
        "/:locale/:slug",
        "/:locale/:slug/(.*)",
      ],
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
