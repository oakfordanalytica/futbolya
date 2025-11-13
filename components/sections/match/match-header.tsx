import { Avatar } from "@/components/ui/avatar";
import type { Match } from "@/lib/mocks/types";

interface MatchHeaderProps {
  match: Match;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm border">
      {/* Team 1 */}
      <div className="flex flex-col items-center gap-3 w-[35%]">
        <Avatar initials={match.team1Flag} className="size-16 md:size-24" square />
        <h2 className="text-xl md:text-3xl font-bold text-center">
          {match.team1}
        </h2>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center text-center">
        <div className="text-4xl md:text-6xl font-bold tracking-tighter">
          {match.score1} - {match.score2}
        </div>
        <span className="text-sm font-medium uppercase text-muted-foreground mt-2">
          {match.status}
        </span>
      </div>

      {/* Team 2 */}
      <div className="flex flex-col items-center gap-3 w-[35%]">
        <Avatar initials={match.team2Flag} className="size-16 md:size-24" square />
        <h2 className="text-xl md:text-3xl font-bold text-center">
          {match.team2}
        </h2>
      </div>
    </div>
  );
}