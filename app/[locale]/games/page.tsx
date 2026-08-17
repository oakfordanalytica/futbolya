import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { PublicGamesDirectory } from "@/components/sections/public/public-games-directory";
import { PublicShell } from "@/components/sections/public/public-shell";
import { DEFAULT_TENANT_SLUG } from "@/lib/tenancy/config";

interface PublicGamesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PublicGamesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.gamesPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function PublicGamesPage() {
  const anchorDate = new Date().toISOString().slice(0, 10);
  const [preloadedGames, preloadedStandings] = await Promise.all([
    preloadQuery(api.games.listPublicGames, {
      orgSlug: DEFAULT_TENANT_SLUG,
      anchorDate,
    }),
    preloadQuery(api.games.getPublicSeasonTable, {
      orgSlug: DEFAULT_TENANT_SLUG,
    }),
  ]);

  return (
    <PublicShell>
      <PublicGamesDirectory
        preloadedGames={preloadedGames}
        preloadedStandings={preloadedStandings}
      />
    </PublicShell>
  );
}
