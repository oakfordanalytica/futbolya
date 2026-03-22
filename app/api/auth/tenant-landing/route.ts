import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";
import { resolveTenantLanding } from "@/lib/auth/tenant-landing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant");

  if (!tenant) {
    return NextResponse.json(
      { error: "Missing tenant slug" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authObject = await auth();

  if (!authObject.userId) {
    return NextResponse.json(
      { status: "unauthenticated" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = await authObject.getToken({ template: "convex" });

  if (!token) {
    return NextResponse.json(
      { status: "pending" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  await syncCurrentUser(token);
  const resolution = await resolveTenantLanding(tenant, token);

  if (resolution.status === "pending") {
    return NextResponse.json(
      resolution,
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (resolution.status === "forbidden") {
    return NextResponse.json(
      resolution,
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    resolution,
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
