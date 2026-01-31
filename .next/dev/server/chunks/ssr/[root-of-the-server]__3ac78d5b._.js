module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/[locale]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/[locale]/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/[locale]/(auth)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/[locale]/(auth)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/lib/navigation/routes.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Centralized route definitions for the Payments Platform.
 *
 * This file provides type-safe route builders to avoid hardcoded paths
 * throughout the application. When architecture changes, update routes here
 * and TypeScript will flag any breaking usages.
 *
 * Route Hierarchy:
 *   /admin/*                       - Superadmin platform routes
 *   /{organization}/*              - Organization-level routes
 */ __turbopack_context__.s([
    "ROUTES",
    ()=>ROUTES,
    "TEAM_ROUTES",
    ()=>TEAM_ROUTES
]);
const ROUTES = {
    home: "/",
    auth: {
        signIn: "/sign-in",
        signUp: "/sign-up"
    },
    tenant: {
        auth: {
            signIn: (orgSlug)=>`/${orgSlug}/sign-in`,
            signUp: (orgSlug)=>`/${orgSlug}/sign-up`
        },
        onboarding: (orgSlug)=>`/${orgSlug}/onboarding`
    },
    admin: {
        root: "/admin",
        organizations: {
            list: "/admin/organizations",
            detail: (orgId)=>`/admin/organizations/${orgId}`,
            create: "/admin/organizations/create"
        },
        settings: {
            root: "/admin/settings",
            appearance: "/admin/settings/appearance",
            profileSecurity: "/admin/settings/user-profile",
            billing: "/admin/settings/billing"
        }
    },
    org: {
        root: (orgSlug)=>`/${orgSlug}`,
        teams: {
            list: (orgSlug)=>`/${orgSlug}/teams`,
            detail: (orgSlug, teamId)=>`/${orgSlug}/teams/${teamId}`,
            settings: (orgSlug, teamId)=>`/${orgSlug}/teams/${teamId}/settings`,
            create: (orgSlug)=>`/${orgSlug}/teams/create`
        },
        offerings: {
            list: (orgSlug)=>`/${orgSlug}/offerings`,
            detail: (orgSlug, offeringId)=>`/${orgSlug}/offerings/${offeringId}`,
            create: (orgSlug)=>`/${orgSlug}/offerings/create`
        },
        applications: {
            list: (orgSlug)=>`/${orgSlug}/applications`,
            detail: (orgSlug, applicationId)=>`/${orgSlug}/applications/${applicationId}`,
            create: (orgSlug)=>`/${orgSlug}/preadmission`
        },
        members: {
            list: (orgSlug)=>`/${orgSlug}/members`,
            detail: (orgSlug, memberId)=>`/${orgSlug}/members/${memberId}`
        },
        fees: {
            list: (orgSlug)=>`/${orgSlug}/fees`,
            assignments: (orgSlug)=>`/${orgSlug}/fees/assignments`
        },
        forms: {
            list: (orgSlug)=>`/${orgSlug}/forms`,
            detail: (orgSlug, formId)=>`/${orgSlug}/forms/${formId}`,
            create: (orgSlug)=>`/${orgSlug}/forms/create`
        },
        staff: {
            list: (orgSlug)=>`/${orgSlug}/staff`,
            detail: (orgSlug, staffId)=>`/${orgSlug}/staff/${staffId}`
        },
        payments: (orgSlug)=>`/${orgSlug}/payments`,
        divisions: {
            list: (orgSlug)=>`/${orgSlug}/divisions`,
            detail: (orgSlug, divisionId)=>`/${orgSlug}/divisions/${divisionId}`,
            create: (orgSlug)=>`/${orgSlug}/divisions/create`
        },
        tournaments: {
            list: (orgSlug)=>`/${orgSlug}/tournaments`,
            detail: (orgSlug, tournamentId)=>`/${orgSlug}/tournaments/${tournamentId}`,
            create: (orgSlug)=>`/${orgSlug}/tournaments/create`
        },
        games: {
            list: (orgSlug)=>`/${orgSlug}/games`,
            detail: (orgSlug, gameId)=>`/${orgSlug}/games/${gameId}`,
            create: (orgSlug)=>`/${orgSlug}/games/create`
        },
        settings: {
            root: (orgSlug)=>`/${orgSlug}/settings`,
            appearance: (orgSlug)=>`/${orgSlug}/settings/appearance`,
            profileSecurity: (orgSlug)=>`/${orgSlug}/settings/user-profile`,
            billing: (orgSlug)=>`/${orgSlug}/settings/billing`
        }
    }
};
const TEAM_ROUTES = {
    root: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}`,
    roster: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}/roster`,
    staff: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}/staff`,
    categories: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}/categories`,
    schedule: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}/schedule`,
    settings: {
        root: (orgSlug, teamSlug)=>`/${orgSlug}/${teamSlug}/settings`
    }
};
}),
"[project]/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ################################################################################
// # Check: 12/13/2025                                                            #
// ################################################################################
__turbopack_context__.s([
    "default",
    ()=>SignInPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$navigation$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/navigation/routes.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$6$2e$34$2e$1_next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$2d$dom_0d103480f32e862966742f21cdab6bf4$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$client$2d$boundary$2f$uiComponents$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@clerk+nextjs@6.34.1_next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0__react-dom_0d103480f32e862966742f21cdab6bf4/node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js [app-rsc] (ecmascript)");
;
;
;
function SignInPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$6$2e$34$2e$1_next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$2d$dom_0d103480f32e862966742f21cdab6bf4$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$client$2d$boundary$2f$uiComponents$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SignIn"], {
        signUpUrl: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$navigation$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ROUTES"].auth.signUp
    }, void 0, false, {
        fileName: "[project]/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx",
        lineNumber: 9,
        columnNumber: 10
    }, this);
}
}),
"[project]/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3ac78d5b._.js.map