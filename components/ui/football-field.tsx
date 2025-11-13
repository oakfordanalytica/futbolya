// ################################################################################
// # File: components\ui\football-field.tsx                                     #
// # Check: 11/12/2025                                                            #
// ################################################################################

import type { Lineup } from "@/lib/mocks/types";
import { cn } from "@/lib/utils";
import { parseFormation } from "@/lib/scoreboard/utils";
import { PlayerChip } from "@/components/ui/player-chip";

interface FootballFieldProps {
  lineup: Lineup;
  className?: string;
}

export function FootballField({ lineup, className }: FootballFieldProps) {
  const { gk, lines } = parseFormation(lineup.starters);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full rounded-lg",
        "bg-gradient-to-b from-green-500 to-green-600 dark:from-green-700 dark:to-green-800",
        "border-2 border-white/40 p-2 overflow-hidden",
        "flex flex-col-reverse justify-around",
        className,
      )}
    >
      {/* Field Markings */}
      {/* Center Circle - Now Complete */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full border-2 border-white/40" />
      
      {/* Center Spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60" />
      
      {/* Halfway Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/40" />
      
      {/* Top Penalty Area */}
      <div className="absolute top-[0%] left-[20%] w-[60%] h-[16%] border-2 border-t-0 border-white/40 rounded-b-sm" />
      
      {/* Top Goal Area */}
      <div className="absolute top-[0%] left-[35%] w-[30%] h-[8%] border-2 border-t-0 border-white/40 rounded-b-sm" />
      
      {/* Top Penalty Spot */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
      
      {/* Bottom Penalty Area */}
      <div className="absolute bottom-[0%] left-[20%] w-[60%] h-[16%] border-2 border-b-0 border-white/40 rounded-t-sm" />
      
      {/* Bottom Goal Area */}
      <div className="absolute bottom-[0%] left-[35%] w-[30%] h-[8%] border-2 border-b-0 border-white/40 rounded-t-sm" />
      
      {/* Bottom Penalty Spot */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
      
      {/* Corner Arcs */}
      <div className="absolute top-0 left-0 w-4 h-4 border-2 border-t-0 border-l-0 border-white/40 rounded-br-full" />
      <div className="absolute top-0 right-0 w-4 h-4 border-2 border-t-0 border-r-0 border-white/40 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-2 border-b-0 border-l-0 border-white/40 rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-2 border-b-0 border-r-0 border-white/40 rounded-tl-full" />

      {/* Player Layout */}
      <div
        className={cn(
          "relative z-10 flex flex-col-reverse justify-around h-full py-0",
          "sm:text-[14px] md:text-[12px] lg:text-[14px]",
        )}
      >
        {/* GK Line */}
        <div className="flex justify-center w-full">
          {gk.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              variant="goalkeeper"
            />
          ))}
        </div>

        {/* Outfield Lines */}
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className={cn(
              "flex flex-row justify-center items-center w-full",
              "gap-[0.25em] md:gap-[0.5em]",
            )}
          >
            {line.map((player) => (
              <PlayerChip
                key={player.id}
                player={player}
                variant="default"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}