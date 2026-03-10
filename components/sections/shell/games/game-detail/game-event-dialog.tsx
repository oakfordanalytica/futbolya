"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GameEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string | null;
}

type EventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "penalty_scored"
  | "penalty_missed";

const EVENT_TYPES: EventType[] = [
  "goal",
  "yellow_card",
  "red_card",
  "penalty_scored",
  "penalty_missed",
];

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
  const registerEvent = useMutation(api.gameEvents.register);

  const [minute, setMinute] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [eventType, setEventType] = useState<EventType>("goal");
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setMinute("");
      setPlayerId("");
      setEventType("goal");
      setPlayerPickerOpen(false);
    }
  }, [open]);

  const selectedPlayer = useMemo(
    () => editorData?.players.find((player) => player._id === playerId) ?? null,
    [editorData?.players, playerId],
  );

  const isValid =
    minute.trim().length > 0 &&
    Number.isFinite(Number(minute)) &&
    Number(minute) >= 1 &&
    Number(minute) <= 130 &&
    playerId.length > 0;

  const handleSubmit = async () => {
    if (!gameId || !isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerEvent({
        gameId: gameId as Id<"games">,
        playerId: playerId as Id<"players">,
        minute: Number(minute),
        eventType,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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

          <Field>
            <FieldLabel>{t("games.events.player")}</FieldLabel>
            <Popover open={playerPickerOpen} onOpenChange={setPlayerPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={playerPickerOpen}
                  className="w-full justify-between"
                >
                  {selectedPlayer ? (
                    <span className="flex min-w-0 flex-col items-start text-left">
                      <span className="truncate font-medium">
                        {selectedPlayer.playerName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {selectedPlayer.teamName}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("games.events.playerPlaceholder")}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("games.events.playerSearch")} />
                  <CommandList>
                    <CommandEmpty>{t("games.events.playerEmpty")}</CommandEmpty>
                    <CommandGroup>
                      {(editorData?.players ?? []).map((player) => (
                        <CommandItem
                          key={player._id}
                          value={`${player.playerName} ${player.teamName} ${
                            player.jerseyNumber ?? ""
                          } ${player.cometNumber ?? ""}`}
                          onSelect={() => {
                            setPlayerId(player._id);
                            setPlayerPickerOpen(false);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {player.playerName}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {player.teamName}
                              {player.jerseyNumber !== undefined
                                ? ` · #${player.jerseyNumber}`
                                : player.cometNumber
                                  ? ` · ${player.cometNumber}`
                                  : ""}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-2 size-4 shrink-0",
                              playerId === player._id ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>

          <Field>
            <FieldLabel>{t("games.events.type")}</FieldLabel>
            <Select
              value={eventType}
              onValueChange={(value) => setEventType(value as EventType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("games.events.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent align="start">
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`games.events.typeOptions.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
