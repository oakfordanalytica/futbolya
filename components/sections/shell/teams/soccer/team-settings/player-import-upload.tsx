"use client";

import { useRef } from "react";
import Image from "next/image";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { MAX_IMPORT_PLAYERS } from "@/lib/players/import-limits";

const REGISTRATION_TEMPLATE =
  "PLANILLAS DE INSCRIPCION Y FOTOS TORNEO DE LAS AMERICAS 2026.xlsx";
const REGISTRATION_TEMPLATE_URL = `/${encodeURIComponent(REGISTRATION_TEMPLATE)}`;

interface PlayerImportUploadProps {
  fileName: string;
  busy: boolean;
  hasSheet: boolean;
  error: string;
  onChooseFile: (file?: File) => Promise<void>;
}

export function PlayerImportUpload({
  fileName,
  busy,
  hasSheet,
  error,
  onChooseFile,
}: PlayerImportUploadProps) {
  const t = useTranslations("Common");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileError = !hasSheet && Boolean(error);
  const reading = busy && !hasSheet;
  const label = t(
    fileName ? "playerImport.replaceFile" : "playerImport.chooseFile",
  );

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <a
        href={REGISTRATION_TEMPLATE_URL}
        download={REGISTRATION_TEMPLATE}
        aria-label={t("playerImport.downloadTemplate")}
        className="w-24 shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-32"
      >
        <Image
          src="/imgplanilla.png"
          alt={t("playerImport.templatePreview")}
          width={1866}
          height={2098}
          sizes="(min-width: 640px) 128px, 96px"
          unoptimized
          className="h-auto w-full rounded-md border"
        />
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          ref={inputRef}
          id="player-import-file"
          aria-label={t("playerImport.file")}
          type="file"
          accept=".xlsx"
          hidden
          disabled={busy}
          onChange={(event) => {
            void onChooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Attachment
          className="w-full min-w-0"
          state={
            reading
              ? "processing"
              : fileError
                ? "error"
                : hasSheet
                  ? "done"
                  : "idle"
          }
          aria-busy={reading}
        >
          <AttachmentMedia>
            {fileName ? <FileSpreadsheet /> : <Upload />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle title={fileName || label}>
              {fileName || label}
            </AttachmentTitle>
            <AttachmentDescription>
              {reading
                ? t("actions.loading")
                : fileError
                  ? t("playerImport.fileNeedsCorrection")
                  : fileName
                    ? t("playerImport.replaceFile")
                    : t("playerImport.fileFormat")}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger
            aria-label={label}
            aria-describedby="player-import-file-help"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer disabled:cursor-wait"
          />
        </Attachment>
        <p
          id="player-import-file-help"
          className="text-sm text-muted-foreground"
        >
          {t.rich("playerImport.fileHelp", {
            max: MAX_IMPORT_PLAYERS,
            template: (chunks) => (
              <a
                href={REGISTRATION_TEMPLATE_URL}
                download={REGISTRATION_TEMPLATE}
                className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
