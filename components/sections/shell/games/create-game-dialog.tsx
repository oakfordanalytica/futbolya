"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GameLineupsDialog } from "./game-detail/game-lineups-dialog";
import { GameForm } from "./create-game-dialog/game-form";
import { GameTypeSelectionStep } from "./create-game-dialog/game-type-selection-step";
import { useCreateGameDialogController } from "./create-game-dialog/use-create-game-dialog-controller";
import type { CreateGameDialogProps } from "./create-game-dialog/types";

export function CreateGameDialog(props: CreateGameDialogProps) {
  const controller = useCreateGameDialogController(props);

  return (
    <Dialog open={controller.open} onOpenChange={controller.handleOpenChange}>
      <>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {!controller.isEditMode && controller.gameType === null ? (
            <GameTypeSelectionStep
              hasActiveSeasons={controller.hasActiveSeasons}
              onSelect={controller.setGameType}
              onCancel={() => controller.handleOpenChange(false)}
            />
          ) : (
            <GameForm controller={controller} />
          )}
        </DialogContent>

        <GameLineupsDialog
          open={Boolean(controller.lineupsGameId)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              controller.closeLineupsDialog();
            }
          }}
          gameId={controller.lineupsGameId}
        />
      </>
    </Dialog>
  );
}
