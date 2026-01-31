"use client";

import { useState } from "react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, CreditCard, Trash2, Banknote } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { dollarsToCents } from "@/lib/utils/currency";
import { useTranslations } from "next-intl";

interface PaymentActionsProps {
  applicationId: Id<"applications">;
  selectedFeeIds: Id<"fees">[];
  onAddFee: (args: {
    applicationId: Id<"applications">;
    name: string;
    description?: string;
    totalAmount: number;
    downPaymentPercent: number;
    isRefundable: boolean;
    isIncluded: boolean;
    isRequired: boolean;
  }) => Promise<Id<"fees">>;
  onDeleteSelected: () => void;
  onPay: () => Promise<void>;
  onMarkAsPaid: () => Promise<void>;
}

export function PaymentActions({
  applicationId,
  selectedFeeIds,
  onAddFee,
  onDeleteSelected,
  onPay,
  onMarkAsPaid,
}: PaymentActionsProps) {
  const t = useTranslations("Applications.payments");
  const { isAdmin } = useIsAdmin();
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);

  const hasSelectedFees = selectedFeeIds.length > 0;
  const [newFee, setNewFee] = useState({
    name: "",
    totalAmountDollars: 0,
    isRefundable: false,
    isIncluded: false,
    isRequired: false,
  });

  const handleAddFee = async () => {
    if (!newFee.name || !newFee.totalAmountDollars) return;

    setIsSubmitting(true);
    try {
      await onAddFee({
        applicationId,
        name: newFee.name,
        totalAmount: dollarsToCents(newFee.totalAmountDollars),
        downPaymentPercent: 100,
        isRefundable: newFee.isRefundable,
        isIncluded: newFee.isIncluded,
        isRequired: newFee.isRequired,
      });

      setNewFee({
        name: "",
        totalAmountDollars: 0,
        isRefundable: false,
        isIncluded: false,
        isRequired: false,
      });
      setIsAddingFee(false);
    } catch (error) {
      console.error("Failed to add fee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!hasSelectedFees || isProcessingPayment) return;

    setIsProcessingPayment(true);
    try {
      await onPay();
    } catch (error) {
      console.error("Failed to create payment link:", error);
      setIsProcessingPayment(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!hasSelectedFees || isMarkingAsPaid) return;

    setIsMarkingAsPaid(true);
    try {
      await onMarkAsPaid();
    } catch (error) {
      console.error("Failed to mark fees as paid:", error);
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-fit">
                <Button
                  size="sm"
                  variant="default"
                  disabled={!hasSelectedFees || isProcessingPayment}
                  onClick={handlePay}
                >
                  <CreditCard />
                  {isProcessingPayment
                    ? t("actions.processing")
                    : t("actions.pay")}
                </Button>
              </span>
            </TooltipTrigger>
            {!hasSelectedFees && !isProcessingPayment && (
              <TooltipContent>
                <p>{t("actions.tooltips.selectToPay")}</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isAdmin && (
            <>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <span className="inline-block w-fit">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-400"
                          disabled={!hasSelectedFees || isMarkingAsPaid}
                        >
                          <Banknote />
                          <span className="hidden md:inline">
                            {isMarkingAsPaid
                              ? t("actions.markingAsPaid")
                              : t("actions.markAsPaid")}
                          </span>
                        </Button>
                      </span>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  {!hasSelectedFees && !isMarkingAsPaid && (
                    <TooltipContent>
                      <p>{t("actions.tooltips.selectToMarkAsPaid")}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-500">
                      <Banknote />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      {t("actions.markAsPaidDialog.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <div>{t("actions.markAsPaidDialog.description")}</div>
                        <div className="text-muted-foreground text-xs">
                          {t("actions.markAsPaidDialog.accountability")}
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      {t("actions.markAsPaidDialog.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      style={{
                        backgroundColor: "#22c55e",
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#4ade80";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#22c55e";
                      }}
                      onClick={handleMarkAsPaid}
                    >
                      {t("actions.markAsPaidDialog.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <span className="inline-block w-fit">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!hasSelectedFees}
                        >
                          <Trash2 />
                          <span className="hidden md:inline">
                            {t("actions.delete")}
                          </span>
                        </Button>
                      </span>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  {!hasSelectedFees && (
                    <TooltipContent>
                      <p>{t("actions.tooltips.selectToDelete")}</p>
                    </TooltipContent>
                  )}
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
                      onClick={onDeleteSelected}
                    >
                      {t("actions.deleteDialog.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant={isAddingFee ? "outline" : "default"}
            onClick={() => setIsAddingFee(!isAddingFee)}
          >
            {isAddingFee ? (
              <span className="hidden md:inline">{t("actions.cancel")}</span>
            ) : (
              <>
                <Plus />
                <span className="hidden md:inline">{t("actions.addFee")}</span>
              </>
            )}
          </Button>
        )}
      </div>
      {isAddingFee && (
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fee-name">{t("form.feeName")}</Label>
                <Input
                  id="fee-name"
                  placeholder={t("form.feeNamePlaceholder")}
                  value={newFee.name}
                  onChange={(e) =>
                    setNewFee({ ...newFee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="total-amount">{t("form.totalAmount")}</Label>
                <Input
                  id="total-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("form.amountPlaceholder")}
                  value={newFee.totalAmountDollars || ""}
                  onChange={(e) =>
                    setNewFee({
                      ...newFee,
                      totalAmountDollars: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="refundable"
                  checked={newFee.isRefundable}
                  onChange={(e) =>
                    setNewFee({ ...newFee, isRefundable: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="refundable" className="cursor-pointer">
                  {t("form.refundable")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="included"
                  checked={newFee.isIncluded}
                  onChange={(e) =>
                    setNewFee({ ...newFee, isIncluded: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="included" className="cursor-pointer">
                  {t("form.included")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newFee.isRequired}
                  onChange={(e) =>
                    setNewFee({ ...newFee, isRequired: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="required" className="cursor-pointer">
                  {t("form.required")}
                </Label>
              </div>
            </div>
            <Button
              onClick={handleAddFee}
              className="w-full"
              disabled={
                isSubmitting || !newFee.name || !newFee.totalAmountDollars
              }
            >
              {isSubmitting ? t("form.adding") : t("form.addButton")}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
