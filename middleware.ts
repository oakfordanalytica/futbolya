// middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getLocaleFromPathname } from './lib/locale-setup';
import { extractFutbolYaRole, FutbolYaRole, isAdminOrSuperAdmin } from './lib/role-utils';
import { UserIdentity } from 'convex/server';

const intlMiddleware = createIntlMiddleware(routing);

// ============================================================
// ROUTE CONFIGURATION FOR FUTBOLYA
// ============================================================

// Public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/pending-role', // A page for users awaiting role approval
  '/pending-role',
]);

// Define routes that are protected and require specific roles
const isAdminRoute = createRouteMatcher(['/:locale/admin(.*)', '/admin(.*)']);
const isCoachRoute = createRouteMatcher(['/:locale/coach(.*)', '/coach(.*)']);
const isRefereeRoute = createRouteMatcher(['/:locale/referee(.*)', '/referee(.*)']);


// Define the default redirect URL for each role after login
const DEFAULT_REDIRECTS: Record<FutbolYaRole, string> = {
  superadmin: '/admin',
  admin: '/admin',
  entrenador: '/coach/dashboard',
  arbitro: '/referee/matches',
  jugador: '/player/dashboard',
  pending: '/pending-role',
};

const DEBUG = process.env.DEBUG_ROLE_CHECKING === 'true';

// ============================================================
// MIDDLEWARE LOGIC
// ============================================================

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return intlMiddleware(req);
  }

  const { userId, sessionClaims } = await auth();

  if (DEBUG) console.log('Auth Claims:', sessionClaims);

  // If the user is not authenticated, redirect them to the sign-in page
  if (!userId) {
    const signInUrl = new URL(`/${locale}/sign-in`, req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Extract the user's role from Clerk's metadata
  const userRole = extractFutbolYaRole(sessionClaims);

  if (DEBUG) console.log('Extracted Role in Middleware:', userRole);

  // Handle pending/no role
  if (!userRole || userRole === 'pending') {
    if (pathname.includes('/pending-role')) {
      return intlMiddleware(req);
    }
    return NextResponse.redirect(new URL(`/${locale}/pending-role`, req.url));
  }

  if (isAdminRoute(req) && !isAdminOrSuperAdmin(userRole)) { // Using helper
    console.log(`Redirecting non-admin user from admin route. Role: ${userRole}`);
    const redirectPath = DEFAULT_REDIRECTS[userRole] || '/pending-role';
    const url = new URL(`/${locale}${redirectPath}`, req.url);
    return NextResponse.redirect(url);
  }

  // Check coach routes
  if (isCoachRoute(req) && userRole !== 'entrenador') {
    console.log(`Redirecting non-coach user from coach route. Role: ${userRole}`);
    const redirectPath = DEFAULT_REDIRECTS[userRole] || '/pending-role';
    const url = new URL(`/${locale}${redirectPath}`, req.url);
    return NextResponse.redirect(url);
  }

    // Check referee routes
  if (isRefereeRoute(req) && userRole !== 'arbitro') {
    console.log(`Redirecting non-referee user from referee route. Role: ${userRole}`);
    const redirectPath = DEFAULT_REDIRECTS[userRole] || '/pending-role';
    const url = new URL(`/${locale}${redirectPath}`, req.url);
    return NextResponse.redirect(url);
  }

  // --- Redirect from generic dashboard ---
  const isGenericDashboard = pathname === `/${locale}` || pathname === `/${locale}/`; // Or check against your actual generic dashboard path if different

  // Check if the user is on the generic dashboard and has a role with a specific redirect defined.
  if (isGenericDashboard && userRole && DEFAULT_REDIRECTS[userRole]) {
    const specificRedirect = DEFAULT_REDIRECTS[userRole];

    // Perform the redirect to the role-specific page
    console.log(`User on generic dashboard with role ${userRole}. Redirecting to ${specificRedirect}`);
    const url = new URL(`/${locale}${specificRedirect}`, req.url);
    return NextResponse.redirect(url);
  }


  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};