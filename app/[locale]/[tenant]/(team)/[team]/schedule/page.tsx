import { TournamentsGrid } from "@/components/sections/shell/teams/tournaments-grid";
import { getTranslations } from "next-intl/server";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamSchedulePage({ params }: { params: Params }) {
  const { team } = await params;
  const t = await getTranslations("Common");

  return <TournamentsGrid clubSlug={team} />;
}
