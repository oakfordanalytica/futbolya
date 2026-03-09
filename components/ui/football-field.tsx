"use client";

import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import { FootballFieldSurface } from "@/components/ui/football-field-surface";
import { cn } from "@/lib/utils";
import { JerseyIcon } from "@/components/ui/jersey-icon";
import { PlayerChip } from "@/components/ui/player-chip";

interface FootballFieldProps {
  lineup: FootballLineup;
  className?: string;
  selectedSlotId?: string | null;
  onSlotClick?: (slotId: string) => void;
}

function parseFormationCounts(formation: string): number[] {
  return formation
    .split("-")
    .map((segment) => Number.parseInt(segment.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function groupPlayersByFormation(
  starters: FootballLineupPlayer[],
  formation: string,
): { gk: FootballLineupPlayer[]; lines: FootballLineupPlayer[][] } {
  if (starters.length === 0) {
    return { gk: [], lines: [] };
  }

  const [goalkeeper, ...outfieldPlayers] = starters;
  const formationCounts = parseFormationCounts(formation);

  if (formationCounts.length === 0) {
    return {
      gk: [goalkeeper],
      lines: outfieldPlayers.length > 0 ? [outfieldPlayers] : [],
    };
  }

  const lines: FootballLineupPlayer[][] = [];
  let cursor = 0;

  for (const count of formationCounts) {
    const nextLine = outfieldPlayers.slice(cursor, cursor + count);
    if (nextLine.length > 0) {
      lines.push(nextLine);
    }
    cursor += count;
  }

  if (cursor < outfieldPlayers.length) {
    lines.push(outfieldPlayers.slice(cursor));
  }

  return { gk: [goalkeeper], lines };
}

function resolveDisplayLastName(player?: FootballLineupPlayer) {
  if (!player) {
    return null;
  }

  if (player.lastName?.trim()) {
    return player.lastName.trim();
  }

  const parts = player.name.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : (parts[0] ?? null);
}

function TemplateSlotChip({
  slot,
  teamColor,
  selected,
  onClick,
}: {
  slot: FootballLineupSlot;
  teamColor?: string;
  selected: boolean;
  onClick?: () => void;
}) {
  const player = slot.player;
  const lastName = resolveDisplayLastName(player);
  const isClickable = Boolean(onClick);

  return (
    <button
      type="button"
      className={cn(
        "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center bg-transparent",
        isClickable ? "cursor-pointer" : "cursor-default",
      )}
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
      }}
      onClick={onClick}
      disabled={!isClickable}
    >
      <div
        className={cn(
          "rounded-md transition-colors",
          selected && "ring-2 ring-white ring-offset-2 ring-offset-transparent",
        )}
      >
        <JerseyIcon
          color={player ? teamColor : "#4b5563"}
          number={player?.number}
          size={40}
        />
      </div>
      {lastName && (
        <span
          className={cn(
            "mt-1 max-w-[52px] truncate text-center text-[9px] font-medium text-white",
            "[text-shadow:_1px_1px_2px_rgb(0_0_0_/_70%)]",
          )}
        >
          {lastName}
        </span>
      )}
    </button>
  );
}

function TemplateSlotsLayout({
  slots,
  teamColor,
  selectedSlotId,
  onSlotClick,
}: {
  slots: FootballLineupSlot[];
  teamColor?: string;
  selectedSlotId?: string | null;
  onSlotClick?: (slotId: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-10">
      {slots.map((slot) => (
        <TemplateSlotChip
          key={slot.id}
          slot={slot}
          teamColor={teamColor}
          selected={selectedSlotId === slot.id}
          onClick={onSlotClick ? () => onSlotClick(slot.id) : undefined}
        />
      ))}
    </div>
  );
}

export function FootballField({
  lineup,
  className,
  selectedSlotId,
  onSlotClick,
}: FootballFieldProps) {
  if (lineup.slots && lineup.slots.length > 0) {
    return (
      <FootballFieldSurface className={className}>
        <TemplateSlotsLayout
          slots={lineup.slots}
          teamColor={lineup.teamColor}
          selectedSlotId={selectedSlotId}
          onSlotClick={onSlotClick}
        />
      </FootballFieldSurface>
    );
  }

  const { gk, lines } = groupPlayersByFormation(
    lineup.starters,
    lineup.formation ?? "",
  );

  return (
    <FootballFieldSurface className={className}>
      <div
        className={cn(
          "relative z-10 flex h-full flex-col-reverse justify-around py-0",
          "sm:text-[14px] md:text-[12px] lg:text-[14px]",
        )}
      >
        <div className="flex w-full justify-center">
          {gk.map((player) => (
            <PlayerChip key={player.id} player={player} variant="goalkeeper" />
          ))}
        </div>

        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className={cn(
              "flex w-full flex-row items-center justify-center",
              "gap-[0.25em] md:gap-[0.5em]",
            )}
          >
            {line.map((player) => (
              <PlayerChip key={player.id} player={player} variant="default" />
            ))}
          </div>
        ))}
      </div>
    </FootballFieldSurface>
  );
}
