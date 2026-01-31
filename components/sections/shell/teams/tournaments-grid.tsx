"use client";

import { useTranslations } from "next-intl";

interface TournamentsGridProps {
  clubSlug: string;
}

export function TournamentsGrid({ clubSlug }: TournamentsGridProps) {
  const t = useTranslations("Common");

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">
        Schedule functionality coming soon
      </p>
    </div>
  );
}
