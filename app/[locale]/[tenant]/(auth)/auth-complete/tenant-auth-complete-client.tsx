"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/navigation/routes";

const MAX_RESOLVE_ATTEMPTS = 20;
const RESOLVE_RETRY_DELAY_MS = 500;

type ResolveState = "resolving" | "timed_out";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

interface TenantAuthCompleteClientProps {
  tenant: string;
  localePrefix: string;
}

export function TenantAuthCompleteClient({
  tenant,
  localePrefix,
}: TenantAuthCompleteClientProps) {
  const t = useTranslations("Common");
  const [state, setState] = useState<ResolveState>("resolving");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const resolveDestination = async () => {
      setState("resolving");

      for (
        let attempt = 0;
        attempt < MAX_RESOLVE_ATTEMPTS && !cancelled;
        attempt += 1
      ) {
        const response = await fetch(
          `/api/auth/tenant-landing?tenant=${encodeURIComponent(tenant)}`,
          {
            cache: "no-store",
          },
        );

        let payload: { path?: string; status?: string } | null = null;

        try {
          payload = (await response.json()) as { path?: string; status?: string };
        } catch {
          payload = null;
        }

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          window.location.replace(
            `${localePrefix}${ROUTES.tenant.auth.signIn(tenant)}`,
          );
          return;
        }

        if (response.status === 202) {
          await wait(RESOLVE_RETRY_DELAY_MS);
          continue;
        }

        if (
          typeof payload?.path === "string" &&
          (response.ok || response.status === 403)
        ) {
          window.location.replace(`${localePrefix}${payload.path}`);
          return;
        }

        break;
      }

      if (!cancelled) {
        setState("timed_out");
      }
    };

    void resolveDestination();

    return () => {
      cancelled = true;
    };
  }, [tenant, localePrefix, retryKey]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.postSignIn.title")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {state === "timed_out"
            ? t("auth.postSignIn.timeout")
            : t("auth.postSignIn.description")}
        </p>
      </div>

      {state === "timed_out" ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => setRetryKey((current) => current + 1)}>
            {t("auth.postSignIn.retry")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.location.replace(`${localePrefix}${ROUTES.org.root(tenant)}`)
            }
          >
            {t("auth.postSignIn.continue")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("actions.loading")}</p>
      )}
    </div>
  );
}
