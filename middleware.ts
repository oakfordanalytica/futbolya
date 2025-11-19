import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleForOrg, getRoleBasePath, getRolesFromClaims, isSuperAdmin } from "@/lib/auth/auth";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/onboarding",
  "/match(.*)" 
]);

const isSignUp = createRouteMatcher(["/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (isSignUp(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!isPublic(req)) {
    await auth.protect();
  }

  const authData = await auth();
  const userId = authData.userId;
  
  if (isPublic(req) && !userId) {
    return NextResponse.next();
  }

  const roles = getRolesFromClaims(authData);
  const userIsSuperAdmin = isSuperAdmin(authData);

  if (pathname === "/" && userId) {
    if (userIsSuperAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (roles && Object.keys(roles).length > 0) {
      const firstSlug = Object.keys(roles).find(k => k !== "system");
      if (firstSlug) {
        const targetPath = getRoleBasePath(firstSlug, roles[firstSlug]);
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));
    
    if (userIsSuperAdmin) return NextResponse.next();

    if (roles) {
       const firstSlug = Object.keys(roles).find(k => k !== "system");
       
       if (firstSlug) return NextResponse.redirect(new URL(getRoleBasePath(firstSlug, roles[firstSlug]), req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const orgRouteMatch = pathname.match(/^\/([^\/]+)(\/.*)?$/);
  
  if (orgRouteMatch && userId) {
    const slugInUrl = orgRouteMatch[1];
    const subPath = orgRouteMatch[2] || "";

    if (["onboarding", "sign-in", "admin", "api", "_next"].includes(slugInUrl)) {
      return NextResponse.next();
    }

    const role = getRoleForOrg(authData, slugInUrl);

    if (!role) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const expectedBasePath = getRoleBasePath(slugInUrl, role);
    
    if (!subPath || subPath === "/") {
       return NextResponse.redirect(new URL(expectedBasePath, req.url));
    }

    if (!pathname.startsWith(expectedBasePath)) {
      if (userIsSuperAdmin) return NextResponse.next();

      return NextResponse.redirect(new URL(expectedBasePath, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};