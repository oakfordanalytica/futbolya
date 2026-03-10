"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GAME_EVENT_TYPE_ICONS,
  GAME_EVENT_TYPES,
  type GameEventType,
} from "@/lib/games/event-types";
import { PlayerPicker } from "./player-picker";

interface GameEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string | null;
}

type EditorPlayer = {
  _id: string;
  clubId: string;
  teamName: string;
  playerName: string;
  jerseyNumber?: number;
  cometNumber?: string;
};

type EventDraft = {
  id: string;
  eventType: GameEventType;
  playerId: string;
  relatedPlayerId: string;
};

type ClubState = {
  clubId: string;
  onFieldPlayerIds: string[];
};

function createDraftId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

function createEventDraft(): EventDraft {
  return {
    id: createDraftId(),
    eventType: "goal",
    playerId: "",
    relatedPlayerId: "",
  };
}

function buildEffectiveOnFieldState(
  baseClubStates: ClubState[],
  draftEvents: EventDraft[],
  draftIndex: number,
) {
  const clubStateMap = new Map<string, Set<string>>(
    baseClubStates.map((clubState) => [
      clubState.clubId,
      new Set(clubState.onFieldPlayerIds),
    ]),
  );

  for (const draft of draftEvents.slice(0, draftIndex)) {
    if (
      draft.eventType !== "substitution" ||
      !draft.playerId ||
      !draft.relatedPlayerId
    ) {
      continue;
    }

    for (const onFieldIds of clubStateMap.values()) {
      if (
        onFieldIds.has(draft.playerId) ||
        onFieldIds.has(draft.relatedPlayerId)
      ) {
        onFieldIds.delete(draft.playerId);
        onFieldIds.add(draft.relatedPlayerId);
        break;
      }
    }
  }

  return clubStateMap;
}

