---
title: Invite users to your Organization
description: Send, manage, and track user invitations within your multi-tenant
  SaaS using Clerk Organizations.
metadata:
  title: Send and manage Organization invitations via Clerk
lastUpdated: 2026-01-29T16:35:17.000Z
sdkScoped: "false"
canonical: /docs/guides/organizations/add-members/invitations
sourceFile: /docs/guides/organizations/add-members/invitations.mdx
---

Organization invitations let you add new members to your Organization. When you send an invitation, Clerk sends an email to the invited user with a unique invitation link. When the user visits the Organization invitation link, Clerk redirects them to the [Account Portal sign-in page](/docs/guides/account-portal/overview#sign-in). If the user is already signed in, Clerk redirects them to your application's homepage (`/`). If you want to redirect the user to a specific page in your application, you can [specify a redirect URL when creating the invitation](#redirect-url).

By default, only [admins](/docs/guides/organizations/control-access/roles-and-permissions#default-roles) can invite users to an Organization.

This feature requires that [**Email** is enabled](/docs/guides/configure/auth-strategies/sign-up-sign-in-options#email), as Clerk uses the user's email address to send the invitation. You can still disable **Email** as a sign-in option if you do not want users to be able to sign-in with their email address.

To configure your application's **Email** settings, navigate to the [**User & authentication**](https://dashboard.clerk.com/~/user-authentication/user-and-authentication) page in the Clerk Dashboard.

## When to use invitations

Invitations work well when you need precise control over who joins your Organization and which Role they receive. This approach fits scenarios where:

* Teams are small and members are known in advance.
* Onboarding requires manual approval or review.
* Specific Roles need to be assigned during the invitation.

If you want to streamline enrollment for users with company email addresses, consider [Verified Domains](/docs/guides/organizations/add-members/verified-domains), which can automatically invite users based on their email domain. If customers require centralized authentication through their Identity Provider, use [Enterprise SSO](/docs/guides/organizations/add-members/sso).

## Create an invitation

Clerk's <SDKLink href="/docs/:sdk:/reference/components/overview" sdks={["react","nextjs","js-frontend","chrome-extension","expo","expressjs","fastify","react-router","remix","tanstack-react-start","go","astro","nuxt","vue","ruby","js-backend"]}>prebuilt components</SDKLink> and [Account Portal pages](/docs/guides/account-portal/overview) manage all Organization invitation flows, including creating, managing, and accepting invitations.

However, if you want to build custom flows, see the following sections.

### Client-side

To create an Organization invitation on the client-side, see the [dedicated guide](/docs/guides/development/custom-flows/organizations/manage-organization-invitations). Note that this uses the <SDKLink href="/docs/reference/javascript/organization#invite-member" sdks={["js-frontend"]} code={true}>organizations.inviteMember()</SDKLink> method, which does not let you specify a redirect URL; it will always redirect to the Account Portal sign-in page. If you want to specify a redirect URL, you must create the invitation on the server-side.

### Server-side

To create Organization invitations on the server-side, use the [Backend API](/docs/reference/backend-api/tag/organization-invitations/post/organizations/\{organization_id}/invitations){{ target: '_blank' }} either by using a cURL command or the <SDKLink href="/docs/js-backend/getting-started/quickstart" sdks={["js-backend"]}>JS Backend SDK</SDKLink>. The JS Backend SDK is a wrapper around the Backend API that makes it easier to interact with the API.

Use the following tabs to see examples for each method.

<Tabs items={["cURL", "JS Backend SDK"]}>
  <Tab>
    The following example demonstrates how to create an Organization invitation using cURL.

    <SignedIn>
      * Your <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip> is already injected into the code snippet.
      * Replace the `org_123` with the ID of the Organization you want to invite the user to.
      * Replace the `user_123` with the ID of the user who is inviting the other user.
      * Replace the email address with the email address you want to invite.
      * Replace the `role` with the role you want to assign to the invited user.
    </SignedIn>

    <SignedOut>
      * Replace `YOUR_SECRET_KEY` with your Clerk <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip>.
      * Replace the `org_123` with the ID of the Organization you want to invite the user to.
      * Replace the `user_123` with the ID of the user who is inviting the other user.
      * Replace the email address with the email address you want to invite.
      * Replace the `role` with the Role you want to assign to the invited user.
    </SignedOut>

    ```bash {{ filename: 'terminal' }}
    curl 'https://api.clerk.com/v1/organizations/{org_123}/invitations' \
    -X POST \
    -H 'Authorization: Bearer {{secret}}' \
    -H 'Content-Type: application/json' \
    -d '{ "inviter_user_id": "user_123", "email_address": "email@example.com", "role": "org:member" }'
    ```
  </Tab>

  <Tab>
    To use the JS Backend SDK to create an invitation, see the <SDKLink href="/docs/reference/backend/organization/create-organization-invitation" sdks={["js-backend"]} code={true}>createOrganizationInvitation()</SDKLink> reference documentation.
  </Tab>
</Tabs>

For an example of the response, see the [Backend API reference](/docs/reference/backend-api/tag/organization-invitations/post/organizations/\{organization_id}/invitations){{ target: '_blank' }}.

### Redirect URL

When you create an invitation, you can specify a `redirect_url` parameter. This parameter tells Clerk where to redirect the user when they visit the invitation link.

The following example demonstrates how to use cURL to create an invitation with the `redirect_url` set to `https://www.example.com/accept-invitation`.

```bash
curl 'https://api.clerk.com/v1/organizations/{org_123}/invitations' \
  -X POST \
  -H 'Authorization: Bearer {{secret}}' \
  -H 'Content-Type: application/json' \
  -d '{ "inviter_user_id": "user_123", "email_address": "email@example.com", "role": "org:member", "redirect_url": "https://www.example.com/accept-invitation" }'
```

Once the user visits the invitation link, they will be redirected to the page you specified. On that page, you must handle the authentication flow in your code. You can either embed the <SDKLink href="/docs/:sdk:/reference/components/authentication/sign-in" sdks={["astro","chrome-extension","expo","nextjs","nuxt","react","react-router","remix","tanstack-react-start","vue","js-frontend"]} code={true}>\<SignIn /></SDKLink> component or, if the prebuilt component doesn't meet your needs or you require more control over the logic, you can build a [custom flow](/docs/guides/development/custom-flows/organizations/accept-organization-invitations).

> \[!TIP]
>
> To test redirect URLs in your development environment, pass your port. For example, `http://localhost:3000/accept-invitation`.

### Invitation metadata

You can also add metadata to an invitation when creating the invitation through the Backend API. Once the invited user signs up using the invitation link, Clerk stores the **invitation** metadata (`OrganizationInvitation.publicMetadata`) in the Organization **membership's** metadata (`OrganizationMembership.publicMetadata`). For more details on Organization membership metadata, see the <SDKLink href="/docs/reference/javascript/types/organization-membership" sdks={["js-frontend"]}>OrganizationMembership</SDKLink> reference.

To add metadata to an invitation, add the `public_metadata` parameter when creating the invitation.

The following example demonstrates how to use cURL to create an invitation with metadata.

```bash
curl 'https://api.clerk.com/v1/organizations/{org_123}/invitations' \
  -X POST \
  -H 'Authorization: Bearer {{secret}}' \
  -H 'Content-Type: application/json' \
  -d '{ "inviter_user_id": "user_123", "email_address": "email@example.com", "role": "org:member", "public_metadata": {"department": "marketing"} }'
```

## Revoke an invitation

Revoking an invitation prevents the user from using the invitation link that was sent to them.

### Client-side

To revoke an invitation client-side, see the [dedicated guide](/docs/guides/development/custom-flows/organizations/manage-organization-invitations).

### Server-side

To revoke an invitation server-side, use the [Backend API](/docs/reference/backend-api/tag/organization-invitations/post/organizations/\{organization_id}/invitations/\{invitation_id}/revoke){{ target: '_blank' }}. either by using a cURL command or the <SDKLink href="/docs/js-backend/getting-started/quickstart" sdks={["js-backend"]}>JS Backend SDK</SDKLink>. The JS Backend SDK is a wrapper around the Backend API that makes it easier to interact with the API.

Use the following tabs to see examples for each method.

<Tabs items={["cURL", "JS Backend SDK"]}>
  <Tab>
    The following example demonstrates how to revoke an invitation using cURL.

    <SignedIn>
      * Your <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip> is already injected into the code snippet.
      * Replace the `inv_123` with the ID of the invitation you want to revoke.
      * Replace the `user_123` with the ID of the user who is revoking the invitation.
    </SignedIn>

    <SignedOut>
      * Replace `YOUR_SECRET_KEY` with your Clerk <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip>.
      * Replace the `inv_123` with the ID of the invitation you want to revoke.
      * Replace the `user_123` with the ID of the user who is revoking the invitation.
    </SignedOut>

    ```bash {{ filename: 'terminal' }}
    curl 'https://api.clerk.com/v1/organizations/{org_123}/invitations/{inv_123}/revoke' \
      -X POST \
      -H 'Authorization: Bearer {{secret}}' \
      -H 'Content-Type: application/json' \
      -d '{ "requesting_user_id": "user_123" }'
    ```
  </Tab>

  <Tab>
    To use the JS Backend SDK to revoke an Organization invitation, see the <SDKLink href="/docs/reference/backend/organization/revoke-organization-invitation" sdks={["js-backend"]} code={true}>revokeOrganizationInvitation()</SDKLink> reference documentation.
  </Tab>
</Tabs>

## Next steps

Now that you know how to invite users to your Organization, you can:

* [Configure Verified Domains](/docs/guides/organizations/add-members/verified-domains) to automatically invite users based on their email domain
* [Set up Enterprise SSO Connections](/docs/guides/organizations/add-members/sso) for centralized authentication through an Identity Provider
* [Set up Roles and Permissions](/docs/guides/organizations/control-access/roles-and-permissions) to control what invited users can access
* [Add metadata to invitations](/docs/guides/organizations/metadata) for tracking or custom workflows

---
title: Invite users to your application
description: Learn how to invite users to your Clerk application.
lastUpdated: 2026-01-29T16:35:17.000Z
sdkScoped: "false"
canonical: /docs/guides/users/inviting
sourceFile: /docs/guides/users/inviting.mdx
---

Inviting users to your Clerk application allows you to onboard new users seamlessly by sending them a unique invitation link.

Once you create an invitation, Clerk sends an email to the invited user with a unique invitation link. When the user visits the invitation link, they will be redirected to the [Account Portal sign-up page](/docs/guides/account-portal/overview#sign-up) and **their email address will be automatically verified.** If you want to redirect the user to a specific page in your application, you can [specify a redirect URL when creating the invitation](#with-a-redirect-url).

Invitations expire after a month. If the user clicks on an expired invitation, they will get redirected to the application's sign-up page and will have to go through the normal sign-up flow. Their email address will not be auto-verified.

> \[!TIP]
> Invitations are only used to invite users to your application. The application will still be available to everyone even without an invitation. If you're looking to restrict access to invited users only, refer to the [**Restricted** sign-up mode](/docs/guides/secure/restricting-access#sign-up-modes).

## Create an invitation

You can create an invitation either in the [Clerk Dashboard](#in-the-clerk-dashboard) or [programmatically](#programmatically). When making this decision, keep in mind that if you create an invitation through the Clerk Dashboard, you can only set an invitation expiration date. If you create an invitation programatically, you are able to set more options, such as the URL you want the user to be redirected to after they accept the invitation, metadata to add to the invitation, or whether an invitation should be created if there is already an existing invitation for the given email address.

### In the Clerk Dashboard

To create an invitation in the Clerk Dashboard, navigate to the [**Invitations**](https://dashboard.clerk.com/~/users/invitations) page.

### Programmatically

To create an invitation programmatically, you can either <SDKLink href="/docs/reference/backend/invitations/create-invitation#backend-api-bapi-endpoint" sdks={["js-backend"]}>make a request directly to Clerk's Backend API</SDKLink> or use the <SDKLink href="/docs/reference/backend/invitations/create-invitation" sdks={["js-backend"]} code={true}>createInvitation()</SDKLink> method as shown in the following example.

<Tabs items={["Next.js", "Astro", "Express", "React Router", "Tanstack React Start"]}>
  <Tab>
    ```ts {{ filename: 'app/api/example/route.ts' }}
    import { clerkClient } from '@clerk/nextjs/server'
    import { NextResponse } from 'next/server'

    export async function POST() {
      const client = await clerkClient()
      const invitation = await client.invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
      })

      return NextResponse.json({ message: 'Invitation created', invitation })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'src/api/example.ts' }}
    import type { APIRoute } from 'astro'
    import { clerkClient } from '@clerk/astro/server'

    export const POST: APIRoute = async (context) => {
      await clerkClient(context).invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
      })

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    ```
  </Tab>

  <Tab>
    ```ts {{ filename: 'public.ts' }}
    import { getAuth, clerkClient } from '@clerk/express'

    app.post('/createUser', async (req, res) => {
      await clerkClient.invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
        password: 'password',
      })

      res.status(200).json({ success: true })
    })
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/example.tsx' }}
    import { clerkClient } from '@clerk/react-router/server'
    import type { Route } from './+types/example'
    import { json } from 'react-router-dom'

    export async function action({ request }: Route.ActionArgs) {
      const formData = await request.formData()
      const emailAddress = formData.get('emailAddress')
      const redirectUrl = formData.get('redirectUrl')
      const publicMetadata = formData.get('publicMetadata')

      await clerkClient.invitations.createInvitation({
        emailAddress: emailAddress,
        redirectUrl: redirectUrl,
        publicMetadata: publicMetadata,
      })

      return json({ success: true })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/api/example.tsx' }}
    import { json } from '@tanstack/react-start'
    import { createFileRoute } from '@tanstack/react-router'
    import { clerkClient } from '@clerk/tanstack-react-start/server'

    export const ServerRoute = createFileRoute('/api/example')({
      server: {
        handlers: {
          POST: async () => {
            await clerkClient().invitations.createInvitation({
              emailAddress: 'invite@example.com',
              redirectUrl: 'https://www.example.com/my-sign-up',
              publicMetadata: {
                example: 'metadata',
                example_nested: {
                  nested: 'metadata',
                },
              },
            })

            return json({ success: true })
          },
        },
      },
    })
    ```
  </Tab>
</Tabs>

See the [Backend API reference](/docs/reference/backend-api/tag/invitations/post/invitations){{ target: '_blank' }} for an example of the response.

### With a redirect URL

> \[!WARNING]
> You currently cannot specify a redirect URL when creating an invitation in the Clerk Dashboard; if you need to specify a redirect URL, you need to create the invitation programmatically.

When you create an invitation programmatically, you can specify a `redirectUrl` parameter. This parameter tells Clerk where to redirect the user when they visit the invitation link.

Once the user visits the invitation link, they will be redirected to the page you specified, which means **you must handle the sign-up flow in your code for that page**. You can either embed the <SDKLink href="/docs/:sdk:/reference/components/authentication/sign-up" sdks={["astro","chrome-extension","expo","nextjs","nuxt","react","react-router","remix","tanstack-react-start","vue","js-frontend"]} code={true}>\<SignUp /></SDKLink> component on that page, or if the prebuilt component doesn't meet your specific needs or if you require more control over the logic, you can build a [custom flow](/docs/guides/development/custom-flows/authentication/application-invitations).

> \[!TIP]
>
> * To test redirect URLs in your development environment, pass your port (e.g. `http://localhost:3000`).
> * To use the Account Portal, pass the URL provided by Clerk on the [**Account Portal**](https://dashboard.clerk.com/~/account-portal) page in the Clerk Dashboard. For example, `https://prepared-phoenix-98.accounts.dev/sign-up` redirects the user to the Account Portal sign-up page.

### With invitation metadata

When you create an invitation programmatically, you can specify a `publicMetadata` parameter to add metadata to an invitation. Once the invited user signs up using the invitation link, the invitation metadata will end up in the user's public metadata. [Learn more about user metadata](/docs/guides/users/extending).

## Revoke an invitation

You can revoke an invitation at any time. Revoking an invitation prevents the user from using the invitation link that was sent to them. You can revoke an invitation in the [Clerk Dashboard](#in-the-clerk-dashboard-2) or [programmatically](#programmatically-2).

> \[!WARNING]
> Revoking an invitation does **not** prevent the user from signing up on their own. If you're looking to restrict access to invited users only, refer to the [**Restricted** sign-up mode](/docs/guides/secure/restricting-access#sign-up-modes).

### In the Clerk Dashboard

To revoke an invitation in the Clerk Dashboard, navigate to the [**Invitations**](https://dashboard.clerk.com/~/users/invitations) page.

### Programmatically

To revoke an invitation programmatically, you can either <SDKLink href="/docs/reference/backend/invitations/revoke-invitation#backend-api-bapi-endpoint" sdks={["js-backend"]}>make a request directly to Clerk's Backend API</SDKLink> or use the <SDKLink href="/docs/reference/backend/invitations/revoke-invitation" sdks={["js-backend"]} code={true}>revokeInvitation()</SDKLink> method as shown in the following example.

<Tabs items={["Next.js", "Astro", "Express", "React Router", "Tanstack React Start"]}>
  <Tab>
    ```ts {{ filename: 'app/api/example/route.ts' }}
    import { clerkClient } from '@clerk/nextjs/server'
    import { NextResponse } from 'next/server'

    export async function POST() {
      const client = await clerkClient()
      const invitation = await client.invitations.revokeInvitation({
        invitationId: 'invitation_123',
      })

      return NextResponse.json({ message: 'Invitation revoked' })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'src/api/example.ts' }}
    import type { APIRoute } from 'astro'
    import { clerkClient } from '@clerk/astro/server'

    export const POST: APIRoute = async (context) => {
      await clerkClient(context).invitations.revokeInvitation({
        invitationId: 'invitation_123',
      })

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    ```
  </Tab>

  <Tab>
    ```ts {{ filename: 'public.ts' }}
    import { getAuth, clerkClient } from '@clerk/express'

    app.post('/revokeInvitation', async (req, res) => {
      await clerkClient.invitations.revokeInvitation({
        invitationId: 'invitation_123',
      })

      res.status(200).json({ success: true })
    })
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/example.tsx' }}
    import { clerkClient } from '@clerk/react-router/server'
    import type { Route } from './+types/example'
    import { json, redirect } from 'react-router-dom'

    export async function action({ request }: Route.ActionArgs) {
      const formData = await request.formData()
      const invitationId = formData.get('invitationId')

      await clerkClient.invitations.revokeInvitation({
        invitationId: invitationId,
      })

      return json({ success: true })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/api/example.tsx' }}
    import { json } from '@tanstack/react-start'
    import { createFileRoute } from '@tanstack/react-router'
    import { clerkClient } from '@clerk/tanstack-react-start/server'

    export const ServerRoute = createFileRoute('/api/example')({
      server: {
        handlers: {
          POST: async () => {
            await clerkClient().invitations.revokeInvitation({
              invitationId: 'invitation_123',
            })

            return json({ success: true })
          },
        },
      },
    })
    ```
  </Tab>
</Tabs>

See the [Backend API reference](/docs/reference/backend-api/tag/invitations/post/invitations/\{invitation_id}/revoke){{ target: '_blank' }} for an example of the response.

## Custom flow

Clerk's <SDKLink href="/docs/:sdk:/reference/components/overview" sdks={["react","nextjs","js-frontend","chrome-extension","expo","expressjs","fastify","react-router","remix","tanstack-react-start","go","astro","nuxt","vue","ruby","js-backend"]}>prebuilt components</SDKLink> and [Account Portal pages](/docs/guides/account-portal/overview) handle the sign-up flow for you, including the invitation flow. If Clerk's prebuilt components don't meet your specific needs or if you require more control over the logic, you can rebuild the existing Clerk flows using the Clerk API. For more information, see the [custom flow for application invitations](/docs/guides/development/custom-flows/authentication/application-invitations).


---
title: "`createInvitation()`"
description: Use Clerk's JS Backend SDK to create a new invitation for the given
  email address, and send the invitation email.
sdk: js-backend
sdkScoped: "true"
canonical: /docs/reference/backend/invitations/create-invitation
lastUpdated: 2026-01-29T16:35:17.000Z
availableSdks: js-backend
notAvailableSdks: nextjs,react,js-frontend,chrome-extension,expo,android,ios,expressjs,fastify,react-router,remix,tanstack-react-start,go,astro,nuxt,vue,ruby
activeSdk: js-backend
sourceFile: /docs/reference/backend/invitations/create-invitation.mdx
---

{/* clerk/javascript file: https://github.com/clerk/javascript/blob/main/packages/backend/src/api/endpoints/InvitationApi.ts#L42 */}

Creates a new [`Invitation`](/docs/reference/backend/types/backend-invitation) for the given email address and sends the invitation email.

If an email address has already been invited or already exists in your application, trying to create a new invitation will return an error. To bypass this error and create a new invitation anyways, set `ignoreExisting` to `true`.

```ts
function createInvitation(params: CreateParams): Promise<Invitation>
```

## `CreateParams`

<Properties>
  * `emailAddress`
  * `string`

  The email address of the user to invite.

  ***

  * `redirectUrl?`
  * `string`

  The full URL or path where the user is redirected upon visiting the invitation link, where they can accept the invitation. Required if you have implemented a [custom flow for handling application invitations](/docs/guides/development/custom-flows/authentication/application-invitations).

  ***

  * `publicMetadata?`
  * <SDKLink href="/docs/reference/javascript/types/metadata#user-public-metadata" sdks={["js-frontend"]} code={true}>UserPublicMetadata</SDKLink>

  Metadata that can be read from both the Frontend API and [Backend API](/docs/reference/backend-api){{ target: '_blank' }}, but can be set only from the Backend API. Once the user accepts the invitation and signs up, these metadata will end up in the user's public metadata.

  ***

  * `notify?`
  * `boolean`

  Whether an email invitation should be sent to the given email address. Defaults to `true`.

  ***

  * `ignoreExisting?`
  * `boolean`

  Whether an invitation should be created if there is already an existing invitation for this email address, or if the email address already exists in the application. Defaults to `false`.

  ***

  * `expiresInDays?`
  * `number`

  The number of days the invitation will be valid for. By default, the invitation expires after 30 days.

  ***

  * `templateSlug?`
  * `'invitation' | 'waitlist_invitation'`

  The slug of the email template to use for the invitation email. Defaults to `invitation`.
</Properties>

## Usage

> \[!NOTE]
> Using `clerkClient` varies based on your framework. Refer to the [JS Backend SDK overview](/docs/js-backend/getting-started/quickstart) for usage details, including guidance on [how to access the `userId` and other properties](/docs/js-backend/getting-started/quickstart#get-the-user-id-and-other-properties).

```tsx
const response = await clerkClient.invitations.createInvitation({
  emailAddress: 'invite@example.com',
  redirectUrl: 'https://www.example.com/my-sign-up',
  publicMetadata: {
    example: 'metadata',
    example_nested: {
      nested: 'metadata',
    },
  },
})
```

## Example

<Tabs items={["Next.js", "Astro", "Express", "React Router", "Tanstack React Start"]}>
  <Tab>
    ```ts {{ filename: 'app/api/example/route.ts' }}
    import { clerkClient } from '@clerk/nextjs/server'
    import { NextResponse } from 'next/server'

    export async function POST() {
      const client = await clerkClient()
      const invitation = await client.invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
      })

      return NextResponse.json({ message: 'Invitation created', invitation })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'src/api/example.ts' }}
    import type { APIRoute } from 'astro'
    import { clerkClient } from '@clerk/astro/server'

    export const POST: APIRoute = async (context) => {
      await clerkClient(context).invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
      })

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    ```
  </Tab>

  <Tab>
    ```ts {{ filename: 'public.ts' }}
    import { getAuth, clerkClient } from '@clerk/express'

    app.post('/createUser', async (req, res) => {
      await clerkClient.invitations.createInvitation({
        emailAddress: 'invite@example.com',
        redirectUrl: 'https://www.example.com/my-sign-up',
        publicMetadata: {
          example: 'metadata',
          example_nested: {
            nested: 'metadata',
          },
        },
        password: 'password',
      })

      res.status(200).json({ success: true })
    })
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/example.tsx' }}
    import { clerkClient } from '@clerk/react-router/server'
    import type { Route } from './+types/example'
    import { json } from 'react-router-dom'

    export async function action({ request }: Route.ActionArgs) {
      const formData = await request.formData()
      const emailAddress = formData.get('emailAddress')
      const redirectUrl = formData.get('redirectUrl')
      const publicMetadata = formData.get('publicMetadata')

      await clerkClient.invitations.createInvitation({
        emailAddress: emailAddress,
        redirectUrl: redirectUrl,
        publicMetadata: publicMetadata,
      })

      return json({ success: true })
    }
    ```
  </Tab>

  <Tab>
    ```tsx {{ filename: 'app/routes/api/example.tsx' }}
    import { json } from '@tanstack/react-start'
    import { createFileRoute } from '@tanstack/react-router'
    import { clerkClient } from '@clerk/tanstack-react-start/server'

    export const ServerRoute = createFileRoute('/api/example')({
      server: {
        handlers: {
          POST: async () => {
            await clerkClient().invitations.createInvitation({
              emailAddress: 'invite@example.com',
              redirectUrl: 'https://www.example.com/my-sign-up',
              publicMetadata: {
                example: 'metadata',
                example_nested: {
                  nested: 'metadata',
                },
              },
            })

            return json({ success: true })
          },
        },
      },
    })
    ```
  </Tab>
</Tabs>

## Backend API (BAPI) endpoint

This method in the SDK is a wrapper around the BAPI endpoint `POST/invitations`. See the [BAPI reference](/docs/reference/backend-api/tag/invitations/post/invitations){{ target: '_blank' }} for more information.

Here's an example of making a request directly to the endpoint using cURL.

<SignedIn>
  Replace the email address with the email address you want to invite. Your Clerk <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip> is already injected into the code snippet.
</SignedIn>

<SignedOut>
  Replace the email address with the email address you want to invite. Update `YOUR_SECRET_KEY` with your Clerk <Tooltip><TooltipTrigger>Secret Key</TooltipTrigger><TooltipContent>Your Clerk **Secret Key** is used to authenticate requests from your backend to Clerk's API. You can find it on the [**API keys**](https://dashboard.clerk.com/~/api-keys) page in the Clerk Dashboard. **Do not expose this on the frontend with a public environment variable.**</TooltipContent></Tooltip>.
</SignedOut>

```bash {{ filename: 'terminal' }}
curl https://api.clerk.com/v1/invitations -X POST -d '{"email_address": "email@example.com"}' -H "Authorization:Bearer {{secret}}" -H 'Content-Type:application/json'
```
