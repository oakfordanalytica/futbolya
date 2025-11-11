import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { matches } from "@/lib/mocks/data";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type EventType = "goal" | "red_card" | "yellow_card";

const EVENT_ICONS: Record<EventType, string> = {
  goal: "⚽",
  red_card: "🟥",
  yellow_card: "🟨",
};

export function ScoreboardCompetition() {
  return (
    <Card className="w-full p-3 gap-2 rounded-lg overflow-hidden">
      <CardHeader className="px-0">
        <CardTitle className="text-lg">FIFA Under-17 World Cup</CardTitle>
      </CardHeader>
      <CardContent className="px-0 overflow-x-auto">
        <Table>
          <TableBody>
            {matches.map((match) => {
              const team1Won = match.score1 > match.score2;
              const team2Won = match.score2 > match.score1;

              // Group events by type for each team
              const team1EventsByType = (match.events1 || []).reduce(
                (acc, event) => {
                  const eventType = event.type as EventType;
                  if (!acc[eventType]) acc[eventType] = [];
                  acc[eventType].push(event);
                  return acc;
                },
                {} as Record<
                  EventType,
                  Array<{ name: string; minute: string }>
                >,
              );

              const team2EventsByType = (match.events2 || []).reduce(
                (acc, event) => {
                  const eventType = event.type as EventType;
                  if (!acc[eventType]) acc[eventType] = [];
                  acc[eventType].push(event);
                  return acc;
                },
                {} as Record<
                  EventType,
                  Array<{ name: string; minute: string }>
                >,
              );

              const hasEvents =
                (match.events1 || []).length > 0 ||
                (match.events2 || []).length > 0;

              return (
                <TableRow key={match.id} href={`/match/${match.id}`}>
                  <TableCell className="py-3 w-16 min-w-16">
                    <span className="text-xs text-muted-foreground">
                      {match.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 min-w-[200px] align-top">
                    <div className="flex flex-col gap-3">
                      {/* Team 1 Row */}
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className={`flex items-center gap-2 ${!team1Won && "text-muted-foreground"}`}
                        >
                          <Avatar
                            initials={match.team1Flag}
                            className="size-5"
                            square
                          />
                          <span className="text-sm font-medium">
                            {match.team1}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-semibold tabular-nums">
                            {match.score1}
                          </span>
                          {team1Won ? (
                            <span className="text-xs">◀</span>
                          ) : (
                            <span className="w-3" />
                          )}
                        </div>
                      </div>

                      {/* Team 2 Row */}
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className={`flex items-center gap-2 ${!team2Won && "text-muted-foreground"}`}
                        >
                          <Avatar
                            initials={match.team2Flag}
                            className="size-5"
                            square
                          />
                          <span className="text-sm font-medium">
                            {match.team2}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-semibold tabular-nums">
                            {match.score2}
                          </span>
                          {team2Won ? (
                            <span className="text-xs">◀</span>
                          ) : (
                            <span className="w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3 text-xs align-top w-full max-w-[250px]">
                    {hasEvents ? (
                      <div className="flex flex-col gap-3">
                        {/* Team 1 Events */}
                        <div className="flex items-center min-h-7">
                          <div className="space-y-1">
                            {Object.entries(team1EventsByType).map(
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
                            {(match.events1 || []).length === 0 && (
                              <span className="text-muted-foreground">
                                No Goals
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Team 2 Events */}
                        <div className="flex items-center min-h-7">
                          <div className="space-y-1">
                            {Object.entries(team2EventsByType).map(
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
                            {(match.events2 || []).length === 0 && (
                              <span className="text-muted-foreground">
                                No Goals
                              </span>
                            )}
                          </div>
                        </div>
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
