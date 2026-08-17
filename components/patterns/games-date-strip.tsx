"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { parseIsoDateAsLocal, parseLocalDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { GameStatus } from "@/lib/games/status";

export interface GameStripItem {
  id: string;
  href: string;
  date: string;
  startTime: string;
  category: string;
  status: GameStatus;
  home: { name: string; logoUrl?: string; score?: number };
  away: { name: string; logoUrl?: string; score?: number };
}

function getScrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? ("auto" as const)
    : ("smooth" as const);
}

function TeamRow({
  team,
  showScore,
}: {
  team: GameStripItem["home"];
  showScore: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar
          src={team.logoUrl}
          initials={team.name.charAt(0).toUpperCase()}
          alt=""
          className="size-5 bg-muted text-muted-foreground"
        />
        <span className="truncate text-sm font-medium">{team.name}</span>
      </div>
      <span className="text-lg/none font-bold tabular-nums">
        {showScore && typeof team.score === "number" ? team.score : "—"}
      </span>
    </div>
  );
}

export function GamesDateStrip({
  games,
  previousLabel,
  nextLabel,
  className,
}: {
  games: GameStripItem[];
  previousLabel: string;
  nextLabel: string;
  className?: string;
}) {
  const locale = useLocale();
  const common = useTranslations("Common");
  const stripRef = React.useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = React.useRef(false);
  const formatters = React.useMemo(
    () => ({
      day: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      month: new Intl.DateTimeFormat(locale, { month: "short" }),
      time: new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
      }),
    }),
    [locale],
  );
  const sortedGames = React.useMemo(
    () =>
      games
        .flatMap((game) => {
          const dateTime = parseLocalDateTime(game.date, game.startTime);
          return dateTime ? [{ game, dateTime }] : [];
        })
        .sort(
          (left, right) => left.dateTime.getTime() - right.dateTime.getTime(),
        ),
    [games],
  );
  const initialGameId = React.useMemo(
    () =>
      sortedGames.find(
        ({ game }) =>
          game.status === "in_progress" || game.status === "halftime",
      )?.game.id ??
      sortedGames.find(
        ({ game, dateTime }) =>
          game.status === "scheduled" && dateTime.getTime() >= Date.now(),
      )?.game.id ??
      sortedGames.at(-1)?.game.id ??
      null,
    [sortedGames],
  );

  React.useEffect(() => {
    if (!initialGameId || hasAutoScrolledRef.current || !stripRef.current) {
      return;
    }
    const target = stripRef.current.querySelector<HTMLElement>(
      `[data-game-id="${CSS.escape(initialGameId)}"]`,
    );
    if (!target) {
      return;
    }
    stripRef.current.scrollTo({
      left: Math.max(
        0,
        target.offsetLeft -
          stripRef.current.clientWidth / 2 +
          target.clientWidth / 2,
      ),
      behavior: getScrollBehavior(),
    });
    hasAutoScrolledRef.current = true;
  }, [initialGameId]);

  if (sortedGames.length === 0) {
    return null;
  }

  const scroll = (left: number) =>
    stripRef.current?.scrollBy({ left, behavior: getScrollBehavior() });
  let lastDate = "";

  return (
    <section className={cn("group relative bg-muted/30 py-2", className)}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="pointer-events-none absolute top-1/2 left-2 z-10 hidden -translate-y-1/2 bg-background/95 opacity-0 transition-opacity md:inline-flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:focus-visible:opacity-100"
        onClick={() => scroll(-420)}
        aria-label={previousLabel}
      >
        <ChevronLeftIcon />
      </Button>
      <div
        ref={stripRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max items-stretch gap-2 px-2">
          {sortedGames.flatMap(({ game, dateTime }) => {
            const items: React.ReactNode[] = [];
            if (game.date !== lastDate) {
              lastDate = game.date;
              const dayDate = parseIsoDateAsLocal(game.date);
              if (dayDate) {
                items.push(
                  <div
                    key={`day-${game.date}`}
                    className="flex w-14 shrink-0 flex-col items-center justify-center bg-secondary px-1 py-2 text-center"
                  >
                    <span className="text-[11px] font-bold uppercase leading-none">
                      {formatters.day.format(dayDate)}
                    </span>
                    <span className="mt-1 text-[10px] uppercase leading-none text-muted-foreground">
                      {formatters.month.format(dayDate)}
                    </span>
                    <span className="mt-1 text-lg font-black leading-none">
                      {dayDate.getDate()}
                    </span>
                  </div>,
                );
              }
            }
            const isLive =
              game.status === "in_progress" || game.status === "halftime";
            const showScore = game.status === "completed" || isLive;
            items.push(
              <Link
                key={game.id}
                href={game.href}
                data-game-id={game.id}
                className={cn(
                  "w-[190px] shrink-0 border bg-card px-3 py-2 outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
                  (game.status === "in_progress" ||
                    game.status === "halftime") &&
                    "border-primary bg-primary/5",
                )}
              >
                <p className="mb-2 flex min-w-0 items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-wide">
                  <span className="truncate">
                    {game.category} · {formatters.time.format(dateTime)}
                  </span>
                  {isLive ? (
                    <span className="shrink-0 text-primary">
                      {common(`games.statusOptions.${game.status}`)}
                    </span>
                  ) : null}
                </p>
                <div className="flex flex-col gap-1.5">
                  <TeamRow team={game.home} showScore={showScore} />
                  <TeamRow team={game.away} showScore={showScore} />
                </div>
              </Link>,
            );
            return items;
          })}
        </div>
      </div>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="pointer-events-none absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 bg-background/95 opacity-0 transition-opacity md:inline-flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:focus-visible:opacity-100"
        onClick={() => scroll(420)}
        aria-label={nextLabel}
      >
        <ChevronRightIcon />
      </Button>
    </section>
  );
}
