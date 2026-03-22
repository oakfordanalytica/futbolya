"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FootballField } from "@/components/ui/football-field";
import type { FootballLineupSlot } from "@/components/ui/football-field.types";
import {
  type CenterResolvedTeam,
  type CenterTeamKey,
} from "@/components/sections/shell/games/game-detail/game-center/domain";

interface GameCenterLiveFieldPanelProps {
  isLoading: boolean;
  homeResolved: CenterResolvedTeam | null;
  awayResolved: CenterResolvedTeam | null;
  activeTeam: CenterTeamKey;
  onActiveTeamChange: (team: CenterTeamKey) => void;
  selectedSlotId: string | null;
  isLive: boolean;
  onSlotPopoverOpenChange: (slotId: string, open: boolean) => void;
  renderSlotPopoverContent: (slot: FootballLineupSlot) => ReactNode;
}

function TeamBadge({
  teamName,
  logoUrl,
  label,
}: {
  teamName: string;
  logoUrl?: string;
  label?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={teamName}
          width={18}
          height={18}
          className="size-[18px] object-contain"
        />
      ) : (
        <div className="flex size-[18px] items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {teamName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate font-semibold">{label?.trim() || "—"}</span>
    </div>
  );
}

function TeamField({
  team,
  teamKey,
  activeTeam,
  selectedSlotId,
  isLive,
  onSlotPopoverOpenChange,
  renderSlotPopoverContent,
}: {
  team: CenterResolvedTeam;
  teamKey: CenterTeamKey;
  activeTeam: CenterTeamKey;
  selectedSlotId: string | null;
  isLive: boolean;
  onSlotPopoverOpenChange: (slotId: string, open: boolean) => void;
  renderSlotPopoverContent: (slot: FootballLineupSlot) => ReactNode;
}) {
  const t = useTranslations("Common");

  if (!team.lineup) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t("games.center.noLineup")}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-visible">
      <FootballField
        lineup={team.lineup}
        className="mx-auto max-w-[320px]"
        selectedSlotId={activeTeam === teamKey ? selectedSlotId : null}
        onSlotPopoverOpenChange={
          isLive
            ? (slotId, open) => onSlotPopoverOpenChange(slotId, open)
            : undefined
        }
        renderSlotPopoverContent={isLive ? renderSlotPopoverContent : undefined}
      />
    </div>
  );
}

export function GameCenterLiveFieldPanel({
  isLoading,
  homeResolved,
  awayResolved,
  activeTeam,
  onActiveTeamChange,
  selectedSlotId,
  isLive,
  onSlotPopoverOpenChange,
  renderSlotPopoverContent,
}: GameCenterLiveFieldPanelProps) {
  const t = useTranslations("Common");

  if (isLoading || !homeResolved || !awayResolved) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        {t("actions.loading")}
      </div>
    );
  }

  return (
    <Tabs
      value={activeTeam}
      onValueChange={(value) => onActiveTeamChange(value as CenterTeamKey)}
      className="min-w-0 w-full"
    >
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-full border bg-muted/30 px-1 pt-1 pb-0">
        <TabsTrigger
          value="home"
          className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
        >
          <TeamBadge
            teamName={homeResolved.teamName}
            logoUrl={homeResolved.teamLogoUrl}
            label={homeResolved.formation ?? "—"}
          />
        </TabsTrigger>
        <TabsTrigger
          value="away"
          className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
        >
          <TeamBadge
            teamName={awayResolved.teamName}
            logoUrl={awayResolved.teamLogoUrl}
            label={awayResolved.formation ?? "—"}
          />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="home" className="mt-4">
        <TeamField
          team={homeResolved}
          teamKey="home"
          activeTeam={activeTeam}
          selectedSlotId={selectedSlotId}
          isLive={isLive}
          onSlotPopoverOpenChange={onSlotPopoverOpenChange}
          renderSlotPopoverContent={renderSlotPopoverContent}
        />
      </TabsContent>

      <TabsContent value="away" className="mt-4">
        <TeamField
          team={awayResolved}
          teamKey="away"
          activeTeam={activeTeam}
          selectedSlotId={selectedSlotId}
          isLive={isLive}
          onSlotPopoverOpenChange={onSlotPopoverOpenChange}
          renderSlotPopoverContent={renderSlotPopoverContent}
        />
      </TabsContent>
    </Tabs>
  );
}
