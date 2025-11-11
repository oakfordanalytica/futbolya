import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { EventType, Match, MatchEvent } from "@/lib/mocks/types";

const EVENT_ICONS: Record<EventType, string> = {
  goal: "⚽",
  red_card: "🟥",
  yellow_card: "🟨",
};

function groupEventsByType(events?: MatchEvent[]) {
  return (events ?? []).reduce(
    (acc, event) => {
      const eventType = event.type;
      if (!acc[eventType]) {
        acc[eventType] = [];
      }
      acc[eventType].push(event);
      return acc;
    },
    {} as Record<EventType, MatchEvent[]>,
  );
}

interface ScoreboardCompetitionProps {
  matches: Match[];
  title?: string;
}

export function ScoreboardCompetition({
  matches,
  title,
}: ScoreboardCompetitionProps) {
  const cardTitle = title ?? matches[0]?.competition ?? "Matches";

  return (
    <Card className="w-full p-3 gap-2 rounded-lg overflow-hidden">
      <CardHeader className="px-0">
        <CardTitle className="text-lg">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 overflow-x-auto">
        <Table dense grid>
          <TableBody>
            {matches.map((match) => {
              const team1Won = match.score1 > match.score2;
              const team2Won = match.score2 > match.score1;
              const team1EventsByType = groupEventsByType(match.events1);
              const team2EventsByType = groupEventsByType(match.events2);
              const hasEvents =
                (match.events1?.length ?? 0) > 0 ||
                (match.events2?.length ?? 0) > 0;
              const teams = [
                {
                  id: "team1",
                  name: match.team1,
                  score: match.score1,
                  flag: match.team1Flag,
                  won: team1Won,
                  eventsByType: team1EventsByType,
                  events: match.events1,
                },
                {
                  id: "team2",
                  name: match.team2,
                  score: match.score2,
                  flag: match.team2Flag,
                  won: team2Won,
                  eventsByType: team2EventsByType,
                  events: match.events2,
                },
              ];

              return (
                <TableRow key={match.id} href={`/match/${match.id}`}>
                  <TableCell className="py-3 w-16 min-w-16">
                    <span className="text-xs text-muted-foreground">
                      {match.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 min-w-[200px] pr-0 align-top">
                    <div className="flex flex-col gap-3">
                      {teams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between gap-4"
                        >
                          <div
                            className={`flex items-center gap-2 ${!team.won && "text-muted-foreground"}`}
                          >
                            <Avatar
                              initials={team.flag}
                              className="size-5"
                              square
                            />
                            <span className="text-sm font-medium">
                              {team.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-semibold tabular-nums">
                              {team.score}
                            </span>
                            {team.won ? (
                              <span className="text-4xl">🢐</span>
                            ) : (
                              <span className="w-3" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3 text-xs align-top w-full max-w-[250px]">
                    {hasEvents ? (
                      <div className="flex flex-col gap-3">
                        {teams.map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center min-h-7"
                          >
                            <div className="space-y-1">
                              {Object.entries(team.eventsByType).map(
                                ([eventType, events]) => {
                                  const type = eventType as EventType;
                                  const icon = EVENT_ICONS[type];
                                  const eventText = events
                                    .map((event) => {
                                      const minutePart = event.minute
                                        ? ` - ${event.minute}`
                                        : "";
                                      return `${event.name}${minutePart}`;
                                    })
                                    .join(", ");

                                  return (
                                    <div
                                      key={type}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-base shrink-0 leading-snug">
                                        {icon}
                                      </span>
                                      <span className="text-muted-foreground leading-snug wrap-break-word">
                                        {eventText}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                              {(team.events || []).length === 0 && (
                                <span className="text-muted-foreground">
                                  No Goals
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No Goals</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
