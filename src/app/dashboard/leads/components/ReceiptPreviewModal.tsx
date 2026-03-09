"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Invoice, Receipt } from "@/lib/schemas";
import { useCurrentTenant } from "@/hooks/useTenant";
import { useLead } from "@/hooks/useLeads";
import { formatCurrency } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";

interface ReceiptPreviewModalProps {
    receipt: Receipt | null;
    receipts: Receipt[];
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReceiptPreviewModal({ receipt, receipts, invoice, open, onOpenChange }: ReceiptPreviewModalProps) {
    const { data: session } = useSession();
    const { data: tenant, isLoading: isLoadingTenant } = useCurrentTenant();
    const [leadId, setLeadId] = useState<string | null>(null);

    const currency = session?.user?.currency || "USD";

    const getProxyImageUrl = (url: string) => {
        if (!url) return null;
        const encodedUrl = encodeURIComponent(url);
        return `/api/nextcloud/image?url=${encodedUrl}`;
    };

    useEffect(() => {
        if (invoice?.lead_id) {
            setLeadId(invoice.lead_id);
        }
    }, [invoice]);

    const { data: lead, isLoading: isLoadingLead } = useLead(leadId || "");

    const isLoading = isLoadingTenant || isLoadingLead;

    const currentReceiptIndex = receipts.findIndex(r => r.id === receipt?.id);
    const cumulativeReceipts = currentReceiptIndex >= 0 ? receipts.slice(0, currentReceiptIndex + 1) : [];
    const previousTotal = cumulativeReceipts
        .slice(0, currentReceiptIndex)
        .reduce((sum, r) => sum + r.total_paid, 0);

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    const handleDownload = () => {
        if (receipt && tenant && lead && invoice && currentReceiptIndex >= 0) {
            generateReceiptPDF(
                receipts,
                currentReceiptIndex,
                invoice,
                {
                    first_name: lead.first_name,
                    last_name: lead.last_name,
                    email: lead.email,
                    phone: lead.phone,
                    designation: lead.designation,
                },
                tenant,
                currency
            );
        }
    };

    if (!receipt || !invoice) return null;

    const receiptNum = `RCP-${String(receipt.receipt_number).padStart(3, '0')}`;
    const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`;
    const totalPaid = cumulativeReceipts.reduce((sum, r) => sum + r.total_paid, 0);
    const remaining = invoice.total_amount - invoice.paid_amount_vat;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Receipt</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Company Info */}
                        <div className="flex gap-4">
                            {tenant?.logo_url && (
                                <img
                                    src={getProxyImageUrl(tenant.logo_url) || ""}
                                    alt="Company Logo"
                                    className="w-12 h-12 object-contain"
                                />
                            )}
                            <div>
                                <h3 className="font-bold">{tenant?.name || "Company"}</h3>
                                {tenant?.address && (
                                    <div className="text-sm text-zinc-500">
                                        {[tenant.address.city, tenant.address.country].filter(Boolean).join(", ")}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Receipt Details */}
                        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-zinc-500">Receipt #</div>
                                <div className="font-semibold">{receiptNum}</div>
                            </div>
                            <div>
                                <div className="text-sm text-zinc-500">Payment Date</div>
                                <div className="font-semibold">{new Date(receipt.payment_date).toLocaleDateString()}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm text-zinc-500">Invoice Reference</div>
                                <div className="font-semibold">{invoiceNum}</div>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-500 mb-2">Payment Details:</h4>
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Receipt #</th>
                                            <th className="text-right p-3 font-medium">Amount</th>
                                            <th className="text-right p-3 font-medium">Tax</th>
                                            <th className="text-center p-3 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {cumulativeReceipts.map((r, idx) => (
                                            <tr key={r.id} className={idx === currentReceiptIndex ? "bg-blue-50 dark:bg-blue-950" : ""}>
                                                <td className="p-3">
                                                    RCP-{String(r.receipt_number).padStart(3, '0')}
                                                    {idx === currentReceiptIndex && (
                                                        <span className="ml-2 text-xs text-blue-600">(Current)</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">{formatPrice(r.amount_paid)}</td>
                                                <td className="p-3 text-right">+{formatPrice(r.tax_amount)}</td>
                                                <td className="p-3 text-center">{new Date(r.payment_date).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                {currentReceiptIndex > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Previous Payments</span>
                                        <span>{formatPrice(previousTotal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold">
                                    <span>This Payment</span>
                                    <span>{formatPrice(receipt.total_paid)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total Paid</span>
                                    <span>{formatPrice(totalPaid)}</span>
                                </div>
                                {remaining > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Remaining</span>
                                        <span>{formatPrice(remaining)}</span>
                                    </div>
                                )}
                                {remaining <= 0 && (
                                    <div className="text-sm text-green-600 font-semibold">
                                        Invoice Fully Paid
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="text-sm text-zinc-500">
                            <span className="font-semibold">Customer: </span>
                            {lead?.first_name} {lead?.last_name}
                            {lead?.email && ` • ${lead.email}`}
                        </div>

                        {/* Download Button */}
                        <Button onClick={handleDownload} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
