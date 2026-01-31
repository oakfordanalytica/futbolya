"use client";

import {
  Authenticated,
  Preloaded,
  usePreloadedQuery,
  useQuery,
  useMutation,
  useAction,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ApplicationHeader } from "./application-header";
import { ApplicationOverviewCard } from "./pre-admission/application-overview-card";
import { ApplicationSchoolCard } from "./pre-admission/application-school-card";
import { ApplicationParentsCard } from "./pre-admission/application-parents-card";
import { ApplicationAddressCard } from "./pre-admission/application-address-card";
import { ApplicationAdditionalCard } from "./pre-admission/application-additional-card";
import { ApplicationDocuments } from "./application-documents";
import { ApplicationPayments } from "./application-payments";
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
import { ApplicationTransactionHistory } from "./application-transaction-history";

interface ApplicationDetailWrapperProps {
  preloadedApplication: Preloaded<typeof api.applications.getById>;
  organizationSlug: string;
  applicationId: string;
}

function ApplicationDetailContent({
  preloadedApplication,
  organizationSlug,
  applicationId,
}: ApplicationDetailWrapperProps) {
  const application = usePreloadedQuery(preloadedApplication);
  const t = useTranslations("Applications");

  const convexApplicationId = applicationId as Id<"applications">;

  // Fetch fees and transactions from Convex
  const fees = useQuery(api.fees.getByApplication, {
    applicationId: convexApplicationId,
  });
  const summary = useQuery(api.fees.getSummary, {
    applicationId: convexApplicationId,
  });
  const transactionsWithFees = useQuery(api.transactions.getWithFeeDetails, {
    applicationId: convexApplicationId,
  });

  // Fetch documents from Convex
  const documents = useQuery(api.documents.getByApplication, {
    applicationId: convexApplicationId,
  });
  const documentConfigs = useQuery(api.documents.getConfigByApplication, {
    applicationId: convexApplicationId,
  });

  // Mutations
  const createFee = useMutation(api.fees.create);
  const removeFee = useMutation(api.fees.remove);
  const recordManualPayment = useMutation(api.fees.recordManualPayment);
  const updateFee = useMutation(api.fees.update);

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

  // Loading state
  const isLoading = fees === undefined || summary === undefined;

  const totalDue = summary?.totalDue ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;

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
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="athlete">
                <AccordionTrigger>{t("sections.athlete")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationOverviewCard application={application} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="address">
                <AccordionTrigger>{t("sections.address")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationAddressCard application={application} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="school">
                <AccordionTrigger>{t("sections.school")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationSchoolCard application={application} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="parents">
                <AccordionTrigger>{t("sections.parents")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationParentsCard application={application} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="general">
                <AccordionTrigger>{t("sections.general")}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  <ApplicationAdditionalCard application={application} />
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
                  onRemoveFee={removeFee}
                  onRecordPayment={recordManualPayment}
                  onUpdateFee={updateFee}
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
