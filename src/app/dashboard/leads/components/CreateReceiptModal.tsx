"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useCreateReceipt, useInvoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CreateReceiptModalProps {
    invoiceId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateReceiptModal({ invoiceId, open, onOpenChange, onSuccess }: CreateReceiptModalProps) {
    const { data: session } = useSession();
    const createReceipt = useCreateReceipt();
    const { data: invoice, isLoading: isLoadingInvoice } = useInvoice(invoiceId || "");

    const currency = session?.user?.currency || "USD";

    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const remainingBalance = useMemo(() => {
        if (!invoice) return 0;
        return invoice.total_amount - invoice.paid_amount;
    }, [invoice]);

    const taxAmount = useMemo(() => {
        if (!invoice || !amountPaid) return 0;
        return amountPaid * (invoice.tax_percentage / 100);
    }, [invoice, amountPaid]);

    const totalPayment = useMemo(() => {
        return amountPaid + taxAmount;
    }, [amountPaid, taxAmount]);

    function onSubmit() {
        if (!invoiceId || !amountPaid || !paymentDate) return;

        const payload = {
            amount_paid: amountPaid,
            payment_date: new Date(paymentDate).toISOString(),
        };

        createReceipt.mutate(
            { invoice_id: invoiceId, data: payload },
            {
                onSuccess: () => {
                    setAmountPaid(0);
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                    onOpenChange(false);
                    onSuccess?.();
                },
            }
        );
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setAmountPaid(0);
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
        onOpenChange(isOpen);
    };

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    if (isLoadingInvoice || !invoice) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Loading...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const isFullyPaid = invoice.status === 'paid';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        Record Payment - Invoice #{invoice.invoice_number}
                    </DialogTitle>
                    <DialogDescription>
                        Add a payment receipt for this invoice.
                    </DialogDescription>
                </DialogHeader>

                {isFullyPaid ? (
                    <div className="py-6 text-center">
                        <Badge variant="secondary" className="mb-2">Fully Paid</Badge>
                        <p className="text-zinc-500">This invoice is already fully paid.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Invoice Summary */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Invoice Total</span>
                                <span className="font-medium">{formatPrice(invoice.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Already Paid</span>
                                <span>{formatPrice(invoice.paid_amount_vat)}</span>
                            </div>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-medium">
                                <span>Remaining Balance</span>
                                <span className="text-green-600">{formatPrice(remainingBalance)}</span>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Amount to Pay</div>
                            <Input
                                type="number"
                                min={0.01}
                                max={remainingBalance}
                                step={0.01}
                                value={amountPaid || ""}
                                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                placeholder="Enter amount"
                                className="text-lg"
                            />
                            {amountPaid > remainingBalance && (
                                <p className="text-sm text-red-500">Amount exceeds remaining balance</p>
                            )}
                        </div>

                        {/* Tax & Total Preview */}
                        {amountPaid > 0 && (
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Tax ({invoice.tax_percentage}%)</span>
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

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={createReceipt.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={createReceipt.isPending || !amountPaid || amountPaid <= 0 || amountPaid > remainingBalance}
                                onClick={onSubmit}
                            >
                                {createReceipt.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Add Receipt"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
