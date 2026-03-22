"use client";

import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GameDetailContent } from "./game-detail-content";

interface GameDetailClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
}

export function GameDetailClient({
  preloadedGame,
  orgSlug,
}: GameDetailClientProps) {
  return (
    <GameDetailContent
      preloadedGame={preloadedGame}
      orgSlug={orgSlug}
      routeScope="org"
    />
  );
}
