"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FootballLineupPlayer } from "@/components/ui/football-field.types";
import { PlayerPicker } from "@/components/sections/shell/games/game-detail/player-picker";
import {
  buildPlayerInitials,
  type CenterRosterPlayer,
} from "@/components/sections/shell/games/game-detail/game-center/domain";
import {
  GAME_EVENT_TYPES,
  GAME_EVENT_TYPE_ICONS,
  type GameEventType,
} from "@/lib/games/event-types";
import { cn } from "@/lib/utils";

interface GameCenterSlotEventPopoverContentProps {
  player?: FootballLineupPlayer;
  liveMinute: number;
  selectedEventType: GameEventType | null;
  incomingPlayerId: string;
  offFieldPlayers: CenterRosterPlayer[];
  isSubmitting: boolean;
  onSelectEventType: (eventType: GameEventType) => void;
  onIncomingPlayerChange: (playerId: string) => void;
  onCancel: () => void;
  onRegister: () => void;
}

export function GameCenterSlotEventPopoverContent({
  player,
  liveMinute,
  selectedEventType,
  incomingPlayerId,
  offFieldPlayers,
  isSubmitting,
  onSelectEventType,
  onIncomingPlayerChange,
  onCancel,
  onRegister,
}: GameCenterSlotEventPopoverContentProps) {
  const t = useTranslations("Common");

  if (!player) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("games.center.noPlayerAssigned")}
        </p>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onCancel}
          >
            {t("actions.close")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/20 px-2.5 py-2.5 sm:px-3 sm:py-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={player.photoUrl}
            initials={
              player.photoUrl ? undefined : buildPlayerInitials(player.name)
            }
            alt={player.name}
            className={cn(
              "size-9 text-[11px] text-muted-foreground",
              !player.photoUrl && "bg-muted",
            )}
          />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold sm:text-sm">
              {player.name}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {t("games.center.currentMinute", {
                minute: liveMinute,
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GAME_EVENT_TYPES.map((eventType) => {
          const isSelected = selectedEventType === eventType;
          const isSubstitution = eventType === "substitution";
          const substitutionDisabled =
            isSubstitution && offFieldPlayers.length === 0;

          return (
            <Button
              key={eventType}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-auto min-h-10 flex-col gap-1 px-2 py-2 text-[11px]",
                isSelected && "ring-2 ring-offset-2",
              )}
              disabled={substitutionDisabled || isSubmitting}
              onClick={() => {
                onSelectEventType(eventType);
                if (eventType !== "substitution") {
                  onIncomingPlayerChange("");
                }
              }}
            >
              <span className="text-base leading-none">
                {GAME_EVENT_TYPE_ICONS[eventType]}
              </span>
              <span className="text-center leading-tight">
                {t(`games.events.typeOptions.${eventType}`)}
              </span>
            </Button>
          );
        })}
      </div>

      {selectedEventType === "substitution" ? (
        <PlayerPicker
          players={offFieldPlayers}
          value={incomingPlayerId}
          onChange={onIncomingPlayerChange}
          placeholder=""
          searchPlaceholder=""
          emptyMessage={t("games.events.incomingPlayerEmpty")}
          disabled={isSubmitting}
          anchor="top"
        />
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("actions.cancel")}
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={
            !selectedEventType ||
            isSubmitting ||
            (selectedEventType === "substitution" && !incomingPlayerId)
          }
          onClick={onRegister}
        >
          {isSubmitting
            ? t("actions.loading")
            : t("games.center.registerSelectedEvent")}
        </Button>
      </div>
    </div>
  );
}
