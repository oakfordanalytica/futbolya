// convex/http.ts

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // This is an unsecured webhook, so we need to verify the source
    // You can do this by checking the `svix-id`, `svix-timestamp`, and `svix-signature` headers
    // For simplicity in this example, we'll skip that part, but DO NOT skip it in production.
    // See: https://docs.clerk.com/integration/webhooks#verify-the-webhook-request

    const payload = await request.json();
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
                  futbolYaRole: "Pending"
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