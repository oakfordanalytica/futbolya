"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlayerCard, PlayerCardSkeleton } from "./player-card";
import { Text } from "@/components/ui/text";
import { useTranslations } from "next-intl";

interface RosterGridProps {
  clubSlug: string;
}

export function RosterGrid({ clubSlug }: RosterGridProps) {
  const t = useTranslations("Common");
  const data = useQuery(api.players.listBasketballPlayersByClubSlug, {
    clubSlug,
  });

  if (data === undefined) {
    return <RosterGridSkeleton />;
  }

  if (data === null || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Text className="text-muted-foreground">
          {t("players.emptyMessage")}
        </Text>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((player) => (
        <PlayerCard key={player._id} player={player} />
      ))}
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
