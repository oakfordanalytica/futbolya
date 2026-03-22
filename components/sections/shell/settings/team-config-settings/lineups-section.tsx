"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import SettingsItem from "../settings-item";
import { LineupTemplateDialog } from "../lineup-template-dialog";
import type { LineupTemplate } from "./types";

export function LineupsSection({
  leagueSlug,
  lineups,
}: {
  leagueSlug: string;
  lineups: LineupTemplate[];
}) {
  const t = useTranslations("Settings.general.teamConfig");
  const tCommon = useTranslations("Common");
  const removeLineup = useMutation(api.leagueSettings.removeLineup);

  const [isLineupDialogOpen, setIsLineupDialogOpen] = useState(false);
  const [removingLineupId, setRemovingLineupId] = useState<string | null>(null);
  const [editingLineup, setEditingLineup] = useState<LineupTemplate | null>(null);

  const handleRemoveLineup = async (lineupId: string) => {
    setRemovingLineupId(lineupId);
    try {
      await removeLineup({ leagueSlug, lineupId });
    } finally {
      setRemovingLineupId(null);
    }
  };

  return (
    <>
      <SettingsItem
        title={t("lineups.title")}
        description={t("lineups.description")}
      >
        <div className="flex flex-col gap-4">
          {lineups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lineups.empty")}</p>
          ) : (
            <ul className="space-y-1.5">
              {lineups.map((lineup) => (
                <li key={lineup.id} className="group">
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                    <span>{lineup.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                      onClick={() => {
                        setEditingLineup(lineup);
                        setIsLineupDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 hover:text-destructive"
                      onClick={() => handleRemoveLineup(lineup.id)}
                      disabled={removingLineupId === lineup.id}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => {
                setEditingLineup(null);
                setIsLineupDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              {tCommon("actions.create")}
            </Button>
          </div>
        </div>
      </SettingsItem>

      <LineupTemplateDialog
        open={isLineupDialogOpen}
        onOpenChange={(open) => {
          setIsLineupDialogOpen(open);
          if (!open) {
            setEditingLineup(null);
          }
        }}
        leagueSlug={leagueSlug}
        lineup={editingLineup}
      />
    </>
  );
}
