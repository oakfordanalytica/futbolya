import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRouteByRole } from "@/lib/auth/auth";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)", // login global (superadmin)
  "/:org/sign-in(.*)", // login de tenant
  "/:org/sign-up(.*)",
  "/:org/apply(.*)", // páginas públicas del tenant (si las tienes)
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, orgSlug, has } = await auth();
    const { pathname } = req.nextUrl;
    if (!isPublic(req)) await auth.protect();

    if (pathname === "/" && userId) {
      if (orgSlug) {
        const targetPath = getRouteByRole(orgSlug, has);
        return NextResponse.redirect(new URL(targetPath, req.url));
      } else {
        return NextResponse.next();
      }
    }

    const orgRouteMatch = pathname.match(/^\/([^\/]+)$/);
    if (orgRouteMatch && userId && orgSlug) {
      const slugInUrl = orgRouteMatch[1];

      if (slugInUrl === orgSlug) {
        if (slugInUrl === orgSlug) {
          const targetPath = getRouteByRole(orgSlug, has);
          return NextResponse.redirect(new URL(targetPath, req.url));
        }
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
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
