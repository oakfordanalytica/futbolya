import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";
import { internal } from "./_generated/api";
import { clerkClient } from "./clerk";

const CLERK_WEBHOOK_PATH = "/clerk-webhook";

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created": {
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });

        const pendingOrgSlug = event.data.unsafe_metadata
          ?.pendingOrganizationSlug as string | undefined;
        if (pendingOrgSlug) {
          const orgsResponse =
            await clerkClient.organizations.getOrganizationList({
              query: pendingOrgSlug,
            });
          const org = orgsResponse.data.find((o) => o.slug === pendingOrgSlug);

          if (org) {
            await clerkClient.organizations.createOrganizationMembership({
              organizationId: org.id,
              userId: event.data.id,
              role: "org:member",
            });

            await clerkClient.users.updateUser(event.data.id, {
              unsafeMetadata: {
                ...event.data.unsafe_metadata,
                pendingOrganizationSlug: undefined,
              },
            });
          }
        }
        break;
      }

      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted":
        if (event.data?.id) {
          await ctx.runMutation(internal.users.deactivateUser, {
            clerkId: event.data.id,
          });
        }
        break;

      case "organization.created":
        await ctx.runMutation(internal.organizations.createFromClerk, {
          clerkOrgId: event.data.id,
          name: event.data.name,
          slug: event.data.slug ?? event.data.id,
          imageUrl: event.data.image_url ?? undefined,
        });
        break;

      case "organization.updated":
        await ctx.runMutation(internal.organizations.updateFromClerk, {
          clerkOrgId: event.data.id,
          name: event.data.name,
          slug: event.data.slug ?? event.data.id,
          imageUrl: event.data.image_url ?? undefined,
        });
        break;

      case "organization.deleted":
        if (event.data.id) {
          await ctx.runMutation(internal.organizations.deleteFromClerk, {
            clerkOrgId: event.data.id,
          });
        }
        break;

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        // First, upsert the organization member
        const membershipResult = await ctx.runMutation(
          internal.members.upsertFromClerk,
          {
            data: event.data,
          },
        );

        // Check if this membership has staff metadata (from invitation)
        // When a user accepts an invitation, publicMetadata from the invitation
        // is transferred to the OrganizationMembership
        const publicMetadata = event.data.public_metadata as
          | {
              staffRole?: string;
              clubId?: string;
              categoryId?: string;
            }
          | undefined;

        if (
          publicMetadata?.staffRole &&
          publicMetadata?.clubId &&
          membershipResult
        ) {
          // Get the user ID from the membership
          const clerkUserId = event.data.public_user_data?.user_id;
          if (clerkUserId) {
            // Find the Convex user by Clerk ID
            const user = await ctx.runQuery(internal.users.getByClerkId, {
              clerkId: clerkUserId,
            });

            if (user) {
              // Create the staff record
              await ctx.runMutation(internal.staff.createFromClerkMembership, {
                userId: user._id,
                clubId: publicMetadata.clubId,
                staffRole: publicMetadata.staffRole,
                categoryId: publicMetadata.categoryId,
              });
            }
          }
        }
        break;
      }

      case "organizationMembership.deleted":
        await ctx.runMutation(internal.members.deleteFromClerk, {
          data: event.data,
        });
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error as Error;
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

const http = httpRouter();

http.route({
  path: CLERK_WEBHOOK_PATH,
  method: "POST",
  handler: handleClerkWebhook,
});

async function validateClerkRequest(
  request: Request,
): Promise<WebhookEvent | undefined> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not configured");
    return undefined;
  }

  const payload = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") || "",
    "svix-timestamp": request.headers.get("svix-timestamp") || "",
    "svix-signature": request.headers.get("svix-signature") || "",
  };

  const wh = new Webhook(webhookSecret);
  try {
    const event = wh.verify(payload, svixHeaders) as WebhookEvent;
    return event;
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook verification failed: ${error.message}`);
    return undefined;
  }
}

export default http;
