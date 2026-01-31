import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";
import { internal } from "./_generated/api";
import { clerkClient } from "./clerk";

// Centralized webhook endpoint paths
const CLERK_WEBHOOK_PATH = "/clerk-webhook";
const SQUARE_WEBHOOK_PATH = "/square-webhook";

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      // User events
      case "user.created": {
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });

        // Auto-add user to organization if pendingOrganizationSlug is set
        const pendingOrgSlug = event.data.unsafe_metadata
          ?.pendingOrganizationSlug as string | undefined;
        if (pendingOrgSlug) {
          // Find organization by slug in Clerk
          const orgsResponse =
            await clerkClient.organizations.getOrganizationList({
              query: pendingOrgSlug,
            });
          const org = orgsResponse.data.find((o) => o.slug === pendingOrgSlug);

          if (org) {
            // Add user to organization with default member role
            await clerkClient.organizations.createOrganizationMembership({
              organizationId: org.id,
              userId: event.data.id,
              role: "org:member",
            });

            // Clear the pending metadata
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

      // Organization events
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

      // Organization membership events
      case "organizationMembership.created":
      case "organizationMembership.updated":
        await ctx.runMutation(internal.members.upsertFromClerk, {
          data: event.data,
        });
        break;

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
    // Return 200 to prevent Clerk from retrying infinitely
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

const handleSquareWebhook = httpAction(async (ctx, request) => {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const notificationUrl = process.env.CONVEX_SITE_URL + SQUARE_WEBHOOK_PATH;

  try {
    // Use Node.js action to verify signature and process webhook
    const result = await ctx.runAction(
      internal.square_webhook.verifyAndProcessSquareWebhook,
      {
        body,
        signature,
        notificationUrl,
      },
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error as Error;
    console.error(`Square webhook error: ${err.message}`);

    // Return appropriate error status
    if (err.message === "Invalid signature") {
      return new Response("Invalid signature", { status: 401 });
    }

    if (err.message === "SQUARE_WEBHOOK_SIGNATURE_KEY not configured") {
      return new Response("Webhook not configured", { status: 500 });
    }

    // Return 200 for other errors to prevent Square from retrying infinitely
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
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

http.route({
  path: SQUARE_WEBHOOK_PATH,
  method: "POST",
  handler: handleSquareWebhook,
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
