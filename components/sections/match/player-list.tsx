import type { Lineup } from "@/lib/mocks/types";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  lineup: Lineup;
  className?: string;
}

export function PlayerList({ lineup, className }: PlayerListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
          Starters ({lineup.formation})
        </h4>
        <ul className="space-y-1.5">
          {lineup.starters.map((player) => (
            <li key={player.id} className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium text-muted-foreground">
                {player.number}
              </span>
              <span className="text-sm">{player.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
          Substitutes
        </h4>
        <ul className="space-y-1.5">
          {lineup.substitutes.map((player) => (
            <li key={player.id} className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium text-muted-foreground">
                {player.number}
              </span>
              <span className="text-sm">{player.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}