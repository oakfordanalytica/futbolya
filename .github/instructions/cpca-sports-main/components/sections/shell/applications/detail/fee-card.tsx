"use client";

import { useState, useRef, useEffect } from "react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Pencil,
  Check,
  ExternalLink,
  User,
} from "lucide-react";
import {
  type PaymentMethod,
  type RegisteredByUser,
} from "@/lib/applications/payment-types";
import { type Fee } from "@/lib/applications/fee-types";
import {
  formatCurrency,
  centsToDollars,
  dollarsToCents,
} from "@/lib/utils/currency";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

interface TransactionInfo {
  method: PaymentMethod;
  receiptUrl?: string;
  registeredByUser?: RegisteredByUser;
}

interface FeeCardProps {
  fee: Fee;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onRemove?: (feeId: Id<"fees">) => void;
  onMarkAsPaid?: (feeId: Id<"fees">) => void;
  onUpdate?: (
    feeId: Id<"fees">,
    name: string,
    totalAmount: number,
  ) => Promise<void>;
  transactionInfo?: TransactionInfo;
}

const getStatusConfig = (t: any) => ({
  paid: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    badgeVariant: "secondary" as const,
    badgeClassName:
      "gap-1 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20",
    label: t("feeStatuses.paid"),
  },
  partially_paid: {
    icon: CreditCard,
    iconColor: "text-blue-500",
    badgeVariant: "secondary" as const,
    badgeClassName: "gap-1",
    label: t("feeStatuses.partiallyPaid"),
  },
  pending: {
    icon: Clock,
    iconColor: "text-muted-foreground",
    badgeVariant: "outline" as const,
    badgeClassName: "gap-1",
    label: t("feeStatuses.pending"),
  },
});

