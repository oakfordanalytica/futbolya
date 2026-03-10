import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GameCenterClient } from "@/components/sections/shell/games/game-detail/game-center-client";
import { getAuthToken } from "@/lib/auth/auth";
import { getTenantAccess } from "@/lib/auth/tenant-access";
import { ROUTES } from "@/lib/navigation/routes";
import { routing } from "@/i18n/routing";

interface GameCenterPageProps {
  params: Promise<{
    locale: string;
    tenant: string;
    gameId: string;
  }>;
}

export default async function GameCenterPage({ params }: GameCenterPageProps) {
  const { locale, tenant, gameId } = await params;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const token = await getAuthToken();
  const { hasAccess, isAdmin } = await getTenantAccess(tenant, token);

  if (!hasAccess || !isAdmin) {
    redirect(`${localePrefix}${ROUTES.org.games.detail(tenant, gameId)}`);
  }

  const preloadedGame = await preloadQuery(
    api.games.getById,
    { gameId: gameId as Id<"games"> },
    { token },
  );

  return <GameCenterClient preloadedGame={preloadedGame} orgSlug={tenant} />;
}
