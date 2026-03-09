import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { locales, routing, type Locale } from "@/i18n/routing";
import { getTenantAccess } from "@/lib/auth/tenant-access";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "@/lib/tenancy/config";
import { isEnabledStaffRole } from "@/lib/staff/roles";

function resolveLocale(value: unknown): Locale {
  if (typeof value === "string" && locales.includes(value as Locale)) {
    return value as Locale;
  }

  return routing.defaultLocale;
}

/**
 * POST /api/staff/invite
 *
 * - Multi-tenant: creates Clerk Organization Invitations (current flow).
 * - Single-tenant: creates Clerk user Invitations with public metadata.
 *   The Clerk webhook consumes this metadata and creates the staff record.
 */
export async function POST(request: NextRequest) {
  try {
    const authObject = await auth();
    const { userId, orgId, has, orgSlug } = authObject;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      emailAddress?: unknown;
      staffRole?: unknown;
      clubId?: unknown;
      categoryId?: unknown;
      locale?: unknown;
      tenant?: unknown;
    };

    const emailAddress =
      typeof body.emailAddress === "string" ? body.emailAddress.trim() : "";
    const clubId = typeof body.clubId === "string" ? body.clubId : "";
    const categoryId =
      typeof body.categoryId === "string" ? body.categoryId : "";
    const tenant =
      typeof body.tenant === "string" && body.tenant.trim().length > 0
        ? body.tenant.trim().toLowerCase()
        : null;

    if (!emailAddress || !clubId || !isEnabledStaffRole(body.staffRole)) {
      return NextResponse.json(
        { error: "Missing required fields: emailAddress, staffRole, clubId" },
        { status: 400 },
      );
    }

    const client = await clerkClient();
    const locale = resolveLocale(body.locale);

    if (isSingleTenantMode()) {
      if (tenant && tenant !== DEFAULT_TENANT_SLUG) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 },
        );
      }

      const tenantAccess = await getTenantAccess(DEFAULT_TENANT_SLUG);
      if (!tenantAccess.hasAccess || !tenantAccess.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      const redirectUrl = new URL(
        `${localePrefix}/${DEFAULT_TENANT_SLUG}/sign-up`,
        request.url,
      ).toString();

      const invitation = await client.invitations.createInvitation({
        emailAddress,
        redirectUrl,
        publicMetadata: {
          role: "coach",
          pendingStaff: {
            staffRole: body.staffRole,
            clubId,
            ...(categoryId ? { categoryId } : {}),
          },
        },
      });

      return NextResponse.json({
        success: true,
        invitationId: invitation.id,
      });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canInviteInOrg =
      (has?.({ role: "org:admin" }) ?? false) ||
      (has?.({ role: "org:superadmin" }) ?? false);
    if (!canInviteInOrg) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (tenant && orgSlug && tenant !== orgSlug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    const targetTenant = tenant ?? orgSlug;
    const redirectUrl = targetTenant
      ? new URL(
          `${localePrefix}/${targetTenant}/sign-up`,
          request.url,
        ).toString()
      : undefined;

    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress,
      role: "org:member",
      publicMetadata: {
        staffRole: body.staffRole,
        clubId,
        ...(categoryId ? { categoryId } : {}),
      },
      ...(redirectUrl ? { redirectUrl } : {}),
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
    });
  } catch (error) {
    console.error("[/api/staff/invite] Error creating invitation:", error);

    if (error && typeof error === "object") {
      const clerkError = error as {
        errors?: Array<{ message: string; code: string }>;
        message?: string;
      };

      if (clerkError.errors && clerkError.errors.length > 0) {
        const errorMessages = clerkError.errors
          .map((item) => item.message)
          .join(", ");
        console.error("[/api/staff/invite] Clerk errors:", clerkError.errors);
        return NextResponse.json({ error: errorMessages }, { status: 400 });
      }

      if (clerkError.message) {
        return NextResponse.json(
          { error: clerkError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
