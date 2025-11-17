"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EVENT_ICONS } from "@/lib/scoreboard/config";
import type { MatchEvent } from "@/lib/mocks/types";

interface MatchTimelineProps {
  events: MatchEvent[];
  matchStatus: string;
}

// Helper to convert minute string ('45+2') to a number
function getMinuteAsNumber(minute: string): number {
  const parts = minute.replace("'", "").split("+");
  return parseInt(parts[0], 10) + (parseInt(parts[1], 10) || 0);
}

export function MatchTimeline({ events/*, matchStatus */}: MatchTimelineProps) {
  const maxEventMinute = Math.max(
    ...events.map((e) => getMinuteAsNumber(e.minute)),
    90,
  );

  const totalMinutes = maxEventMinute;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Match Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="relative w-full h-10">
            {/* Timeline Bar */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-muted rounded-full">
              {/* Halftime Mark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-background" />
            </div>

            {/* Events */}
            <div className="relative h-full">
              {events.map((event, idx) => {
                const minute = getMinuteAsNumber(event.minute);
                const rawPercentage = (minute / totalMinutes) * 100;
                const leftPosition = 1 + (rawPercentage * 0.98);

                const eventPlayer =
                  event.playerName ??
                  event.playerIn?.name ??
                  "Event";
                const eventDetail =
                  event.type === "substitution"
                    ? `${event.playerIn?.name} (in), ${event.playerOut?.name} (out)`
                    : `${event.playerName}`;

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `${leftPosition}%` }}
                      >
                        <span className="text-xl cursor-default">
                          {EVENT_ICONS[event.type]}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">
                        {event.minute}&apos; - {eventPlayer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {eventDetail}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}