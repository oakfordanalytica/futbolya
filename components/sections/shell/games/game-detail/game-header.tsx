"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/navigation/routes";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseIsoDateAsLocal } from "@/lib/utils/date";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Settings, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { TEAM_ROUTES } from "@/lib/navigation/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateGameDialog } from "../create-game-dialog";

interface GameHeaderProps {
  game: {
    _id: string;
    seasonId?: string;
    homeClubId: string;
    awayClubId: string;
    homeClubSlug: string;
    awayClubSlug: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeTeamColor?: string;
    awayTeamColor?: string;
    date: string;
    startTime: string;
    category: string;
    gender: "male" | "female" | "mixed";
    locationName?: string;
    locationCoordinates?: number[];
    status:
      | "scheduled"
      | "awaiting_stats"
      | "pending_review"
      | "completed"
      | "cancelled";
    homeScore?: number;
    awayScore?: number;
  };
  orgSlug: string;
  routeScope?: "org" | "team";
  currentClubSlug?: string;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  awaiting_stats:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  pending_review:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const DEFAULT_HOME_COLOR = "#3b82f6";
const DEFAULT_AWAY_COLOR = "#ef4444";

function resolveTeamColor(color: string | undefined, fallback: string) {
  const normalized = color?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

export function GameHeader({
  game,
  orgSlug,
  routeScope = "org",
  currentClubSlug,
}: GameHeaderProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const removeGame = useMutation(api.games.remove);
  const { isAdmin, isLoaded } = useIsAdmin();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasRecordedScore =
    typeof game.homeScore === "number" && typeof game.awayScore === "number";
  const showScore =
    game.status !== "cancelled" &&
    (hasRecordedScore ||
      game.status === "awaiting_stats" ||
      game.status === "pending_review" ||
      game.status === "completed");
  const parsedGameDate = parseIsoDateAsLocal(game.date);
  const formattedDate = parsedGameDate ? format(parsedGameDate, "PPP") : "—";

  const homeColor = resolveTeamColor(game.homeTeamColor, DEFAULT_HOME_COLOR);
  const awayColor = resolveTeamColor(game.awayTeamColor, DEFAULT_AWAY_COLOR);
  const hasTeamColors = Boolean(game.homeTeamColor || game.awayTeamColor);

  const gameInfo = [
    { label: t("games.category"), value: game.category },
    { label: t("games.gender"), value: t(`gender.${game.gender}`) },
  ].filter((stat) => stat.value);

  const canManageGame = isLoaded && isAdmin;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeGame({ gameId: game._id as Id<"games"> });
      toast.success(t("games.deleted"));

      if (routeScope === "team" && currentClubSlug) {
        router.push(TEAM_ROUTES.games.list(orgSlug, currentClubSlug));
      } else {
        router.push(ROUTES.org.games.list(orgSlug));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <section
        className="w-full rounded-t-lg border-b text-white"
        style={{
          background: `linear-gradient(to right, ${homeColor}, ${awayColor})`,
        }}
      >
        <div className="mx-auto w-full max-w-full p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Badge
              className={cn(
                "w-fit text-xs",
                hasTeamColors
                  ? "border-white/30 bg-white/20 text-white"
                  : STATUS_STYLES[game.status],
              )}
            >
              {t(`games.statusOptions.${game.status}`)}
            </Badge>
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/80 sm:text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {game.startTime}
                </span>
              </div>
              {canManageGame ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="rounded-full ring-1 bg-transparent hover:bg-transparent"
                      size="sm"
                    >
                      <Settings className="size-4" />
                      <span className="hidden md:block">
                        {t("actions.edit")}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                      <Settings className="size-4" />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-4 sm:gap-4 md:gap-8">
            <Link
              href={ROUTES.org.teams.detail(orgSlug, game.homeClubSlug)}
              className="flex min-w-0 flex-1 flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              {game.homeTeamLogo ? (
                <Image
                  src={game.homeTeamLogo}
                  alt={game.homeTeamName}
                  width={80}
                  height={80}
                  className="h-14 w-14 object-contain select-none sm:h-20 sm:w-20"
                  draggable={false}
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white sm:size-20 sm:text-2xl">
                  {game.homeTeamName.charAt(0)}
                </div>
              )}
              <span className="max-w-full text-center text-sm font-semibold leading-tight text-white break-words md:text-base">
                {game.homeTeamName}
              </span>
            </Link>

            <div className="shrink-0 px-1">
              {showScore ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                    {game.homeScore ?? 0}
                  </span>
                  <span className="text-lg text-white/70 sm:text-xl">-</span>
                  <span className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                    {game.awayScore ?? 0}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-white/90 sm:text-3xl">
                  VS
                </span>
              )}
            </div>

            <Link
              href={ROUTES.org.teams.detail(orgSlug, game.awayClubSlug)}
              className="flex min-w-0 flex-1 flex-col items-center gap-2 transition-opacity hover:opacity-80"
            >
              {game.awayTeamLogo ? (
                <Image
                  src={game.awayTeamLogo}
                  alt={game.awayTeamName}
                  width={80}
                  height={80}
                  className="h-14 w-14 object-contain select-none sm:h-20 sm:w-20"
                  draggable={false}
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white sm:size-20 sm:text-2xl">
                  {game.awayTeamName.charAt(0)}
                </div>
              )}
              <span className="max-w-full text-center text-sm font-semibold leading-tight text-white break-words md:text-base">
                {game.awayTeamName}
              </span>
            </Link>
          </div>

          {game.locationName && (
            <div className="mb-4 flex min-w-0 items-start justify-center gap-1 px-2 text-center text-sm leading-snug text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 max-w-full break-words">
                {game.locationName}
              </span>
            </div>
          )}

          {gameInfo.length > 0 && (
            <div className="flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
              {gameInfo.map((stat, index) => (
                <Fragment key={stat.label}>
                  {index > 0 && (
                    <Separator
                      orientation="vertical"
                      className="hidden h-8 bg-white/30 sm:block"
                    />
                  )}
                  <div className="text-center">
                    <span className="block text-[10px] uppercase tracking-widest text-white">
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

      {canManageGame ? (
        <>
          <CreateGameDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            orgSlug={orgSlug}
            gameToEdit={{
              _id: game._id,
              seasonId: game.seasonId,
              homeClubId: game.homeClubId,
              awayClubId: game.awayClubId,
              date: game.date,
              startTime: game.startTime,
              category: game.category,
              gender: game.gender,
              locationName: game.locationName,
              locationCoordinates: game.locationCoordinates,
            }}
          />

          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("games.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("games.deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  {t("actions.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? t("actions.loading") : t("actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </>
  );
}
