// middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getLocaleFromPathname } from './lib/locale-setup';
import { extractRoleFromMetadata, FutbolYaRole } from './lib/role-utils';

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
  const userRole = extractRoleFromMetadata(sessionClaims as any);

  // If the user has no role, redirect them to a pending page
  if (!userRole) {
      if (!pathname.includes('/pending-role')) {
          return NextResponse.redirect(new URL(`/${locale}/pending-role`, req.url));
      }
      return intlMiddleware(req);
  }

  // --- Role-Based Access Control ---
  // Check for admin routes
  if (isAdminRoute(req) && userRole !== 'admin' && userRole !== 'superadmin') {
      const url = new URL(`/${locale}${DEFAULT_REDIRECTS[userRole]}`, req.url);
      return NextResponse.redirect(url);
  }

  // Check for coach routes
  if (isCoachRoute(req) && userRole !== 'entrenador') {
      const url = new URL(`/${locale}${DEFAULT_REDIRECTS[userRole]}`, req.url);
      return NextResponse.redirect(url);
  }

    // Check for referee routes
  if (isRefereeRoute(req) && userRole !== 'arbitro') {
      const url = new URL(`/${locale}${DEFAULT_REDIRECTS[userRole]}`, req.url);
      return NextResponse.redirect(url);
  }


  // If no specific route is matched and the user is authenticated,
  // allow them to proceed. This covers shared dashboards, profile pages, etc.
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