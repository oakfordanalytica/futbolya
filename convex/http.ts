// convex/http.ts

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify the webhook signature
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }

    const body = await request.text();
    const wh = new Webhook(webhookSecret);

    let payload;
    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as any;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }
    
    switch (payload.type) {
      case "user.created":
        const emailAddress = payload.data.email_addresses[0]?.email_address;
        const username = payload.data.username;

        // Create user in Convex
        await ctx.runMutation(internal.users.createUser, {
          clerkId: payload.data.id,
          email: emailAddress ?? "",
          userName: username,
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
        });

        // Also set an initial "Pending" role in Clerk
        const clerkAPIKey = process.env.CLERK_SECRET_KEY;
        if (clerkAPIKey) {
          try {
            await fetch(`https://api.clerk.com/v1/users/${payload.data.id}/metadata`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${clerkAPIKey}`,
              },
              body: JSON.stringify({
                public_metadata: {
                  futbolYaRole: "pending"
                }
              }),
            });
          } catch (e) {
            console.error("Failed to set initial role:", e);
          }
        }
        break;
      // We can handle other events like user.updated or user.deleted here
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;