export function FeeCard({
  fee,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  onRemove,
  onMarkAsPaid,
  onUpdate,
  transactionInfo,
}: FeeCardProps) {
  const tTransactions = useTranslations("Applications.transactions");
  const t = useTranslations("Applications.payments");
  const { isAdmin } = useIsAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(fee.name);
  const [editedAmountDollars, setEditedAmountDollars] = useState(
    centsToDollars(fee.totalAmount),
  );
  const [isSaving, setIsSaving] = useState(false);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const statusConfig = getStatusConfig(t)[fee.status];
  const StatusIcon = statusConfig.icon;

  const canEditAmount = fee.paidAmount === 0;

  // Handle click outside to cancel editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        editContainerRef.current &&
        !editContainerRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    // Add listener after a small delay to avoid immediate cancellation
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const dateText =
    fee.status === "paid" && fee.paidAt
      ? format(new Date(fee.paidAt), "MMM d, yyyy")
      : fee.createdAt
        ? format(new Date(fee.createdAt), "MMM d, yyyy")
        : null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(fee.name);
    setEditedAmountDollars(centsToDollars(fee.totalAmount));
  };

  const handleSave = async () => {
    if (!onUpdate || !editedName.trim()) return;

    setIsSaving(true);
    try {
      const totalAmount = canEditAmount
        ? dollarsToCents(editedAmountDollars)
        : fee.totalAmount;

      await onUpdate(fee._id, editedName.trim(), totalAmount);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update fee:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(fee.name);
    setEditedAmountDollars(centsToDollars(fee.totalAmount));
  };

  const content = (
    <div ref={editContainerRef} className="contents">
      <ItemMedia variant="icon">
        <StatusIcon className={statusConfig.iconColor} />
      </ItemMedia>

      <ItemContent>
        <div className="flex items-start justify-between gap-4 w-full">
          <div className="flex-1 ">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-7 max-w-xs"
                  autoFocus
                />
              ) : (
                <ItemTitle>{fee.name}</ItemTitle>
              )}
              {fee.isRequired && (
                <Badge variant="secondary" className="text-xs">
                  {t("feeBadges.required")}
                </Badge>
              )}
              {fee.isDefault && (
                <Badge variant="outline" className="text-xs">
                  {t("feeBadges.default")}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-sm">
              {dateText && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground">
                      {dateText}
                    </span>
                  </TooltipTrigger>
                  {(fee.createdAt || fee.paidAt) && (
                    <TooltipContent>
                      <div className="space-y-1">
                        {fee.createdAt && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              {t("feeTooltips.created")}:
                            </span>{" "}
                            {format(
                              new Date(fee.createdAt),
                              "MMM d, yyyy 'at' h:mm:ss a",
                            )}
                          </div>
                        )}
                        {fee.paidAt && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              {t("feeTooltips.paid")}:
                            </span>{" "}
                            {format(
                              new Date(fee.paidAt),
                              "MMM d, yyyy 'at' h:mm:ss a",
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}

              <span className="text-muted-foreground">•</span>

              {isEditing && canEditAmount ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedAmountDollars}
                    onChange={(e) =>
                      setEditedAmountDollars(parseFloat(e.target.value) || 0)
                    }
                    className="h-7 w-24"
                  />
                </div>
              ) : (
                <span className="font-semibold">
                  {formatCurrency(fee.totalAmount)}
                </span>
              )}
            </div>

            {fee.paidAmount > 0 && fee.status !== "paid" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("feeProgress.progress")}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(fee.paidAmount)} /{" "}
                    {formatCurrency(fee.totalAmount)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(fee.paidAmount / fee.totalAmount) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t("feeProgress.remaining")}:{" "}
                    {formatCurrency(fee.totalAmount - fee.paidAmount)}
                  </span>
                  <span>
                    {Math.round((fee.paidAmount / fee.totalAmount) * 100)}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {fee.isRefundable && (
                <Badge variant="outline" className="text-xs">
                  {t("feeBadges.refundable")}
                </Badge>
              )}
              {fee.isIncluded && (
                <Badge variant="outline" className="text-xs">
                  {t("feeBadges.included")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </ItemContent>

      {isAdmin && onUpdate && !fee.isDefault && (
        <ItemActions>
          {isEditing ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleSave}
                    disabled={isSaving || !editedName.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("actions.tooltips.saveChanges")}
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("actions.tooltips.editFee")}</TooltipContent>
            </Tooltip>
          )}
        </ItemActions>
      )}

      {transactionInfo && (
        <ItemActions>
          {transactionInfo.method === "online" && transactionInfo.receiptUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={transactionInfo.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full size-8 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                {tTransactions("actions.viewReceipt")}
              </TooltipContent>
            </Tooltip>
          ) : transactionInfo.registeredByUser ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center justify-center rounded-full size-8 text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">
                    {tTransactions("actions.registeredByTooltip")}
                  </div>
                  <div>
                    {transactionInfo.registeredByUser.firstName}{" "}
                    {transactionInfo.registeredByUser.lastName}
                  </div>
                  <div className="text-muted-foreground">
                    {transactionInfo.registeredByUser.email}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </ItemActions>
      )}
    </div>
  );

  if (showCheckbox && onSelect) {
    const handleClick = (e: React.MouseEvent) => {
      // Don't toggle if clicking on buttons or inputs
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("input")) {
        return;
      }
      onSelect(!isSelected);
    };

    return (
      <FieldLabel
        htmlFor={`fee-${fee._id}`}
        className="!border-0 !rounded-none w-full [&>[data-slot=field]]:!border-0 [&>[data-slot=field]]:!rounded-none [&>[data-slot=field]]:!p-0"
      >
        <Field orientation="horizontal" className="w-full">
          <Checkbox
            id={`fee-${fee._id}`}
            name={`fee-${fee._id}`}
            checked={isSelected}
            className="sr-only"
          />
          <FieldContent onClick={handleClick} className="cursor-pointer w-full">
            <Item>{content}</Item>
          </FieldContent>
        </Field>
      </FieldLabel>
    );
  }

  return <Item>{content}</Item>;
}
