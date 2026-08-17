"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/navigation/routes";
import { GameEventDialog } from "./game-event-dialog";
import {
  MatchTimelineView,
  type MatchTimelineTeam,
} from "./match-timeline-view";

interface MatchTimelineProps {
  gameId: string;
  orgSlug: string;
  title?: string;
  homeTeam: MatchTimelineTeam;
  awayTeam: MatchTimelineTeam;
  className?: string;
}

export function MatchTimeline({
  gameId,
  orgSlug,
  title,
  homeTeam,
  awayTeam,
  className,
}: MatchTimelineProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const timelineData = useQuery(api.gameEvents.getByGameId, {
    gameId: gameId as Id<"games">,
  });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const canManageEvents = timelineData?.canManageEvents ?? false;

  return (
    <>
      <MatchTimelineView
        title={title}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        events={timelineData?.events ?? []}
        className={className}
        headerAction={
          canManageEvents ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setIsEventDialogOpen(true)}
              >
                <span className="sm:hidden">
                  {t("games.events.registerShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("games.events.register")}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() =>
                  router.push(ROUTES.org.games.center(orgSlug, gameId))
                }
              >
                <span className="sm:hidden">
                  {t("games.events.matchCenterShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("games.events.matchCenter")}
                </span>
              </Button>
            </>
          ) : undefined
        }
      />

      <GameEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        gameId={gameId}
      />
    </>
  );
}
