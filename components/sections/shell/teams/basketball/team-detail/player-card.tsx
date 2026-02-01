"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatHeight,
  formatWeight,
  calculateAge,
} from "@/lib/sports/basketball/types";

interface PlayerCardProps {
  player: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    dateOfBirth?: string;
    jerseyNumber?: number;
    position?: string;
    height?: number;
    weight?: number;
  };
  positionLabel?: string;
  className?: string;
}

export function PlayerCard({
  player,
  positionLabel,
  className,
}: PlayerCardProps) {
  const t = useTranslations("Common");

  const fullName = `${player.firstName} ${player.lastName}`;
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
    <Card className={cn("overflow-hidden  py-4 relative", className)}>
      {player.jerseyNumber !== undefined && (
        <span className="absolute top-0 right-0 p-3 text-3xl font-bold text-foreground/70 tabular-nums z-10">
          {player.jerseyNumber}
        </span>
      )}

      {player.photoUrl && (
        <Image
          src={player.photoUrl}
          alt={fullName}
          width={290}
          height={0}
          className="absolute bottom-0"
          style={{ left: "40%" }}
        />
      )}

      <div className="grid grid-cols-2">
        <div className="p-4 flex flex-col">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground font-medium">
              {player.firstName}
            </p>
            <h3 className=" font-bold leading-tight">{player.lastName}</h3>
            {positionLabel && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
                {positionLabel}
              </p>
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
                {`${player.firstName.charAt(0)}${player.lastName.charAt(0)}`}
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
      <div className="absolute top-0 right-0 p-3">
        <div className="h-8 w-8 bg-muted rounded" />
      </div>

      <div className="grid grid-cols-2 animate-pulse">
        <div className="p-4 flex flex-col">
          <div className="mb-3 space-y-1">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-6 w-24 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
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
