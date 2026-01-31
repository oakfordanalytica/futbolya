import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/staff/invite
 *
 * Creates a Clerk Organization Invitation with staff metadata.
 * When the user accepts the invitation, the webhook will read the metadata
 * from OrganizationMembership.publicMetadata and create the staff record.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emailAddress, staffRole, clubId, categoryId } = body;

    // Validate required fields
    if (!emailAddress || !staffRole || !clubId) {
      return NextResponse.json(
        { error: "Missing required fields: emailAddress, staffRole, clubId" },
        { status: 400 },
      );
    }

    // Validate staffRole
    const validRoles = ["head_coach", "technical_director", "assistant_coach"];
    if (!validRoles.includes(staffRole)) {
      return NextResponse.json(
        {
          error: `Invalid staffRole. Must be one of: ${validRoles.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const client = await clerkClient();

    // Create organization invitation with staff metadata
    // The publicMetadata will be transferred to OrganizationMembership.publicMetadata
    // when the user accepts the invitation
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress,
      role: "org:member",
      publicMetadata: {
        staffRole,
        clubId,
        ...(categoryId && { categoryId }),
      },
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
    });
  } catch (error) {
    console.error("[/api/staff/invite] Error creating invitation:", error);

    // Check if it's a Clerk error with more details
    if (error && typeof error === "object") {
      const clerkError = error as {
        errors?: Array<{ message: string; code: string }>;
        message?: string;
      };

      // Clerk errors often have an errors array
      if (clerkError.errors && clerkError.errors.length > 0) {
        const errorMessages = clerkError.errors
          .map((e) => e.message)
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
