"use client";

import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GameDetailContent } from "@/components/sections/shell/games/game-detail/game-detail-content";

interface TeamGameDetailClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
  clubSlug: string;
}

export function TeamGameDetailClient({
  preloadedGame,
  orgSlug,
  clubSlug,
}: TeamGameDetailClientProps) {
  return (
    <GameDetailContent
      preloadedGame={preloadedGame}
      orgSlug={orgSlug}
      routeScope="team"
      currentClubSlug={clubSlug}
    />
  );
}
