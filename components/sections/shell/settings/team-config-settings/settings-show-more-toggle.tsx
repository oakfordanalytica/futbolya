"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function SettingsShowMoreToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const tCommon = useTranslations("Common");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-fit px-0 text-xs text-muted-foreground hover:text-foreground"
      onClick={onToggle}
    >
      {expanded ? tCommon("actions.showLess") : tCommon("actions.showMore")}
    </Button>
  );
}
