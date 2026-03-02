"use client";

import { useMemo, useState } from "react";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { darkenHex } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { PlayerFormDialog } from "@/components/sections/shell/teams/basketball/team-settings/player-form-dialog";
import { PlayerBioDialog } from "./player-bio-dialog";
import { PlayerProfileHeader } from "./player-profile-header";

interface PlayerDetailClientProps {
  preloadedPlayer: Preloaded<
    typeof api.players.getBasketballPlayerDetailByClubSlug
  >;
  orgSlug: string;
}

export function PlayerDetailClient({
  preloadedPlayer,
  orgSlug,
}: PlayerDetailClientProps) {
  const t = useTranslations("Common");
  const player = usePreloadedQuery(preloadedPlayer);
  const { isAdmin, isLoaded } = useIsAdmin();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBioEditOpen, setIsBioEditOpen] = useState(false);

  const teamConfig = useQuery(api.leagueSettings.getTeamConfig, {
    leagueSlug: orgSlug,
  });

  const positionMap = useMemo(() => {
    const map = new Map<string, { name: string; abbreviation: string }>();
    if (teamConfig?.positions) {
      for (const pos of teamConfig.positions) {
        map.set(pos.id, { name: pos.name, abbreviation: pos.abbreviation });
      }
    }
    return map;
  }, [teamConfig?.positions]);

  if (player === null) {
    return (
      <div className="p-4 md:p-6">
        <Heading>{t("errors.notFound")}</Heading>
      </div>
    );
  }

  const positionData = player.position
    ? positionMap.get(player.position)
    : null;
  const positionName = positionData
    ? positionData.name
    : player.position
      ? player.position
          .replaceAll("_", " ")
          .split(" ")
          .filter(Boolean)
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join(" ")
      : undefined;

  const primaryColor = player.clubPrimaryColor ?? null;
  const darkerColor = primaryColor ? darkenHex(primaryColor, 0.2) : null;
  const positions = teamConfig?.positions ?? [];
  const canEditBio =
    isLoaded &&
    (player.viewerAccessLevel === "superadmin" ||
      player.viewerAccessLevel === "admin" ||
      player.viewerAccessLevel === "coach");
  const bioTitle = player.bioTitle?.trim() || t("players.bio");
  const bioContent = player.bioContent?.trim() || t("players.bioPlaceholder");

  return (
    <div className="space-y-0">
      <PlayerProfileHeader
        player={player}
        orgSlug={orgSlug}
        positionName={positionName}
        statsBackgroundColor={darkerColor}
        canEdit={isLoaded && isAdmin}
        onEdit={() => setIsEditOpen(true)}
      />

      <PlayerFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        clubSlug={player.clubSlug}
        positions={positions}
        player={{
          _id: player._id,
          firstName: player.firstName,
          lastName: player.lastName,
          photoUrl: player.photoUrl ?? null,
          dateOfBirth: player.dateOfBirth ?? null,
          jerseyNumber: player.jerseyNumber ?? null,
          position: player.position ?? null,
          height: player.height ?? null,
          weight: player.weight ?? null,
          country: player.country ?? null,
          categoryId: player.categoryId,
        }}
      />
      <PlayerBioDialog
        open={isBioEditOpen}
        onOpenChange={setIsBioEditOpen}
        playerId={player._id}
        initialTitle={player.bioTitle}
        initialContent={player.bioContent}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={
            darkerColor
              ? "w-full justify-start rounded-none px-4 py-2.5 shadow-xs md:px-6"
              : "w-full justify-start rounded-none px-4 py-2.5 md:px-6"
          }
          style={darkerColor ? { backgroundColor: darkerColor } : undefined}
        >
          <TabsTrigger
            value="profile"
            style={darkerColor ? { color: "white" } : undefined}
          >
            {t("players.profile")}
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            style={darkerColor ? { color: "white" } : undefined}
          >
            {t("games.stats")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 px-4 py-4 md:px-6">
          <section className="max-w-3xl rounded-md border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {bioTitle}
              </h2>
              {canEditBio && (
                <Button
                  type="button"
                  onClick={() => setIsBioEditOpen(true)}
                  className="rounded-full ring-1 bg-transparent hover:bg-transparent"
                  size="sm"
                >
                  <Settings className="size-4" />
                  <span className="hidden md:block">{t("actions.edit")}</span>
                </Button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {bioContent}
            </p>
          </section>
        </TabsContent>
        <TabsContent value="stats" className="mt-0 px-4 md:px-6">
          <div className="h-1" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
