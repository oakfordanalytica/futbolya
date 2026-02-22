"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileIcon,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Plus,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  APPLICATION_DOCUMENTS,
  type DocumentType,
  type DocumentVisibility,
  type ApplicationDocumentWithUser,
  type DocumentConfig,
} from "@/lib/applications/document-types";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useIsAdmin } from "@/hooks/use-is-admin";

interface ApplicationDocumentsProps {
  applicationId: Id<"applications">;
  documents: ApplicationDocumentWithUser[];
  documentConfigs: DocumentConfig[];
  onUpload: (args: {
    applicationId: Id<"applications">;
    documentTypeId: string;
    name: string;
    description?: string;
    storageId: Id<"_storage">;
    fileName: string;
    contentType: string;
    fileSize: number;
  }) => Promise<Id<"applicationDocuments">>;
  onUpdateStatus: (args: {
    documentId: Id<"applicationDocuments">;
    status: "approved" | "rejected";
    rejectionReason?: string;
  }) => Promise<null>;
  onUpdateVisibility: (args: {
    applicationId: Id<"applications">;
    documentTypeId: string;
    visibility: DocumentVisibility;
  }) => Promise<Id<"applicationDocumentConfig">>;
  onGenerateUploadUrl: () => Promise<string>;
  onRemove: (args: { documentId: Id<"applicationDocuments"> }) => Promise<null>;
  onCreateCustomDocumentType: (args: {
    applicationId: Id<"applications">;
    name: string;
    description?: string;
    required: boolean;
  }) => Promise<Id<"applicationDocumentConfig">>;
  onUpdateCustomDocumentType: (args: {
    configId: Id<"applicationDocumentConfig">;
    name: string;
    description?: string;
    required: boolean;
  }) => Promise<null>;
  onDeleteCustomDocumentType: (args: {
    configId: Id<"applicationDocumentConfig">;
  }) => Promise<null>;
}

interface DocumentActionsProps {
  isAddingDocument: boolean;
  setIsAddingDocument: (value: boolean) => void;
}

function DocumentActions({
  isAddingDocument,
  setIsAddingDocument,
}: DocumentActionsProps) {
  const t = useTranslations("Applications.documents");
  const { isAdmin } = useIsAdmin();

  if (!isAdmin) return null;

  return (
    <div className="flex items-center justify-end">
      <Button
        size="sm"
        variant={isAddingDocument ? "outline" : "default"}
        onClick={() => setIsAddingDocument(!isAddingDocument)}
      >
        {isAddingDocument ? (
          <span className="hidden md:inline">{t("actions.cancel")}</span>
        ) : (
          <>
            <Plus />
            <span className="hidden md:inline">{t("actions.addDocument")}</span>
          </>
        )}
      </Button>
    </div>
  );
}

