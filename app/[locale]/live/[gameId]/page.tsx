import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { PublicGameDetail } from "@/components/sections/public/public-games";
import { PublicShell } from "@/components/sections/public/public-shell";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenancy/config";

interface PublicGamePageProps {
  params: Promise<{ locale: string; gameId: string }>;
}

export async function generateMetadata({
  params,
}: PublicGamePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  return {
    title: `${t("game.timeline")} | Futbolya`,
    description: t("live.description"),
  };
}

export default async function PublicGamePage({ params }: PublicGamePageProps) {
  const { gameId } = await params;
  const preloadedGame = await preloadQuery(api.games.getPublicById, {
    orgSlug: DEFAULT_TENANT_SLUG,
    gameId,
  });

  if (!preloadedQueryResult(preloadedGame)) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicGameDetail preloadedGame={preloadedGame} />
    </PublicShell>
  );
}
