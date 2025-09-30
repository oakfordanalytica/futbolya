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
        // This mutation will create the user, persona, and assign a default role.
        await ctx.runMutation(internal.users.createUser, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address,
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
        });
        break;
      // We can handle other events like user.updated or user.deleted here
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;