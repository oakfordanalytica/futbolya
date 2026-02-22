"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Authenticated,
  Preloaded,
  usePreloadedQuery,
  useQuery,
  useMutation,
  useAction,
} from "convex/react";
import { Pencil, X, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ApplicationHeader } from "./application-header";
import { ApplicationOverviewCard } from "./pre-admission/application-overview-card";
import { ApplicationSchoolCard } from "./pre-admission/application-school-card";
import { ApplicationParentsCard } from "./pre-admission/application-parents-card";
import { ApplicationAddressCard } from "./pre-admission/application-address-card";
import { ApplicationGeneralCard } from "./pre-admission/application-general-card";
import { ApplicationDocuments } from "./documents/application-documents";
import { ApplicationPayments } from "./payments/application-payments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserIcon } from "@heroicons/react/20/solid";
import { CreditCard, File, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApplicationTransactionHistory } from "./payments/application-transaction-history";
import type { FormData as ApplicationFormData } from "@/lib/applications/types";
import type { TransferUser } from "./application-transfer-dialog";
import { ROUTES } from "@/lib/navigation/routes";
import { useRouter } from "@/i18n/navigation";

interface ApplicationDetailWrapperProps {
  preloadedApplication: Preloaded<typeof api.applications.getById>;
  organizationSlug: string;
  applicationId: string;
  organizationLogoUrl?: string;
  associatedUser: TransferUser | null;
}

