"use client";

import Image from "next/image";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function TeamMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  return logoUrl ? (
    <Image
      src={logoUrl}
      alt=""
      width={24}
      height={24}
      className="size-6 object-contain"
    />
  ) : (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-public-paper/10 text-[10px] font-bold text-public-paper"
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function PublicStandings({
  preloadedStandings,
  variant = "full",
}: {
  preloadedStandings: Preloaded<typeof api.games.getPublicSeasonTable>;
  variant?: "full" | "compact";
}) {
  const standings = usePreloadedQuery(preloadedStandings);
  const t = useTranslations("Public");
  const compact = variant === "compact";

  return (
    <section
      className="text-public-paper"
      aria-labelledby={`standings-${variant}`}
    >
      <div className="border-b border-public-paper/20 pb-3">
        <h2
          id={`standings-${variant}`}
          className={cn(
            "font-black uppercase tracking-tight",
            compact ? "text-xl" : "text-4xl sm:text-5xl",
          )}
        >
          {t("standings.title")}
        </h2>
        {standings ? (
          <p className="mt-1 text-xs text-public-paper/55">
            {standings.season.name}
          </p>
        ) : null}
      </div>

      {!standings || standings.teams.length === 0 ? (
        <p className="border-b border-public-paper/20 py-8 text-sm text-public-paper/55">
          {t("standings.empty")}
        </p>
      ) : (
        <Table className={compact ? "text-xs" : "min-w-[620px]"}>
          <TableCaption className="sr-only">
            {t("standings.title")}
          </TableCaption>
          <TableHeader>
            <TableRow className="border-public-paper/20 hover:bg-transparent">
              <TableHead className="w-8 px-1 text-right text-public-paper/45">
                #
              </TableHead>
              <TableHead className="text-public-paper/45">
                {t("standings.columns.team")}
              </TableHead>
              <TableHead className="px-1 text-center text-public-paper/45">
                {t("standings.columns.played")}
              </TableHead>
              {compact ? null : (
                <>
                  <TableHead className="text-center text-public-paper/45">
                    {t("standings.columns.won")}
                  </TableHead>
                  <TableHead className="text-center text-public-paper/45">
                    {t("standings.columns.drawn")}
                  </TableHead>
                  <TableHead className="text-center text-public-paper/45">
                    {t("standings.columns.lost")}
                  </TableHead>
                </>
              )}
              <TableHead className="px-1 text-center text-public-paper/45">
                {t("standings.columns.difference")}
              </TableHead>
              <TableHead className="px-1 text-right font-bold text-public-paper">
                {t("standings.columns.points")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.teams.map((team, index) => (
              <TableRow
                key={`${team.name}-${index}`}
                className="border-public-paper/15 hover:bg-public-paper/5"
              >
                <TableCell className="px-1 text-right text-public-paper/45 tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell className="max-w-44">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamMark name={team.name} logoUrl={team.logoUrl} />
                    <span className="truncate font-bold uppercase">
                      {team.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-1 text-center tabular-nums">
                  {team.gamesPlayed}
                </TableCell>
                {compact ? null : (
                  <>
                    <TableCell className="text-center tabular-nums">
                      {team.wins}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {team.draws}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {team.losses}
                    </TableCell>
                  </>
                )}
                <TableCell className="px-1 text-center tabular-nums">
                  {team.goalDifference > 0 ? "+" : ""}
                  {team.goalDifference}
                </TableCell>
                <TableCell className="px-1 text-right font-black tabular-nums">
                  {team.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
