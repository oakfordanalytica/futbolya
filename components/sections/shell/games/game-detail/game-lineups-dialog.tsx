"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FootballField } from "@/components/ui/football-field";
import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
  FootballLineupTemplateSlot,
} from "@/components/ui/football-field.types";

interface GameLineupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string | null;
}

type EditorPlayer = {
  _id: string;
  playerName: string;
  lastName: string;
  photoUrl?: string;
  jerseyNumber?: number;
  cometNumber?: string;
  position?: string;
};

type EditorLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  photoUrl?: string;
  jerseyNumber?: number;
  cometNumber?: string;
  position?: string;
};

type EditorLineupSlot = FootballLineupTemplateSlot & {
  player?: EditorLineupPlayer;
};

type EditorLineup = {
  lineupTemplateId?: string;
  formation?: string;
  slots: EditorLineupSlot[];
  starters: EditorLineupPlayer[];
  substitutes: EditorLineupPlayer[];
};

type EditorTeam = {
  clubId: string;
  teamName: string;
  teamLogoUrl?: string;
  teamColor?: string;
  canEdit: boolean;
  lineup: EditorLineup | null;
  roster: EditorPlayer[];
};

type AvailableLineup = {
  id: string;
  name: string;
  slots: FootballLineupTemplateSlot[];
};

type TeamEditorSlotState = FootballLineupTemplateSlot & {
  playerId?: string;
};

type TeamEditorState = {
  lineupTemplateId: string;
  lineupName: string;
  slots: TeamEditorSlotState[];
  substituteIds: string[];
  selectedSlotId: string | null;
};

function TeamBadge({
  name,
  logoUrl,
  formation,
}: {
  name: string;
  logoUrl?: string;
  formation?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={18}
          height={18}
          className="size-[18px] object-contain"
        />
      ) : (
        <div className="flex size-[18px] items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate font-semibold">{formation?.trim() || "—"}</span>
    </div>
  );
}

function cloneTemplateSlots(
  slots: FootballLineupTemplateSlot[],
): TeamEditorSlotState[] {
  return slots.map((slot) => ({
    id: slot.id,
    x: slot.x,
    y: slot.y,
    role: slot.role,
  }));
}

function buildInitialTeamState(
  team: EditorTeam,
  availableLineups: AvailableLineup[],
): TeamEditorState {
  const fallbackTemplate = availableLineups[0] ?? null;

  if (team.lineup) {
    const currentSlots =
      team.lineup.slots.length > 0
        ? team.lineup.slots.map((slot) => ({
            id: slot.id,
            x: slot.x,
            y: slot.y,
            role: slot.role,
            playerId: slot.player?.playerId,
          }))
        : cloneTemplateSlots(fallbackTemplate?.slots ?? []).map(
            (slot, index) => ({
              ...slot,
              playerId: team.lineup?.starters[index]?.playerId,
            }),
          );

    return {
      lineupTemplateId:
        team.lineup.lineupTemplateId ?? fallbackTemplate?.id ?? "",
      lineupName: team.lineup.formation ?? fallbackTemplate?.name ?? "",
      slots: currentSlots,
      substituteIds: team.lineup.substitutes.map((player) => player.playerId),
      selectedSlotId: null,
    };
  }

  return {
    lineupTemplateId: fallbackTemplate?.id ?? "",
    lineupName: fallbackTemplate?.name ?? "",
    slots: cloneTemplateSlots(fallbackTemplate?.slots ?? []),
    substituteIds: [],
    selectedSlotId: null,
  };
}

function mapRosterPlayerToFieldPlayer(
  player: EditorPlayer,
): FootballLineupPlayer {
  return {
    id: player._id,
    name: player.playerName,
    lastName: player.lastName,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    photoUrl: player.photoUrl,
    position: player.position,
  };
}

function buildFieldLineup(
  team: EditorTeam,
  state: TeamEditorState,
): FootballLineup {
  const rosterMap = new Map(
    team.roster.map((player) => [
      player._id,
      mapRosterPlayerToFieldPlayer(player),
    ]),
  );
  const substitutes = team.roster
    .filter((player) => state.substituteIds.includes(player._id))
    .map(mapRosterPlayerToFieldPlayer);
  const slots: FootballLineupSlot[] = state.slots.map((slot) => ({
    id: slot.id,
    x: slot.x,
    y: slot.y,
    role: slot.role,
    ...(slot.playerId ? { player: rosterMap.get(slot.playerId) } : {}),
  }));
  const starters = slots
    .map((slot) => slot.player)
    .filter((player): player is FootballLineupPlayer => Boolean(player));

  return {
    teamName: team.teamName,
    teamColor: team.teamColor,
    formation: state.lineupName,
    starters,
    substitutes,
    slots,
  };
}

function buildAvailablePlayersForSlot(
  team: EditorTeam,
  state: TeamEditorState,
) {
  const selectedSlotId = state.selectedSlotId;
  const selectedSlot =
    state.slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const assignedElsewhere = new Set(
    state.slots
      .filter((slot) => slot.id !== selectedSlotId && slot.playerId)
      .map((slot) => slot.playerId as string),
  );

  return {
    selectedSlot,
    players: team.roster.filter(
      (player) =>
        !assignedElsewhere.has(player._id) ||
        player._id === selectedSlot?.playerId,
    ),
  };
}

