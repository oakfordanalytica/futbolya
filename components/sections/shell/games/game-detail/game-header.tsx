"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock } from "lucide-react";

interface GameHeaderProps {
  game: {
    _id: string;
    homeClubId: string;
    awayClubId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    date: string;
    startTime: string;
    category: string;
    gender: "male" | "female" | "mixed";
    locationName?: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    homeScore?: number;
    awayScore?: number;
  };
  orgSlug: string;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const DEFAULT_HOME_COLOR = "#3b82f6";
const DEFAULT_AWAY_COLOR = "#ef4444";

export function GameHeader({ game, orgSlug }: GameHeaderProps) {
  const t = useTranslations("Common");

  const showScore =
    game.status === "in_progress" || game.status === "completed";
  const formattedDate = format(new Date(game.date), "PPP");

  const homeColor = DEFAULT_HOME_COLOR;
  const awayColor = DEFAULT_AWAY_COLOR;

  const hasTeamColors = false;

  const gameInfo = [
    { label: t("games.category"), value: game.category },
    { label: t("games.gender"), value: t(`gender.${game.gender}`) },
  ].filter((stat) => stat.value);

  return (
    <section
      className="w-full rounded-t-lg border-b text-white"
      style={{
        background: `linear-gradient(to right, ${homeColor}, ${awayColor})`,
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
      }}
    >
      <div className="mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge
            className={cn(
              "text-xs",
              hasTeamColors
                ? "bg-white/20 text-white border-white/30"
                : STATUS_STYLES[game.status],
            )}
          >
            {t(`games.statusOptions.${game.status}`)}
          </Badge>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {game.startTime}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
          <Link
            href={`/${orgSlug}/teams/${game.homeClubId}`}
            className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
          >
            {game.homeTeamLogo ? (
              <Image
                src={game.homeTeamLogo}
                alt={game.homeTeamName}
                width={80}
                height={80}
                className="object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="size-20 rounded-full flex items-center justify-center text-2xl font-bold bg-white/20 text-white">
                {game.homeTeamName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-center text-sm md:text-base text-white">
              {game.homeTeamName}
            </span>
          </Link>

          <div className="flex flex-col items-center gap-1">
            {showScore ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {game.homeScore ?? 0}
                </span>
                <span className="text-xl text-white/70">-</span>
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {game.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <span className="text-2xl md:text-3xl font-bold text-white/90">
                VS
              </span>
            )}
          </div>

          <Link
            href={`/${orgSlug}/teams/${game.awayClubId}`}
            className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
          >
            {game.awayTeamLogo ? (
              <Image
                src={game.awayTeamLogo}
                alt={game.awayTeamName}
                width={80}
                height={80}
                className="object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="size-20 rounded-full flex items-center justify-center text-2xl font-bold bg-white/20 text-white">
                {game.awayTeamName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-center text-sm md:text-base text-white">
              {game.awayTeamName}
            </span>
          </Link>
        </div>

        {game.locationName && (
          <div className="flex items-center justify-center gap-1 text-sm text-white/80 mb-4">
            <MapPin className="size-4" />
            <span>{game.locationName}</span>
          </div>
        )}

        {gameInfo.length > 0 && (
          <div className="flex w-full items-center justify-center gap-8 pt-2">
            {gameInfo.map((stat, index) => (
              <Fragment key={stat.label}>
                {index > 0 && (
                  <Separator
                    orientation="vertical"
                    className="h-8 bg-white/30"
                  />
                )}
                <div className="text-center">
                  <span className="block uppercase tracking-widest text-[10px] text-white">
                    {stat.label}
                  </span>
                  <span className="block font-semibold text-white">
                    {stat.value}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
