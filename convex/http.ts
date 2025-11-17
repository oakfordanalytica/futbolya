import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/clerk-sdk-node";
import { internal } from "./_generated/api";

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) {
    return new Response(null, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
      await ctx.runMutation(internal.users.createProfileInternal, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address ?? "",
        firstName: event.data.first_name ?? undefined,
        lastName: event.data.last_name ?? undefined,
        avatarUrl: event.data.image_url,
      });
      break;
    case "user.updated":
      // TODO: Add logic to update user profile if needed
      break;
  }

  return new Response(null, { status: 200 });
});

const http = httpRouter();
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

async function validateClerkRequest(request: Request): Promise<WebhookEvent | undefined> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const payloadString = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id")!,
    "svix-timestamp": request.headers.get("svix-timestamp")!,
    "svix-signature": request.headers.get("svix-signature")!,
  };
  
  const wh = new Webhook(webhookSecret);
  try {
    const event = wh.verify(payloadString, svixHeaders) as WebhookEvent;
    return event;
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return undefined;
  }
}

export default http;