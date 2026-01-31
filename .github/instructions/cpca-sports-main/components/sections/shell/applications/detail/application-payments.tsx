"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeeCard } from "./fee-card";
import { PaymentActions } from "./payment-actions";
import { Id } from "@/convex/_generated/dataModel";
import { type Fee } from "@/lib/applications/fee-types";
import { useTranslations } from "next-intl";

interface ApplicationPaymentsProps {
  applicationId: Id<"applications">;
  organizationSlug: string;
  fees: Fee[];
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
  onRemoveFee: (args: { feeId: Id<"fees"> }) => Promise<null>;
  onRecordPayment: (args: {
    feeId: Id<"fees">;
    amount: number;
    method: "cash" | "wire";
    reference?: string;
  }) => Promise<Id<"transactions">>;
  onUpdateFee: (args: {
    feeId: Id<"fees">;
    name: string;
    totalAmount?: number;
  }) => Promise<null>;
  onCreatePaymentLink: (args: {
    applicationId: Id<"applications">;
    feeIds: Id<"fees">[];
    redirectUrl: string;
  }) => Promise<{ paymentUrl: string; paymentLinkId: string; orderId: string }>;
}

export function ApplicationPayments({
  applicationId,
  organizationSlug,
  fees,
  onAddFee,
  onRemoveFee,
  onRecordPayment,
  onUpdateFee,
  onCreatePaymentLink,
}: ApplicationPaymentsProps) {
  const t = useTranslations("Applications.payments");

  const pendingFees = useMemo(
    () => fees.filter((fee) => fee.status !== "paid"),
    [fees],
  );

  const [selectedFeeIds, setSelectedFeeIds] = useState<Set<Id<"fees">>>(
    new Set(),
  );

  const handleFeeSelect = useCallback((feeId: Id<"fees">, checked: boolean) => {
    setSelectedFeeIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(feeId);
      } else {
        newSet.delete(feeId);
      }
      return newSet;
    });
  }, []);

  const handleUpdateFee = useCallback(
    async (feeId: Id<"fees">, name: string, totalAmount: number) => {
      try {
        await onUpdateFee({
          feeId,
          name,
          totalAmount,
        });
      } catch (error) {
        console.error("Failed to update fee:", error);
        throw error;
      }
    },
    [onUpdateFee],
  );

  const handleDeleteSelected = useCallback(async () => {
    const feesToDelete = Array.from(selectedFeeIds);

    try {
      await Promise.all(feesToDelete.map((feeId) => onRemoveFee({ feeId })));
      setSelectedFeeIds(new Set());
    } catch (error) {
      console.error("Failed to delete fees:", error);
    }
  }, [selectedFeeIds, onRemoveFee]);

  const handlePay = useCallback(async () => {
    const feeIds = Array.from(selectedFeeIds);
    if (feeIds.length === 0) return;

    const redirectUrl = `${window.location.origin}/${organizationSlug}/applications/${applicationId}?tab=payments&payment=success`;

    const result = await onCreatePaymentLink({
      applicationId,
      feeIds,
      redirectUrl,
    });

    window.location.href = result.paymentUrl;
  }, [selectedFeeIds, applicationId, organizationSlug, onCreatePaymentLink]);

  const handleMarkAsPaid = useCallback(async () => {
    const feesToMark = fees.filter((fee) => selectedFeeIds.has(fee._id));

    try {
      await Promise.all(
        feesToMark.map((fee) => {
          const remainingAmount = fee.totalAmount - fee.paidAmount;
          if (remainingAmount > 0) {
            return onRecordPayment({
              feeId: fee._id,
              amount: remainingAmount,
              method: "cash",
            });
          }
        }),
      );
      setSelectedFeeIds(new Set());
    } catch (error) {
      console.error("Failed to mark fees as paid:", error);
    }
  }, [selectedFeeIds, fees, onRecordPayment]);

  return (
    <div className="space-y-6">
      <PaymentActions
        applicationId={applicationId}
        selectedFeeIds={Array.from(selectedFeeIds)}
        onAddFee={onAddFee}
        onDeleteSelected={handleDeleteSelected}
        onPay={handlePay}
        onMarkAsPaid={handleMarkAsPaid}
      />

      {pendingFees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            {pendingFees.map((fee, index, array) => (
              <div key={fee._id}>
                <FeeCard
                  fee={fee}
                  showCheckbox={true}
                  isSelected={selectedFeeIds.has(fee._id)}
                  onSelect={(checked) => handleFeeSelect(fee._id, checked)}
                  onUpdate={handleUpdateFee}
                />
                {index < array.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
