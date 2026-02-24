"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { PlayerCard, PlayerCardSkeleton } from "./player-card";
import { useTranslations } from "next-intl";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Dribbble } from "lucide-react";

interface RosterGridProps {
  clubSlug: string;
}

export function RosterGrid({ clubSlug }: RosterGridProps) {
  const t = useTranslations("Common");
  const { organization } = useOrganization();

  const data = useQuery(api.players.listBasketballPlayersByClubSlug, {
    clubSlug,
  });

  const teamConfig = useQuery(
    api.leagueSettings.getTeamConfig,
    organization?.slug ? { leagueSlug: organization.slug } : "skip",
  );

  const positionMap = useMemo(() => {
    const map = new Map<string, { name: string; abbreviation: string }>();
    if (teamConfig?.positions) {
      for (const pos of teamConfig.positions) {
        map.set(pos.id, { name: pos.name, abbreviation: pos.abbreviation });
      }
    }
    return map;
  }, [teamConfig?.positions]);

  if (data === undefined) {
    return <RosterGridSkeleton />;
  }

  if (data === null || data.length === 0) {
    return (
      <Empty className="min-h-[320px] border border-dashed border-border/60 bg-gradient-to-b from-orange-50/70 via-amber-50/20 to-transparent dark:from-orange-950/20 dark:via-amber-950/5">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <div className="flex size-20 items-center justify-center rounded-full bg-orange-500/10 ring-8 ring-orange-500/5">
              <Dribbble className="size-10 text-orange-500" />
            </div>
          </EmptyMedia>
          <EmptyTitle>{t("players.emptyTitle")}</EmptyTitle>
          <EmptyDescription className="max-w-sm text-pretty">
            {t("players.emptyMessage")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((player) => {
        const positionData = player.position
          ? positionMap.get(player.position)
          : null;
        return (
          <PlayerCard
            key={player._id}
            player={player}
            positionLabel={positionData?.abbreviation}
          />
        );
      })}
    </div>
  );
}

export function RosterGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}
