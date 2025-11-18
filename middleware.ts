import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleForOrg, getRoleBasePath, getRolesFromClaims } from "@/lib/auth/auth";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/onboarding",
]);

const isSignUp = createRouteMatcher(["/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Block sign-up routes
  if (isSignUp(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Protect non-public routes
  if (!isPublic(req)) {
    await auth.protect();
  }

  const authData = await auth();
  const userId = authData.userId;
  const roles = getRolesFromClaims(authData);

  // Handle root path - redirect to appropriate dashboard
  if (pathname === "/" && userId && roles) {
    // Check if SuperAdmin
    const isSuperAdmin = Object.values(roles).includes("SuperAdmin");
    if (isSuperAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Redirect to first organization
    const firstSlug = Object.keys(roles)[0];
    if (firstSlug) {
      const targetPath = getRoleBasePath(firstSlug, roles[firstSlug]);
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // No roles, stay on landing page
    return NextResponse.next();
  }

  // Handle SuperAdmin global /admin routes
  if (pathname.startsWith("/admin")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const isSuperAdmin = roles && Object.values(roles).includes("SuperAdmin");

    if (!isSuperAdmin) {
      // Not SuperAdmin, redirect to their first org
      if (roles && Object.keys(roles).length > 0) {
        const firstSlug = Object.keys(roles)[0];
        const targetPath = getRoleBasePath(firstSlug, roles[firstSlug]);
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  // Handle org root redirects (e.g., /liga-del-valle -> /liga-del-valle/admin)
  const orgRouteMatch = pathname.match(/^\/([^\/]+)$/);
  if (orgRouteMatch && userId) {
    const slugInUrl = orgRouteMatch[1];
    
    // Skip special routes
    if (["onboarding", "sign-in", "admin"].includes(slugInUrl)) {
      return NextResponse.next();
    }

    const role = getRoleForOrg(authData, slugInUrl);

    if (role) {
      const targetPath = getRoleBasePath(slugInUrl, role);
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // No role, allow guest access
    return NextResponse.next();
  }

  // Handle org sub-routes (e.g., /liga-del-valle/admin/users)
  const orgSubRouteMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)/);
  if (orgSubRouteMatch && userId) {
    const slugInUrl = orgSubRouteMatch[1];
    const section = orgSubRouteMatch[2];

    const role = getRoleForOrg(authData, slugInUrl);

    if (!role) {
      // No role for this org, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }

    const expectedBasePath = getRoleBasePath(slugInUrl, role);

    if (!pathname.startsWith(expectedBasePath)) {
      // User trying to access wrong section for their role
      return NextResponse.redirect(new URL(expectedBasePath, req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};