function ApplicationDetailContent({
  preloadedApplication,
  organizationSlug,
  applicationId,
  organizationLogoUrl,
  associatedUser,
}: ApplicationDetailWrapperProps) {
  const application = usePreloadedQuery(preloadedApplication);
  const t = useTranslations("Applications");
  const tCommon = useTranslations("Common.actions");
  const { isAdmin } = useIsAdmin();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFormData, setEditedFormData] =
    useState<ApplicationFormData | null>(null);
  const [sectionValidity, setSectionValidity] = useState<
    Record<string, boolean>
  >({
    athlete: true,
    address: true,
    school: true,
    parents: true,
    general: true,
  });

  const isFormValid = Object.values(sectionValidity).every(Boolean);

  const convexApplicationId = applicationId as Id<"applications">;
  const shouldLoadApplicationRelations = application !== null;

  // Fetch fees and transactions from Convex
  const fees = useQuery(
    api.fees.getByApplication,
    shouldLoadApplicationRelations
      ? {
          applicationId: convexApplicationId,
        }
      : "skip",
  );
  const summary = useQuery(
    api.fees.getSummary,
    shouldLoadApplicationRelations
      ? {
          applicationId: convexApplicationId,
        }
      : "skip",
  );
  const transactionsWithFees = useQuery(
    api.transactions.getWithFeeDetails,
    shouldLoadApplicationRelations
      ? {
          applicationId: convexApplicationId,
        }
      : "skip",
  );

  // Fetch documents from Convex
  const documents = useQuery(
    api.documents.getByApplication,
    shouldLoadApplicationRelations
      ? {
          applicationId: convexApplicationId,
        }
      : "skip",
  );
  const documentConfigs = useQuery(
    api.documents.getConfigByApplication,
    shouldLoadApplicationRelations
      ? {
          applicationId: convexApplicationId,
        }
      : "skip",
  );

  // Mutations
  const createFee = useMutation(api.fees.create);
  const createRecurringPlan = useMutation(api.fees.createRecurringPlan);
  const removeFee = useMutation(api.fees.remove);
  const recordManualPayment = useMutation(api.fees.recordManualPayment);
  const updateFee = useMutation(api.fees.update);
  const updateRecurringSeries = useMutation(api.fees.updateRecurringSeries);
  const updateFormData = useMutation(api.applications.updateFormData);

  // Document mutations
  const uploadDocument = useMutation(api.documents.upload);
  const updateDocumentStatus = useMutation(api.documents.updateStatus);
  const updateDocumentVisibility = useMutation(api.documents.updateVisibility);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const removeDocument = useMutation(api.documents.remove);
  const createCustomDocumentType = useMutation(
    api.documents.createCustomDocumentType,
  );
  const updateCustomDocumentType = useMutation(
    api.documents.updateCustomDocumentType,
  );
  const deleteCustomDocumentType = useMutation(
    api.documents.deleteCustomDocumentType,
  );

  // Actions
  const createPaymentLink = useAction(api.square.createPaymentLink);

  // Callback to update edited form data from child cards
  const handleSectionDataChange = useCallback(
    (
      sectionKey: string,
      sectionData: Record<string, string | number | boolean | null>,
    ) => {
      setEditedFormData((prev) => {
        const base = prev ?? application?.formData ?? {};
        return {
          ...base,
          [sectionKey]: {
            ...base[sectionKey],
            ...sectionData,
          },
        };
      });
    },
    [application?.formData],
  );

  // Handler to save edited form data
  const handleSave = async () => {
    if (!editedFormData) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateFormData({
        applicationId: convexApplicationId,
        formData: editedFormData,
      });
      setIsEditing(false);
      setEditedFormData(null);
    } catch (error) {
      console.error("[Applications] Failed to save form data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFormData(null);
    setSectionValidity({
      athlete: true,
      address: true,
      school: true,
      parents: true,
      general: true,
    });
  };

  // Handler to start editing
  const handleStartEdit = () => {
    setEditedFormData(application?.formData ?? null);
    setIsEditing(true);
    setSectionValidity({
      athlete: true,
      address: true,
      school: true,
      parents: true,
      general: true,
    });
  };

  // Handler to update section validity
  const handleSectionValidityChange = useCallback(
    (sectionKey: string, isValid: boolean) => {
      setSectionValidity((prev) => ({
        ...prev,
        [sectionKey]: isValid,
      }));
    },
    [],
  );

  // Loading state
  const isLoading = fees === undefined || summary === undefined;

  const totalDue = summary?.totalDue ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;

  useEffect(() => {
    if (application !== null) {
      return;
    }
    router.replace(ROUTES.org.applications.list(organizationSlug));
  }, [application, organizationSlug, router]);

  if (application === null) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 ">
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-6">
          <ApplicationHeader
            application={application}
            organizationSlug={organizationSlug}
            totalDue={totalDue}
            totalPaid={totalPaid}
            totalPending={totalPending}
            organizationLogoUrl={organizationLogoUrl}
            associatedUser={associatedUser}
          />
        </div>
      </div>

      <div className="lg:col-span-3">
        <Tabs defaultValue="application" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="mb-4 h-9 inline-flex w-auto">
              <TabsTrigger
                value="application"
                className="gap-1 text-xs md:text-sm px-2 md:px-3"
              >
                <UserIcon className="hidden md:block h-4 w-4" />
                <span>{t("tabs.application")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="gap-1 text-xs md:text-sm px-2 md:px-3"
              >
                <File className="hidden md:block h-4 w-4" />
                <span>{t("tabs.documents")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="gap-1 text-xs md:text-sm px-2 md:px-3"
              >
                <CreditCard className="hidden md:block h-4 w-4" />
                <span>{t("tabs.payments")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="gap-1 text-xs md:text-sm px-2 md:px-3"
              >
                <History className="hidden md:block h-4 w-4" />
                <span>{t("tabs.transactions")}</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <TabsContent value="application" className="mt-0">
            {isAdmin && (
              <div className="flex justify-end mb-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {tCommon("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleSave}
                      disabled={isSaving || !isFormValid}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isSaving ? tCommon("saving") : tCommon("save")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {tCommon("edit")}
                  </Button>
                )}
              </div>
            )}
            <Accordion
              type="multiple"
              value={
                isEditing
                  ? ["athlete", "address", "school", "parents", "general"]
                  : undefined
              }
              className="w-full"
            >
              <AccordionItem value="athlete">
                <AccordionTrigger>{t("sections.athlete")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationOverviewCard
                    application={application}
                    isEditing={isEditing}
                    onDataChange={(data) =>
                      handleSectionDataChange("athlete", data)
                    }
                    onValidationChange={(isValid) =>
                      handleSectionValidityChange("athlete", isValid)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="address">
                <AccordionTrigger>{t("sections.address")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationAddressCard
                    application={application}
                    isEditing={isEditing}
                    onDataChange={(data) =>
                      handleSectionDataChange("address", data)
                    }
                    onValidationChange={(isValid) =>
                      handleSectionValidityChange("address", isValid)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="school">
                <AccordionTrigger>{t("sections.school")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationSchoolCard
                    application={application}
                    isEditing={isEditing}
                    onDataChange={(data) =>
                      handleSectionDataChange("school", data)
                    }
                    onValidationChange={(isValid) =>
                      handleSectionValidityChange("school", isValid)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="parents">
                <AccordionTrigger>{t("sections.parents")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationParentsCard
                    application={application}
                    isEditing={isEditing}
                    onDataChange={(data) =>
                      handleSectionDataChange("parents", data)
                    }
                    onValidationChange={(isValid) =>
                      handleSectionValidityChange("parents", isValid)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="general">
                <AccordionTrigger>{t("sections.general")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationGeneralCard
                    application={application}
                    isEditing={isEditing}
                    onDataChange={(data) =>
                      handleSectionDataChange("general", data)
                    }
                    onValidationChange={(isValid) =>
                      handleSectionValidityChange("general", isValid)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          <TabsContent value="docs" className="mt-0">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              {documents === undefined || documentConfigs === undefined ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <ApplicationDocuments
                  applicationId={convexApplicationId}
                  documents={documents}
                  documentConfigs={documentConfigs}
                  onUpload={uploadDocument}
                  onUpdateStatus={updateDocumentStatus}
                  onUpdateVisibility={updateDocumentVisibility}
                  onGenerateUploadUrl={generateUploadUrl}
                  onRemove={removeDocument}
                  onCreateCustomDocumentType={createCustomDocumentType}
                  onUpdateCustomDocumentType={updateCustomDocumentType}
                  onDeleteCustomDocumentType={deleteCustomDocumentType}
                />
              )}
            </Suspense>
          </TabsContent>
          <TabsContent value="payments" className="mt-0">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <ApplicationPayments
                  applicationId={convexApplicationId}
                  organizationSlug={organizationSlug}
                  fees={fees ?? []}
                  onAddFee={createFee}
                  onAddRecurringPlan={createRecurringPlan}
                  onRemoveFee={removeFee}
                  onRecordPayment={recordManualPayment}
                  onUpdateFee={updateFee}
                  onUpdateRecurringFee={updateRecurringSeries}
                  onCreatePaymentLink={createPaymentLink}
                />
              )}
            </Suspense>
          </TabsContent>
          <TabsContent value="transactions" className="mt-0">
            <ApplicationTransactionHistory
              transactionsWithFees={transactionsWithFees ?? []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function ApplicationDetailWrapper(props: ApplicationDetailWrapperProps) {
  return (
    <Authenticated>
      <ApplicationDetailContent {...props} />
    </Authenticated>
  );
}
