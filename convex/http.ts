import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";
import { internal } from "./_generated/api";
import { clerkClient } from "./clerk";
import { DEFAULT_TENANT_SLUG, isSingleTenantMode } from "./lib/tenancy";
import { roleFromPublicMetadata } from "@/lib/auth/roles";
import { processPendingStaffInvite } from "./lib/pending_staff_invite";

const CLERK_WEBHOOK_PATH = "/clerk-webhook";
const SINGLE_TENANT_MODE = isSingleTenantMode();

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created": {
        const currentClerkUser = SINGLE_TENANT_MODE
          ? await clerkClient.users.getUser(event.data.id)
          : null;
        const publicMetadata =
          currentClerkUser?.publicMetadata ?? event.data.public_metadata;
        const role = roleFromPublicMetadata(publicMetadata);
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: {
            ...event.data,
            public_metadata: publicMetadata,
            ...(currentClerkUser
              ? { updated_at: currentClerkUser.updatedAt }
              : {}),
          },
        });

        if (SINGLE_TENANT_MODE && currentClerkUser) {
          const accessSynced = await ctx.runMutation(
            internal.members.syncFromSingleTenant,
            {
              clerkUserId: event.data.id,
              organizationSlug: DEFAULT_TENANT_SLUG,
              clerkUpdatedAt: currentClerkUser.updatedAt,
              ...(role ? { role } : {}),
            },
          );
          if (accessSynced && role === "coach") {
            await processPendingStaffInvite({
              ctx,
              clerkUserId: event.data.id,
              clerkUpdatedAt: currentClerkUser.updatedAt,
              publicMetadata,
            });
          }
          break;
        }

        const pendingOrgSlug = event.data.unsafe_metadata
          ?.pendingOrganizationSlug as string | undefined;
        if (pendingOrgSlug) {
          const organizations =
            await clerkClient.organizations.getOrganizationList({
              query: pendingOrgSlug,
            });
          const organization = organizations.data.find(
            (item) => item.slug === pendingOrgSlug,
          );

          if (organization) {
            await clerkClient.organizations.createOrganizationMembership({
              organizationId: organization.id,
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

      case "user.updated": {
        const currentClerkUser = SINGLE_TENANT_MODE
          ? await clerkClient.users.getUser(event.data.id)
          : null;
        const publicMetadata =
          currentClerkUser?.publicMetadata ?? event.data.public_metadata;
        const role = roleFromPublicMetadata(publicMetadata);
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: {
            ...event.data,
            public_metadata: publicMetadata,
            ...(currentClerkUser
              ? { updated_at: currentClerkUser.updatedAt }
              : {}),
          },
        });

        if (SINGLE_TENANT_MODE && currentClerkUser) {
          const accessSynced = await ctx.runMutation(
            internal.members.syncFromSingleTenant,
            {
              clerkUserId: event.data.id,
              organizationSlug: DEFAULT_TENANT_SLUG,
              clerkUpdatedAt: currentClerkUser.updatedAt,
              ...(role ? { role } : {}),
            },
          );
          if (accessSynced && role === "coach") {
            await processPendingStaffInvite({
              ctx,
              clerkUserId: event.data.id,
              clerkUpdatedAt: currentClerkUser.updatedAt,
              publicMetadata,
            });
          }
        }
        break;
      }

      case "user.deleted":
        if (event.data?.id) {
          await ctx.runMutation(internal.users.deactivateUser, {
            clerkId: event.data.id,
          });
        }
        break;

      case "organization.created":
        if (SINGLE_TENANT_MODE) {
          break;
        }
        await ctx.runMutation(internal.organizations.createFromClerk, {
          clerkOrgId: event.data.id,
          name: event.data.name,
          slug: event.data.slug ?? event.data.id,
          imageUrl: event.data.image_url ?? undefined,
        });
        break;

      case "organization.updated":
        if (SINGLE_TENANT_MODE) {
          break;
        }
        await ctx.runMutation(internal.organizations.updateFromClerk, {
          clerkOrgId: event.data.id,
          name: event.data.name,
          slug: event.data.slug ?? event.data.id,
          imageUrl: event.data.image_url ?? undefined,
        });
        break;

      case "organization.deleted":
        if (SINGLE_TENANT_MODE) {
          break;
        }
        if (event.data.id) {
          await ctx.runMutation(internal.organizations.deleteFromClerk, {
            clerkOrgId: event.data.id,
          });
        }
        break;

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        if (SINGLE_TENANT_MODE) {
          break;
        }

        const membershipResult = await ctx.runMutation(
          internal.members.upsertFromClerk,
          {
            data: event.data,
          },
        );

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
          const clerkUserId = event.data.public_user_data?.user_id;
          if (clerkUserId) {
            const user = await ctx.runQuery(internal.users.getByClerkId, {
              clerkId: clerkUserId,
            });

            if (user) {
              await ctx.runMutation(internal.staff.createFromClerkMembership, {
                userId: user._id,
                membershipId: membershipResult,
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
        if (SINGLE_TENANT_MODE) {
          break;
        }
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
        status: 500,
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
    return wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook verification failed: ${error.message}`);
    return undefined;
  }
}

export default http;
