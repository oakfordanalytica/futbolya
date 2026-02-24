"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";
import { TEAM_ROUTES } from "@/lib/navigation/routes";

const NO_TEAM_MESSAGE_DELAY_MS = 8000;

interface CoachTeamResolverProps {
  organizationSlug: string;
}

export function CoachTeamResolver({
  organizationSlug,
}: CoachTeamResolverProps) {
  const router = useRouter();
  const teamSlugs = useQuery(api.staff.listMyClubSlugsByOrganization, {
    organizationSlug,
  });
  const [showNoTeamMessage, setShowNoTeamMessage] = useState(false);

  useEffect(() => {
    setShowNoTeamMessage(false);
    const timeoutId = window.setTimeout(() => {
      setShowNoTeamMessage(true);
    }, NO_TEAM_MESSAGE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [organizationSlug]);

  useEffect(() => {
    const primaryTeamSlug = teamSlugs?.[0];
    if (!primaryTeamSlug) {
      return;
    }

    router.replace(TEAM_ROUTES.roster(organizationSlug, primaryTeamSlug));
  }, [teamSlugs, organizationSlug, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {showNoTeamMessage
        ? "You don't have a team assigned yet."
        : "Preparing your team workspace..."}
    </div>
  );
}
