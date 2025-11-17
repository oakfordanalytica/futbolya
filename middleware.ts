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

  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("Pathname:", pathname);

  if (isSignUp(req)) {
    console.log("Blocking sign-up route");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!isPublic(req)) {
    console.log("Protecting route");
    await auth.protect();
  }

  const authData = await auth();
  const userId = authData.userId;
  const roles = getRolesFromClaims(authData);

  console.log("UserId:", userId);
  console.log("Roles from claims:", roles);
  console.log("Session claims:", JSON.stringify(authData.sessionClaims, null, 2));

  // Handle SuperAdmin global /admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    console.log("Checking SuperAdmin access for /admin route");
    
    if (!userId) {
      console.log("No userId, redirecting to sign-in");
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const isSuperAdmin = roles && Object.values(roles).includes("SuperAdmin");
    console.log("Is SuperAdmin:", isSuperAdmin);

    if (!isSuperAdmin) {
      console.log("Not SuperAdmin, redirecting to first org or home");
      if (roles && Object.keys(roles).length > 0) {
        const firstSlug = Object.keys(roles)[0];
        const targetPath = getRoleBasePath(firstSlug, roles[firstSlug]);
        console.log("Redirecting to:", targetPath);
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    console.log("SuperAdmin access granted");
    return NextResponse.next();
  }

  // Handle org root redirects (e.g., /liga-del-valle -> /liga-del-valle/admin)
  const orgRouteMatch = pathname.match(/^\/([^\/]+)$/);
  if (orgRouteMatch && userId) {
    const slugInUrl = orgRouteMatch[1];
    console.log("Matched org root:", slugInUrl);
    
    if (slugInUrl === "onboarding" || slugInUrl === "sign-in" || slugInUrl === "admin") {
      console.log("Special route, skipping redirect");
      return NextResponse.next();
    }

    const role = getRoleForOrg(authData, slugInUrl);
    console.log("Role for org:", role);

    if (role) {
      const targetPath = getRoleBasePath(slugInUrl, role);
      console.log("Redirecting to role dashboard:", targetPath);
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    console.log("No role found, allowing guest access");
    return NextResponse.next();
  }

  // Handle org sub-routes (e.g., /liga-del-valle/admin/users)
  const orgSubRouteMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)/);
  if (orgSubRouteMatch && userId) {
    const slugInUrl = orgSubRouteMatch[1];
    const section = orgSubRouteMatch[2];
    
    console.log("Matched org sub-route:", slugInUrl, section);

    const role = getRoleForOrg(authData, slugInUrl);
    console.log("Role for org sub-route:", role);

    if (!role) {
      console.log("No role found for sub-route, redirecting to home");
      return NextResponse.redirect(new URL("/", req.url));
    }

    const expectedBasePath = getRoleBasePath(slugInUrl, role);
    console.log("Expected base path:", expectedBasePath);
    console.log("Current path starts with expected?", pathname.startsWith(expectedBasePath));

    if (!pathname.startsWith(expectedBasePath)) {
      console.log("Path doesn't match role, redirecting to correct dashboard");
      return NextResponse.redirect(new URL(expectedBasePath, req.url));
    }

    console.log("Access granted to sub-route");
    return NextResponse.next();
  }

  console.log("No special handling, continuing");
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};