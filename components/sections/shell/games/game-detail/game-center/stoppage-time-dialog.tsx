"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface StoppageTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minutes: string;
  onMinutesChange: (minutes: string) => void;
  isSubmitting: boolean;
  onSave: () => void;
}

export function StoppageTimeDialog({
  open,
  onOpenChange,
  minutes,
  onMinutesChange,
  isSubmitting,
  onSave,
}: StoppageTimeDialogProps) {
  const t = useTranslations("Common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("games.center.stoppageDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("games.center.stoppageDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            max={30}
            step={1}
            value={minutes}
            onChange={(event) => onMinutesChange(event.target.value)}
            placeholder="3"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="button" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? t("actions.loading") : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
