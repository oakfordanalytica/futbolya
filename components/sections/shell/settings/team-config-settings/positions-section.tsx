"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import SettingsItem from "../settings-item";
import type { Position } from "./types";
import { PositionAddForm } from "./position-add-form";
import { PositionItem } from "./position-item";
import { SettingsShowMoreToggle } from "./settings-show-more-toggle";

interface NewPosition {
  name: string;
  abbreviation: string;
}

interface EditingPosition {
  id: string;
  name: string;
  abbreviation: string;
}

const MAX_VISIBLE_ITEMS = 6;

export function PositionsSection({
  leagueSlug,
  positions,
}: {
  leagueSlug: string;
  positions: Position[];
}) {
  const t = useTranslations("Settings.general.teamConfig");
  const tCommon = useTranslations("Common");
  const addPosition = useMutation(api.leagueSettings.addPosition);
  const removePosition = useMutation(api.leagueSettings.removePosition);
  const updatePosition = useMutation(api.leagueSettings.updatePosition);

  const [newPosition, setNewPosition] = useState<NewPosition>({
    name: "",
    abbreviation: "",
  });
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [editingPosition, setEditingPosition] =
    useState<EditingPosition | null>(null);
  const [savingPositionId, setSavingPositionId] = useState<string | null>(null);
  const [showAllPositions, setShowAllPositions] = useState(false);

  const visiblePositions = showAllPositions
    ? positions
    : positions.slice(0, MAX_VISIBLE_ITEMS);

  const handleAddPosition = async () => {
    if (!newPosition.name || !newPosition.abbreviation) {
      return;
    }

    setIsAddingPosition(true);
    try {
      await addPosition({
        leagueSlug,
        position: {
          id: crypto.randomUUID(),
          name: newPosition.name,
          abbreviation: newPosition.abbreviation,
        },
      });
      setNewPosition({ name: "", abbreviation: "" });
    } finally {
      setIsAddingPosition(false);
    }
  };

  const handleSavePosition = async () => {
    if (!editingPosition) {
      return;
    }

    const name = editingPosition.name.trim();
    const abbreviation = editingPosition.abbreviation.trim();
    if (!name || !abbreviation) {
      return;
    }

    setSavingPositionId(editingPosition.id);
    try {
      await updatePosition({
        leagueSlug,
        positionId: editingPosition.id,
        name,
        abbreviation,
      });
      setEditingPosition(null);
    } finally {
      setSavingPositionId(null);
    }
  };

  return (
    <SettingsItem
      title={t("positions.title")}
      description={t("positions.description")}
    >
      <div className="flex flex-col gap-4">
        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("positions.empty")}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {visiblePositions.map((position) => (
              <PositionItem
                key={position.id}
                position={position}
                editingPosition={editingPosition}
                saving={savingPositionId === position.id}
                onStartEdit={() =>
                  setEditingPosition({
                    id: position.id,
                    name: position.name,
                    abbreviation: position.abbreviation,
                  })
                }
                onChange={(field, value) =>
                  setEditingPosition((prev) =>
                    prev
                      ? {
                          ...prev,
                          [field]: value,
                        }
                      : prev,
                  )
                }
                onSave={handleSavePosition}
                onCancel={() => setEditingPosition(null)}
                onRemove={() =>
                  removePosition({
                    leagueSlug,
                    positionId: position.id,
                  })
                }
              />
            ))}
          </ul>
        )}
        {positions.length > MAX_VISIBLE_ITEMS && (
          <SettingsShowMoreToggle
            expanded={showAllPositions}
            onToggle={() => setShowAllPositions((prev) => !prev)}
          />
        )}

        <PositionAddForm
          value={newPosition}
          isSubmitting={isAddingPosition}
          onChange={(field, value) =>
            setNewPosition((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSubmit={handleAddPosition}
          labels={{
            name: t("positions.name"),
            namePlaceholder: t("positions.namePlaceholder"),
            abbreviation: t("positions.abbreviation"),
            abbreviationPlaceholder: t("positions.abbreviationPlaceholder"),
          }}
        />
      </div>
    </SettingsItem>
  );
}