function EventDraftFields({
  draft,
  index,
  players,
  clubStates,
  onChange,
  onRemove,
  canRemove,
  disabled,
  t,
}: {
  draft: EventDraft;
  index: number;
  players: EditorPlayer[];
  clubStates: ClubState[];
  onChange: (nextDraft: EventDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  const isSubstitution = draft.eventType === "substitution";
  const onFieldPlayerIds = useMemo(
    () =>
      new Set(clubStates.flatMap((clubState) => clubState.onFieldPlayerIds)),
    [clubStates],
  );
  const selectablePlayers = useMemo(() => {
    return players.filter((player) => {
      const clubState = clubStates.find(
        (candidate) => candidate.clubId === player.clubId,
      );

      if (!clubState || clubState.onFieldPlayerIds.length === 0) {
        return true;
      }

      return onFieldPlayerIds.has(player._id);
    });
  }, [clubStates, onFieldPlayerIds, players]);
  const selectedPlayer = useMemo(
    () =>
      selectablePlayers.find((player) => player._id === draft.playerId) ??
      players.find((player) => player._id === draft.playerId) ??
      null,
    [draft.playerId, players, selectablePlayers],
  );

  const relatedPlayerOptions = useMemo(() => {
    if (!selectedPlayer) {
      return [];
    }

    const currentClubOnFieldIds =
      clubStates.find((clubState) => clubState.clubId === selectedPlayer.clubId)
        ?.onFieldPlayerIds ?? [];
    const currentClubOnFieldSet = new Set(currentClubOnFieldIds);

    return players.filter(
      (player) =>
        player.clubId === selectedPlayer.clubId &&
        player._id !== selectedPlayer._id &&
        (currentClubOnFieldIds.length === 0 ||
          !currentClubOnFieldSet.has(player._id)),
    );
  }, [clubStates, players, selectedPlayer]);

  useEffect(() => {
    if (
      draft.playerId &&
      !selectablePlayers.some((player) => player._id === draft.playerId)
    ) {
      onChange({
        ...draft,
        playerId: "",
        relatedPlayerId: "",
      });
      return;
    }

    if (!isSubstitution && draft.relatedPlayerId) {
      onChange({ ...draft, relatedPlayerId: "" });
      return;
    }

    if (
      draft.relatedPlayerId &&
      !relatedPlayerOptions.some(
        (player) => player._id === draft.relatedPlayerId,
      )
    ) {
      onChange({ ...draft, relatedPlayerId: "" });
    }
  }, [
    draft,
    draft.relatedPlayerId,
    isSubstitution,
    onChange,
    relatedPlayerOptions,
  ]);

  const summary = selectedPlayer
    ? `${t(`games.events.typeOptions.${draft.eventType}`)} · ${
        selectedPlayer.playerName
      }`
    : t(`games.events.typeOptions.${draft.eventType}`);

  return (
    <AccordionItem value={draft.id}>
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex min-w-0 flex-col items-start">
          <span className="text-sm font-semibold">
            {t("games.events.eventLabel", { number: index + 1 })}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {GAME_EVENT_TYPE_ICONS[draft.eventType]} {summary}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>{t("games.events.type")}</FieldLabel>
            <Select
              value={draft.eventType}
              onValueChange={(value) =>
                onChange({
                  ...draft,
                  eventType: value as GameEventType,
                  relatedPlayerId:
                    value === "substitution" ? draft.relatedPlayerId : "",
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("games.events.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent align="start">
                {GAME_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">
                        {GAME_EVENT_TYPE_ICONS[type]}
                      </span>
                      <span>{t(`games.events.typeOptions.${type}`)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              {isSubstitution
                ? t("games.events.outgoingPlayer")
                : t("games.events.player")}
            </FieldLabel>
            <PlayerPicker
              players={selectablePlayers}
              value={draft.playerId}
              onChange={(playerId) =>
                onChange({
                  ...draft,
                  playerId,
                  relatedPlayerId: "",
                })
              }
              placeholder={
                isSubstitution
                  ? t("games.events.outgoingPlayerPlaceholder")
                  : t("games.events.playerPlaceholder")
              }
              searchPlaceholder={
                isSubstitution
                  ? t("games.events.outgoingPlayerSearch")
                  : t("games.events.playerSearch")
              }
              emptyMessage={
                isSubstitution
                  ? t("games.events.outgoingPlayerEmpty")
                  : t("games.events.playerEmpty")
              }
              disabled={disabled}
            />
          </Field>

          {isSubstitution ? (
            <Field>
              <FieldLabel>{t("games.events.incomingPlayer")}</FieldLabel>
              <PlayerPicker
                players={relatedPlayerOptions}
                value={draft.relatedPlayerId}
                onChange={(relatedPlayerId) =>
                  onChange({
                    ...draft,
                    relatedPlayerId,
                  })
                }
                placeholder={t("games.events.incomingPlayerPlaceholder")}
                searchPlaceholder={t("games.events.incomingPlayerSearch")}
                emptyMessage={
                  selectedPlayer
                    ? t("games.events.incomingPlayerEmpty")
                    : t("games.events.incomingPlayerSelectPlayerFirst")
                }
                disabled={disabled || !selectedPlayer}
              />
            </Field>
          ) : null}

          {canRemove ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                onClick={onRemove}
                disabled={disabled}
              >
                <Trash2 className="size-3.5" />
                {t("games.events.remove")}
              </Button>
            </div>
          ) : null}
        </FieldGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

export function GameEventDialog({
  open,
  onOpenChange,
  gameId,
}: GameEventDialogProps) {
  const t = useTranslations("Common");
  const editorData = useQuery(
    api.gameEvents.getEditorData,
    open && gameId ? { gameId: gameId as Id<"games"> } : "skip",
  );
  const registerBatch = useMutation(api.gameEvents.registerBatch);

  const [minute, setMinute] = useState("");
  const [draftEvents, setDraftEvents] = useState<EventDraft[]>([
    createEventDraft(),
  ]);
  const [openItem, setOpenItem] = useState<string | undefined>(
    draftEvents[0].id,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      const initialDraft = createEventDraft();
      setMinute("");
      setDraftEvents([initialDraft]);
      setOpenItem(initialDraft.id);
    }
  }, [open]);

  const isValid =
    minute.trim().length > 0 &&
    Number.isFinite(Number(minute)) &&
    Number(minute) >= 1 &&
    Number(minute) <= 130 &&
    draftEvents.length > 0 &&
    draftEvents.every(
      (draft) =>
        draft.playerId.length > 0 &&
        (draft.eventType !== "substitution" ||
          draft.relatedPlayerId.length > 0),
    );

  const handleUpdateDraft = (id: string, nextDraft: EventDraft) => {
    setDraftEvents((previous) =>
      previous.map((draft) => (draft.id === id ? nextDraft : draft)),
    );
  };

  const handleAddDraft = () => {
    const nextDraft = createEventDraft();
    setDraftEvents((previous) => [...previous, nextDraft]);
    setOpenItem(nextDraft.id);
  };

  const handleRemoveDraft = (id: string) => {
    setDraftEvents((previous) => {
      if (previous.length === 1) {
        const replacement = createEventDraft();
        setOpenItem(replacement.id);
        return [replacement];
      }

      const nextDrafts = previous.filter((draft) => draft.id !== id);
      if (openItem === id) {
        setOpenItem(nextDrafts[0]?.id);
      }
      return nextDrafts;
    });
  };

  const handleSubmit = async () => {
    if (!gameId || !isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerBatch({
        gameId: gameId as Id<"games">,
        minute: Number(minute),
        events: draftEvents.map((draft) => ({
          playerId: draft.playerId as Id<"players">,
          relatedPlayerId:
            draft.eventType === "substitution" && draft.relatedPlayerId
              ? (draft.relatedPlayerId as Id<"players">)
              : undefined,
          eventType: draft.eventType,
        })),
      });
      toast.success(t("games.events.saved"));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveClubStatesByDraft = useMemo(
    () =>
      draftEvents.map((_, index) =>
        buildEffectiveOnFieldState(
          editorData?.clubStates ?? [],
          draftEvents,
          index,
        ),
      ),
    [draftEvents, editorData?.clubStates],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("games.events.register")}</DialogTitle>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>{t("games.events.minute")}</FieldLabel>
            <Input
              type="number"
              min={1}
              max={130}
              value={minute}
              onChange={(event) => setMinute(event.target.value)}
              placeholder={t("games.events.minutePlaceholder")}
            />
          </Field>

          <div className="space-y-3">
            <Accordion
              type="single"
              collapsible
              value={openItem}
              onValueChange={setOpenItem}
              className="rounded-lg border"
            >
              {draftEvents.map((draft, index) => (
                <EventDraftFields
                  key={draft.id}
                  draft={draft}
                  index={index}
                  players={editorData?.players ?? []}
                  clubStates={Array.from(
                    effectiveClubStatesByDraft[index]?.entries() ?? [],
                  ).map(([clubId, onFieldIds]) => ({
                    clubId,
                    onFieldPlayerIds: Array.from(onFieldIds),
                  }))}
                  onChange={(nextDraft) =>
                    handleUpdateDraft(draft.id, nextDraft)
                  }
                  onRemove={() => handleRemoveDraft(draft.id)}
                  canRemove={draftEvents.length > 1}
                  disabled={isSubmitting || editorData === undefined}
                  t={t}
                />
              ))}
            </Accordion>

            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={handleAddDraft}
                disabled={isSubmitting || editorData === undefined}
              >
                <Plus className="size-3.5" />
                {t("games.events.addAnother")}
              </Button>
            </div>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("actions.close")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || editorData === undefined}
          >
            {isSubmitting ? t("actions.loading") : t("games.events.register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
