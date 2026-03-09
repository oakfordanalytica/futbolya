"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatHeight,
  formatWeight,
  calculateAge,
} from "@/lib/sports/soccer/player-utils";
import { buildPlayerFullName, buildPlayerInitials } from "@/lib/players/name";

interface PlayerCardProps {
  player: {
    firstName: string;
    lastName: string;
    secondLastName?: string;
    photoUrl?: string;
    dateOfBirth?: string;
    cometNumber?: string;
    position?: string;
    height?: number;
    weight?: number;
  };
  positionLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function PlayerCard({
  player,
  positionLabel,
  className,
  onClick,
}: PlayerCardProps) {
  const t = useTranslations("Common");

  const fullName = buildPlayerFullName(
    player.firstName,
    player.lastName,
    player.secondLastName,
  );
  const surnames = buildPlayerFullName(
    player.lastName,
    player.secondLastName ?? "",
  );
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : undefined;

  const props = [
    player.height !== undefined && {
      label: t("playerCard.height"),
      value: formatHeight(player.height),
    },
    player.weight !== undefined && {
      label: t("playerCard.weight"),
      value: formatWeight(player.weight),
    },
    age !== undefined && { label: t("playerCard.age"), value: age },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <Card
      className={cn(
        "overflow-hidden py-4 relative",
        onClick && "cursor-pointer transition-colors hover:bg-accent/40",
        className,
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {player.cometNumber && (
        <span className="absolute top-3 right-3 z-20 text-[0.72rem] font-semibold tracking-wide text-muted-foreground/80 tabular-nums">
          {player.cometNumber}
        </span>
      )}

      {player.photoUrl && (
        <Image
          src={player.photoUrl}
          alt={fullName}
          width={290}
          height={0}
          className="absolute bottom-0 z-10"
          style={{ left: "40%" }}
        />
      )}

      <div className="relative z-10 grid grid-cols-2">
        <div className="p-4 flex flex-col">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium">
                {player.firstName}
              </p>
              <h3 className="font-bold leading-tight">{surnames}</h3>
            </div>
            {positionLabel && (
              <span className="shrink-0 text-[2.1rem] leading-[2.1rem] font-black text-foreground/25 tabular-nums select-none">
                {positionLabel}
              </span>
            )}
          </div>

          <div className="mt-auto">
            {props.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center justify-between py-1",
                  index < props.length - 1 && "border-b",
                )}
              >
                <span
                  className="font-medium text-muted-foreground uppercase tracking-wide"
                  style={{ fontSize: "0.7rem", lineHeight: "1rem" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-foreground font-medium"
                  style={{ fontSize: "0.7rem" }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="">
          {!player.photoUrl && (
            <div className="h-24 w-full flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/30">
                {buildPlayerInitials(
                  player.firstName,
                  player.lastName,
                  player.secondLastName,
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PlayerCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden py-0 relative", className)}>
      <div className="grid grid-cols-2 animate-pulse">
        <div className="p-4 flex flex-col">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-8 w-10 bg-muted rounded" />
          </div>

          <div className="mt-auto">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex justify-between py-1",
                  i < 4 && "border-b border-border/50",
                )}
              >
                <div className="h-3 w-14 bg-muted rounded" />
                <div className="h-3 w-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted h-24" />
      </div>
    </Card>
  );
}
