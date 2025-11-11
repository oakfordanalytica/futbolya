import type { Match } from "@/lib/mocks/types";
import { ScoreboardCompetition } from "./scoreboard-competition";

interface ScoreboardBodyProps {
  matches: Match[];
}

interface CompetitionGroup {
  competition: string;
  matches: Match[];
}

function groupByCompetition(matches: Match[]): CompetitionGroup[] {
  const grouped = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.competition ?? "Matches";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([competition, groupedMatches]) => ({
      competition,
      matches: groupedMatches.sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
      ),
    }))
    .sort((a, b) => a.competition.localeCompare(b.competition));
}

export function ScoreboardBody({ matches }: ScoreboardBodyProps) {
  if (matches.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No matches available for the selected filters.
        </div>
      </section>
    );
  }

  const groupedMatches = groupByCompetition(matches);

  return (
    <section className="flex flex-col gap-2">
      {groupedMatches.map((group) => (
        <ScoreboardCompetition
          key={group.competition}
          title={group.competition}
          matches={group.matches}
        />
      ))}
    </section>
  );
}
