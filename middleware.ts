import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRouteByRole } from "@/lib/auth/auth";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/:org/sign-in(.*)",
  "/:org/apply(.*)",
]);

const isSignUp = createRouteMatcher([
  "/sign-up(.*)",
  "/:org/sign-up(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { pathname } = req.nextUrl;

    if (isSignUp(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (!isPublic(req)) {
      await auth.protect();
    }

    const authData = await auth();
    const userId = authData.userId;
    const orgSlug = authData.orgSlug;

    if (pathname === "/" && userId) {
      if (orgSlug) {
        const targetPath = getRouteByRole(authData, orgSlug);
        return NextResponse.redirect(new URL(targetPath, req.url));
      } else {
        return NextResponse.next();
      }
    }

    const orgRouteMatch = pathname.match(/^\/([^\/]+)$/);
    if (orgRouteMatch && userId && orgSlug) {
      const slugInUrl = orgRouteMatch[1];

      if (slugInUrl === orgSlug) {
        const targetPath = getRouteByRole(authData, orgSlug);
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
    }
    return NextResponse.next();
  },
  {
    organizationSyncOptions: {
      organizationPatterns: ["/:slug", "/:slug/(.*)"],
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};