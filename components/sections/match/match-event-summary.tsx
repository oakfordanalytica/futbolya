import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_ICONS } from "@/lib/scoreboard/config";
import type { MatchEvent } from "@/lib/mocks/types";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MatchEventSummaryProps {
  events: MatchEvent[];
  team1Name: string;
  team2Name: string;
}

export function MatchEventSummary({
  events,
  team1Name,
  team2Name,
}: MatchEventSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-my-4 divide-y divide-border">
            {events.map((event, idx) => (
              <li key={idx} className="flex items-center space-x-4 py-4">
                <div className="w-12 text-right">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {event.minute}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xl">{EVENT_ICONS[event.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {event.type === "substitution" ? (
                    <div className="text-sm">
                      <div className="flex items-center gap-1.5 text-green-600">
                        <ArrowUp className="size-3" />
                        <span>{event.playerIn?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-600">
                        <ArrowDown className="size-3" />
                        <span>{event.playerOut?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium truncate">
                      {event.playerName}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {event.team === "team1" ? team1Name : team2Name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}