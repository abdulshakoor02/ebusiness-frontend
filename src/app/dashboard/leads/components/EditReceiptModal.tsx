"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUpdateReceipt, useDeleteReceipt, useInvoice } from "@/hooks/useInvoices";
import { Receipt } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditReceiptModalProps {
    receipt: Receipt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditReceiptModal({ receipt, open, onOpenChange, onSuccess }: EditReceiptModalProps) {
    const { data: session } = useSession();
    const updateReceipt = useUpdateReceipt();
    const deleteReceipt = useDeleteReceipt();
    const { data: invoice } = useInvoice(receipt?.invoice_id || "");

    const currency = session?.user?.currency || "USD";

    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (receipt && open) {
            setAmountPaid(receipt.amount_paid);
            setPaymentDate(receipt.payment_date.split('T')[0]);
        }
    }, [receipt, open]);

    const remainingBalance = useMemo(() => {
        if (!invoice || !receipt) return 0;
        return invoice.total_amount - (invoice.paid_amount - receipt.amount_paid);
    }, [invoice, receipt]);

    const taxAmount = useMemo(() => {
        if (!invoice || !amountPaid) return 0;
        return amountPaid * (invoice.tax_percentage / 100);
    }, [invoice, amountPaid]);

    const totalPayment = useMemo(() => {
        return amountPaid + taxAmount;
    }, [amountPaid, taxAmount]);

    function onSubmit() {
        if (!receipt || !amountPaid || !paymentDate) return;

        const payload = {
            amount_paid: amountPaid,
            payment_date: new Date(paymentDate).toISOString(),
        };

        updateReceipt.mutate(
            { id: receipt.id, invoice_id: receipt.invoice_id, data: payload },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess?.();
                },
            }
        );
    }

    function handleDelete() {
        if (!receipt) return;
        deleteReceipt.mutate(
            { id: receipt.id, invoice_id: receipt.invoice_id },
            {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    onOpenChange(false);
                    onSuccess?.();
                },
            }
        );
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setAmountPaid(0);
            setPaymentDate("");
        }
        onOpenChange(isOpen);
    };

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    if (!receipt) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Edit Receipt #{receipt.receipt_number}</DialogTitle>
                        <DialogDescription>
                            Update the payment amount or date.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Amount Paid</div>
                            <Input
                                type="number"
                                min={0.01}
                                max={remainingBalance + receipt.amount_paid}
                                step={0.01}
                                value={amountPaid || ""}
                                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                placeholder="Enter amount"
                                className="text-lg"
                            />
                            {amountPaid > remainingBalance + receipt.amount_paid && (
                                <p className="text-sm text-red-500">Amount exceeds remaining balance</p>
                            )}
                        </div>

                        {/* Tax & Total Preview */}
                        {amountPaid > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Tax ({invoice?.tax_percentage || 0}%)</span>
                                    <span>{formatPrice(taxAmount)}</span>
                                </div>
                                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-medium">
                                    <span>Total Payment</span>
                                    <span>{formatPrice(totalPayment)}</span>
                                </div>
                            </div>
                        )}

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Payment Date</div>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={updateReceipt.isPending || deleteReceipt.isPending}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={updateReceipt.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={updateReceipt.isPending || !amountPaid || amountPaid <= 0 || amountPaid > remainingBalance + receipt.amount_paid}
                                    onClick={onSubmit}
                                >
                                    {updateReceipt.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete receipt #{receipt.receipt_number}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteReceipt.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={deleteReceipt.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteReceipt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