interface AddDocumentFormProps {
  applicationId: Id<"applications">;
  onAddDocument: (document: {
    name: string;
    description?: string;
    required: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

function AddDocumentForm({
  applicationId,
  onAddDocument,
  onClose,
}: AddDocumentFormProps) {
  const t = useTranslations("Applications.documents");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: "",
    description: "",
    required: false,
  });

  const handleAdd = async () => {
    if (!newDocument.name) return;

    setIsSubmitting(true);
    try {
      await onAddDocument({
        name: newDocument.name,
        description: newDocument.description || undefined,
        required: newDocument.required,
      });

      setNewDocument({ name: "", description: "", required: false });
      onClose();
    } catch (error) {
      console.error("Failed to add document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document-name">{t("form.documentName")}</Label>
            <Input
              id="document-name"
              placeholder={t("form.documentNamePlaceholder")}
              value={newDocument.name}
              onChange={(e) =>
                setNewDocument({ ...newDocument, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-description">
              {t("form.description")}
            </Label>
            <Input
              id="document-description"
              placeholder={t("form.descriptionPlaceholder")}
              value={newDocument.description}
              onChange={(e) =>
                setNewDocument({ ...newDocument, description: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="document-required"
              checked={newDocument.required}
              onChange={(e) =>
                setNewDocument({ ...newDocument, required: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="document-required" className="cursor-pointer">
              {t("form.required")}
            </Label>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full"
          disabled={isSubmitting || !newDocument.name}
        >
          {isSubmitting ? t("form.adding") : t("form.addButton")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ApplicationDocuments({
  applicationId,
  documents,
  documentConfigs,
  onUpload,
  onUpdateStatus,
  onUpdateVisibility,
  onGenerateUploadUrl,
  onRemove,
  onCreateCustomDocumentType,
  onUpdateCustomDocumentType,
  onDeleteCustomDocumentType,
}: ApplicationDocumentsProps) {
  const t = useTranslations("Applications.documents");
  const { isAdmin } = useIsAdmin();
  const [isAddingDocument, setIsAddingDocument] = useState(false);

  // Extract custom document types from configs with their configId
  const customDocumentsWithConfig = documentConfigs
    .filter((config) => config.isCustom && config.name)
    .map((config) => ({
      id: config.documentTypeId,
      name: config.name!,
      description: config.description,
      required: config.visibility === "required",
      configId: config._id,
    }));

  const customDocuments: DocumentType[] = customDocumentsWithConfig.map(
    ({ configId, ...doc }) => doc,
  );

  const getCustomConfigId = (
    documentTypeId: string,
  ): Id<"applicationDocumentConfig"> | null => {
    const custom = customDocumentsWithConfig.find(
      (c) => c.id === documentTypeId,
    );
    return custom?.configId ?? null;
  };

  const isCustomDocument = (documentTypeId: string): boolean => {
    return customDocumentsWithConfig.some((c) => c.id === documentTypeId);
  };

  const allDocuments = [...APPLICATION_DOCUMENTS, ...customDocuments];

  const handleAddDocument = async (document: {
    name: string;
    description?: string;
    required: boolean;
  }) => {
    await onCreateCustomDocumentType({
      applicationId,
      name: document.name,
      description: document.description,
      required: document.required,
    });
  };

  const getDocumentVisibility = (
    documentType: DocumentType,
  ): DocumentVisibility => {
    const config = documentConfigs.find(
      (c) => c.documentTypeId === documentType.id,
    );
    if (config) {
      return config.visibility;
    }
    return documentType.required ? "required" : "optional";
  };

  const getUploadedDocument = (
    documentTypeId: string,
  ): ApplicationDocumentWithUser | null => {
    return (
      documents.find((doc) => doc.documentTypeId === documentTypeId) || null
    );
  };

  const visibleDocuments = allDocuments.filter((doc) => {
    const visibility = getDocumentVisibility(doc);
    if (visibility === "hidden" && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <DocumentActions
        isAddingDocument={isAddingDocument}
        setIsAddingDocument={setIsAddingDocument}
      />
      {isAddingDocument && (
        <AddDocumentForm
          applicationId={applicationId}
          onAddDocument={handleAddDocument}
          onClose={() => setIsAddingDocument(false)}
        />
      )}
      {visibleDocuments.map((document) => (
        <DocumentCard
          key={document.id}
          applicationId={applicationId}
          document={document}
          uploadedDocument={getUploadedDocument(document.id)}
          visibility={getDocumentVisibility(document)}
          isCustom={isCustomDocument(document.id)}
          customConfigId={getCustomConfigId(document.id)}
          onUpload={onUpload}
          onUpdateStatus={onUpdateStatus}
          onUpdateVisibility={onUpdateVisibility}
          onGenerateUploadUrl={onGenerateUploadUrl}
          onRemove={onRemove}
          onUpdateCustomDocumentType={onUpdateCustomDocumentType}
          onDeleteCustomDocumentType={onDeleteCustomDocumentType}
        />
      ))}
    </div>
  );
}

interface DocumentCardProps {
  applicationId: Id<"applications">;
  document: DocumentType;
  uploadedDocument: ApplicationDocumentWithUser | null;
  visibility: DocumentVisibility;
  isCustom: boolean;
  customConfigId: Id<"applicationDocumentConfig"> | null;
  onUpload: ApplicationDocumentsProps["onUpload"];
  onUpdateStatus: ApplicationDocumentsProps["onUpdateStatus"];
  onUpdateVisibility: ApplicationDocumentsProps["onUpdateVisibility"];
  onGenerateUploadUrl: ApplicationDocumentsProps["onGenerateUploadUrl"];
  onRemove: ApplicationDocumentsProps["onRemove"];
  onUpdateCustomDocumentType: ApplicationDocumentsProps["onUpdateCustomDocumentType"];
  onDeleteCustomDocumentType: ApplicationDocumentsProps["onDeleteCustomDocumentType"];
}

function DocumentCard({
  applicationId,
  document,
  uploadedDocument,
  visibility,
  isCustom,
  customConfigId,
  onUpload,
  onUpdateStatus,
  onUpdateVisibility,
  onGenerateUploadUrl,
  onRemove,
  onUpdateCustomDocumentType,
  onDeleteCustomDocumentType,
}: DocumentCardProps) {
  const t = useTranslations("Applications.documents");
  const { isAdmin } = useIsAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [visibilityPopoverOpen, setVisibilityPopoverOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: document.name,
    description: document.description || "",
    required: visibility === "required",
  });

  const canDelete = !!uploadedDocument;

  const handleEditSave = async () => {
    if (!customConfigId || !editForm.name) return;
    setIsSavingEdit(true);
    try {
      await onUpdateCustomDocumentType({
        configId: customConfigId,
        name: editForm.name,
        description: editForm.description || undefined,
        required: editForm.required,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update document type:", error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteType = async () => {
    if (!customConfigId) return;
    try {
      await onDeleteCustomDocumentType({ configId: customConfigId });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete document type:", error);
    }
  };

  const handleRemove = async () => {
    if (!uploadedDocument) return;
    try {
      await onRemove({ documentId: uploadedDocument._id });
    } catch (error) {
      console.error("Failed to remove document:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadUrl = await onGenerateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      await onUpload({
        applicationId,
        documentTypeId: document.id,
        name: document.name,
        description: document.description,
        storageId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleVisibilityChange = async (newVisibility: DocumentVisibility) => {
    try {
      await onUpdateVisibility({
        applicationId,
        documentTypeId: document.id,
        visibility: newVisibility,
      });
      setVisibilityPopoverOpen(false);
    } catch (error) {
      console.error("Failed to update visibility:", error);
    }
  };

  const getVisibilityBadge = () => {
    const variants: Record<
      DocumentVisibility,
      { variant: "secondary" | "outline"; className?: string }
    > = {
      required: { variant: "secondary" },
      optional: { variant: "outline" },
      hidden: {
        variant: "outline",
        className: "bg-muted text-muted-foreground",
      },
    };

    const config = variants[visibility];

    if (isAdmin) {
      return (
        <Popover
          open={visibilityPopoverOpen}
          onOpenChange={setVisibilityPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Badge
              variant={config.variant}
              className={cn(
                "text-xs cursor-pointer hover:bg-accent",
                config.className,
              )}
            >
              {t(`visibility.${visibility}`)}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="end">
            <div className="flex flex-col gap-1">
              <Button
                variant={visibility === "required" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => handleVisibilityChange("required")}
              >
                {t("visibility.required")}
              </Button>
              <Button
                variant={visibility === "optional" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => handleVisibilityChange("optional")}
              >
                {t("visibility.optional")}
              </Button>
              <Button
                variant={visibility === "hidden" ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => handleVisibilityChange("hidden")}
              >
                {t("visibility.hidden")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Badge
        variant={config.variant}
        className={cn("text-xs", config.className)}
      >
        {t(`visibility.${visibility}`)}
      </Badge>
    );
  };

  const getStatusBadge = () => {
    if (!uploadedDocument) {
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3" />
          {t("status.notUploaded")}
        </Badge>
      );
    }

    switch (uploadedDocument.status) {
      case "approved":
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
          >
            <CheckCircle2 className="h-3 w-3" />
            {t("status.approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t("status.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            {t("status.pending")}
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        uploadedDocument?.status === "rejected" && "border-destructive",
        visibility === "hidden" && "bg-muted/50",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{document.name}</CardTitle>
              {getVisibilityBadge()}
            </div>
            {document.description && (
              <CardDescription className="mt-1 text-sm">
                {document.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isAdmin && isCustom && customConfigId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={t("actions.moreOptions")}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="h-4 w-4" />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("actions.deleteType")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.editDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("form.documentName")}</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("form.description")}</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-required"
                checked={editForm.required}
                onChange={(e) =>
                  setEditForm({ ...editForm, required: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-required" className="cursor-pointer">
                {t("form.required")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isSavingEdit || !editForm.name}
            >
              {isSavingEdit
                ? t("actions.editDialog.saving")
                : t("actions.editDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Type Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {t("actions.deleteTypeDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.deleteTypeDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              {t("actions.deleteTypeDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteType}>
              {t("actions.deleteTypeDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="space-y-3">
        {uploadedDocument && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {uploadedDocument.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("uploadedBy", {
                    date: formatDate(uploadedDocument.uploadedAt),
                    name: uploadedDocument.uploadedByUser
                      ? `${uploadedDocument.uploadedByUser.firstName} ${uploadedDocument.uploadedByUser.lastName}`
                      : "Unknown",
                  })}
                </span>
              </div>
            </div>
            {uploadedDocument.url && (
              <Button size="sm" variant="ghost" className="gap-1" asChild>
                <a
                  href={uploadedDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4" />
                  {t("actions.view")}
                </a>
              </Button>
            )}
          </div>
        )}

        {uploadedDocument?.status === "rejected" &&
          uploadedDocument.rejectionReason && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                <strong>{t("rejectionReason")}:</strong>{" "}
                {uploadedDocument.rejectionReason}
              </p>
            </div>
          )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="file"
              id={`file-${document.id}`}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <Button
              asChild
              size="sm"
              className="w-full cursor-pointer"
              disabled={isUploading}
            >
              <label htmlFor={`file-${document.id}`} className="cursor-pointer">
                <Upload />
                {isUploading
                  ? "Uploading..."
                  : uploadedDocument
                    ? t("actions.replace")
                    : t("actions.upload")}
              </label>
            </Button>
          </div>

          {isAdmin && uploadedDocument && (
            <>
              {uploadedDocument.status !== "approved" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() =>
                        onUpdateStatus({
                          documentId: uploadedDocument._id,
                          status: "approved",
                        })
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("actions.approve")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {uploadedDocument.status !== "rejected" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        onUpdateStatus({
                          documentId: uploadedDocument._id,
                          status: "rejected",
                          rejectionReason:
                            "Document quality is not sufficient. Please upload a clearer version.",
                        })
                      }
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("actions.reject")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          {canDelete && (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.delete")}</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                    <Trash2 />
                  </AlertDialogMedia>
                  <AlertDialogTitle>
                    {t("actions.deleteDialog.title")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("actions.deleteDialog.description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline">
                    {t("actions.deleteDialog.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleRemove}
                  >
                    {t("actions.deleteDialog.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
