"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

interface PlayerBioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: Id<"players">;
  initialTitle?: string | null;
  initialContent?: string | null;
}

export function PlayerBioDialog({
  open,
  onOpenChange,
  playerId,
  initialTitle,
  initialContent,
}: PlayerBioDialogProps) {
  const t = useTranslations("Common");
  const updatePlayerBio = useMutation(api.players.updatePlayerBio);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(initialTitle ?? "");
    setContent(initialContent ?? "");
  }, [open, initialTitle, initialContent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await updatePlayerBio({
        playerId,
        bioTitle: title,
        bioContent: content,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("actions.edit")} {t("players.bio")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>{t("players.bioTitle")}</FieldLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("players.bioTitlePlaceholder")}
                maxLength={120}
              />
            </Field>
            <Field>
              <FieldLabel>{t("players.bioContent")}</FieldLabel>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t("players.bioContentPlaceholder")}
                className="min-h-36 resize-y"
                maxLength={4000}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("actions.loading") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