function getSlotPickerStyle(slot: TeamEditorSlotState) {
  const alignRight = slot.x >= 56;
  const alignBottom = slot.y >= 76;

  return {
    left: alignRight ? `calc(${slot.x}% - 12px)` : `calc(${slot.x}% + 12px)`,
    top: alignBottom ? `calc(${slot.y}% - 10px)` : `${slot.y}%`,
    transform: `translate(${alignRight ? "-100%" : "0"}, ${alignBottom ? "-100%" : "-50%"})`,
  } as const;
}

export function GameLineupsDialog({
  open,
  onOpenChange,
  gameId,
}: GameLineupsDialogProps) {
  const t = useTranslations("Common");
  const editorData = useQuery(
    api.gameLineups.getEditorData,
    open && gameId ? { gameId: gameId as Id<"games"> } : "skip",
  );
  const saveEditorData = useMutation(api.gameLineups.saveEditorData);

  const [activeTab, setActiveTab] = useState<"home" | "away">("home");
  const [homeState, setHomeState] = useState<TeamEditorState>({
    lineupTemplateId: "",
    lineupName: "",
    slots: [],
    substituteIds: [],
    selectedSlotId: null,
  });
  const [awayState, setAwayState] = useState<TeamEditorState>({
    lineupTemplateId: "",
    lineupName: "",
    slots: [],
    substituteIds: [],
    selectedSlotId: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !editorData) {
      return;
    }

    setHomeState(
      buildInitialTeamState(editorData.homeTeam, editorData.availableLineups),
    );
    setAwayState(
      buildInitialTeamState(editorData.awayTeam, editorData.availableLineups),
    );

    if (editorData.homeTeam.canEdit) {
      setActiveTab("home");
    } else if (editorData.awayTeam.canEdit) {
      setActiveTab("away");
    }
  }, [open, editorData]);

  const teams = useMemo(
    () =>
      editorData
        ? {
            home: editorData.homeTeam,
            away: editorData.awayTeam,
          }
        : null,
    [editorData],
  );

  const availableLineups = editorData?.availableLineups ?? [];

  const stateByTab = {
    home: homeState,
    away: awayState,
  };

  const setStateByTab = {
    home: setHomeState,
    away: setAwayState,
  };
  const handleTemplateChange = (teamKey: "home" | "away", lineupId: string) => {
    const template = availableLineups.find((item) => item.id === lineupId);
    if (!template) {
      return;
    }

    const setTeamState = setStateByTab[teamKey];
    setTeamState((previous) => {
      const currentStarterIds = previous.slots
        .map((slot) => slot.playerId)
        .filter((playerId): playerId is string => Boolean(playerId));

      const nextSlots = cloneTemplateSlots(template.slots).map(
        (slot, index) => ({
          ...slot,
          playerId: currentStarterIds[index],
        }),
      );
      const assignedIds = new Set(
        nextSlots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is string => Boolean(playerId)),
      );

      return {
        lineupTemplateId: template.id,
        lineupName: template.name,
        slots: nextSlots,
        substituteIds: previous.substituteIds.filter(
          (playerId) => !assignedIds.has(playerId),
        ),
        selectedSlotId: null,
      };
    });
  };

  const handleSlotSelect = (teamKey: "home" | "away", slotId: string) => {
    setStateByTab[teamKey]((previous) => ({
      ...previous,
      selectedSlotId: previous.selectedSlotId === slotId ? null : slotId,
    }));
  };

  const handleAssignPlayer = (
    teamKey: "home" | "away",
    slotId: string,
    playerId: string,
  ) => {
    setStateByTab[teamKey]((previous) => ({
      ...previous,
      slots: previous.slots.map((slot) =>
        slot.id === slotId
          ? { ...slot, playerId }
          : slot.playerId === playerId
            ? { ...slot, playerId: undefined }
            : slot,
      ),
      substituteIds: previous.substituteIds.filter((id) => id !== playerId),
    }));
  };

  const handleClearSlot = (teamKey: "home" | "away", slotId: string) => {
    setStateByTab[teamKey]((previous) => ({
      ...previous,
      slots: previous.slots.map((slot) =>
        slot.id === slotId ? { ...slot, playerId: undefined } : slot,
      ),
    }));
  };

  const handleSave = async () => {
    if (!gameId || !teams) {
      return;
    }
    const lineupsToSave = (["home", "away"] as const).reduce<
      {
        clubId: Id<"clubs">;
        lineupTemplateId?: string;
        formation?: string;
        slots: {
          id: string;
          x: number;
          y: number;
          role: "goalkeeper" | "outfield";
          playerId?: Id<"players">;
        }[];
        starterPlayerIds: Id<"players">[];
        substitutePlayerIds: Id<"players">[];
      }[]
    >((acc, teamKey) => {
      const team = teams[teamKey];
      const state = stateByTab[teamKey];

      if (!team.canEdit || !state.lineupTemplateId) {
        return acc;
      }

      acc.push({
        clubId: team.clubId as Id<"clubs">,
        lineupTemplateId: state.lineupTemplateId || undefined,
        formation: state.lineupName.trim() || undefined,
        slots: state.slots.map((slot) => ({
          id: slot.id,
          x: slot.x,
          y: slot.y,
          role: slot.role,
          ...(slot.playerId
            ? { playerId: slot.playerId as Id<"players"> }
            : {}),
        })),
        starterPlayerIds: state.slots
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is string =>
            Boolean(playerId),
          ) as Id<"players">[],
        substitutePlayerIds: state.substituteIds as Id<"players">[],
      });

      return acc;
    }, []);

    if (lineupsToSave.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await saveEditorData({
        gameId: gameId as Id<"games">,
        lineups: lineupsToSave,
      });
      toast.success(t("games.lineups.saved"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTeamPanel = (teamKey: "home" | "away") => {
    if (!teams) {
      return null;
    }

    const team = teams[teamKey];
    const state = stateByTab[teamKey];
    const fieldLineup = buildFieldLineup(team, state);
    const selectedSlotData = buildAvailablePlayersForSlot(team, state);
    const selectedSlot = selectedSlotData.selectedSlot;
    const selectedPlayer = selectedSlotData.selectedSlot?.playerId
      ? selectedSlotData.players.find(
          (player) => player._id === selectedSlotData.selectedSlot?.playerId,
        )
      : undefined;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("games.lineups.template")}
          </label>
          <Select
            value={state.lineupTemplateId}
            onValueChange={(value) => handleTemplateChange(teamKey, value)}
            disabled={
              !team.canEdit || isSaving || availableLineups.length === 0
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("games.lineups.templatePlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              {availableLineups.map((lineup) => (
                <SelectItem key={lineup.id} value={lineup.id}>
                  {lineup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableLineups.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            {t("games.lineups.emptyTemplates")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative mx-auto w-full max-w-[320px] overflow-visible">
              <FootballField
                lineup={fieldLineup}
                selectedSlotId={state.selectedSlotId}
                onSlotClick={
                  team.canEdit
                    ? (slotId) => handleSlotSelect(teamKey, slotId)
                    : undefined
                }
              />

              {team.canEdit && selectedSlot && (
                <div
                  className="absolute z-30 w-[240px] rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85"
                  style={getSlotPickerStyle(selectedSlot)}
                >
                  <Command className="rounded-lg border bg-background">
                    <CommandInput
                      autoFocus
                      placeholder={t("games.lineups.playerPlaceholder")}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("games.lineups.emptyRoster")}
                      </CommandEmpty>
                      {selectedSlotData.players.map((player) => (
                        <CommandItem
                          key={player._id}
                          value={[
                            player.playerName,
                            player.lastName,
                            player.cometNumber,
                            player.position,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() => {
                            handleAssignPlayer(
                              teamKey,
                              selectedSlot.id,
                              player._id,
                            );
                            setStateByTab[teamKey]((previous) => ({
                              ...previous,
                              selectedSlotId: null,
                            }));
                          }}
                        >
                          {player.photoUrl ? (
                            <Image
                              src={player.photoUrl}
                              alt={player.playerName}
                              width={28}
                              height={28}
                              className="size-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                              {player.lastName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {player.playerName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {player.cometNumber ?? "—"} ·{" "}
                              {player.position ?? "—"}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>

                  {selectedSlot.playerId && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          handleClearSlot(teamKey, selectedSlot.id);
                          setStateByTab[teamKey]((previous) => ({
                            ...previous,
                            selectedSlotId: null,
                          }));
                        }}
                        disabled={isSaving}
                      >
                        {t("games.lineups.clearSlot")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>{t("games.lineups.configure")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
          {!teams ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t("actions.loading")}
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "home" | "away")}
              className="flex h-full min-h-0 flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-full border bg-muted/30 p-1">
                <TabsTrigger
                  value="home"
                  className="mr-0 min-w-0 rounded-full px-3 py-2 text-sm"
                >
                  <TeamBadge
                    name={teams.home.teamName}
                    logoUrl={teams.home.teamLogoUrl}
                    formation={homeState.lineupName}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="away"
                  className="mr-0 min-w-0 rounded-full px-3 py-2 text-sm"
                >
                  <TeamBadge
                    name={teams.away.teamName}
                    logoUrl={teams.away.teamLogoUrl}
                    formation={awayState.lineupName}
                  />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="mt-4 min-h-0 flex-1">
                {renderTeamPanel("home")}
              </TabsContent>
              <TabsContent value="away" className="mt-4 min-h-0 flex-1">
                {renderTeamPanel("away")}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("actions.close")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              isSaving ||
              !teams ||
              !(["home", "away"] as const).some((teamKey) => {
                const team = teams[teamKey];
                const state = stateByTab[teamKey];
                return team.canEdit && Boolean(state.lineupTemplateId);
              }) ||
              availableLineups.length === 0
            }
          >
            {isSaving ? t("actions.loading") : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
