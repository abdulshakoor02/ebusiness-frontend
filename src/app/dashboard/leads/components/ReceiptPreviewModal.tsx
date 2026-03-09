"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Invoice, Receipt } from "@/lib/schemas";
import { useCurrentTenant } from "@/hooks/useTenant";
import { useLead } from "@/hooks/useLeads";
import { formatCurrency } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    const [isDownloading, setIsDownloading] = useState(false);

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

    const handleDownload = async () => {
        if (receipt && tenant && lead && invoice && currentReceiptIndex >= 0) {
            setIsDownloading(true);
            try {
                await generateReceiptPDF(
                    receipts,
                    currentReceiptIndex,
                    invoice,
                    {
                        first_name: lead.first_name,
                        last_name: lead.last_name,
                        email: lead.email,
                        phone: lead.phone,
                        designation: lead.designation,
                        address: lead.address || undefined,
                    },
                    tenant,
                    currency
                );
            } finally {
                setIsDownloading(false);
            }
        }
    };

    if (!receipt || !invoice) return null;

    const receiptNum = `RCP-${String(receipt.receipt_number).padStart(3, '0')}`;
    const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`;
    const totalPaid = cumulativeReceipts.reduce((sum, r) => sum + r.total_paid, 0);
    const remaining = invoice.total_amount - invoice.paid_amount_vat;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 bg-white dark:bg-zinc-950">
                <DialogHeader className="sr-only">
                    <DialogTitle>Receipt Preview</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Header / Brand Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start p-8 pb-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 gap-6">
                            <div className="flex flex-col gap-4">
                                {tenant?.logo_url && (
                                    <img
                                        src={getProxyImageUrl(tenant.logo_url) || ""}
                                        alt="Company Logo"
                                        className="w-24 h-24 object-contain"
                                    />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{tenant?.name || "Company"}</h3>
                                    {tenant?.address && (
                                        <div className="text-sm text-zinc-500 mt-1 max-w-[250px] leading-relaxed">
                                            {tenant.address.street && <div>{tenant.address.street}</div>}
                                            {tenant.address.address_line && <div>{tenant.address.address_line}</div>}
                                            <div>{[tenant.address.city, tenant.address.state, tenant.address.country].filter(Boolean).join(", ")}</div>
                                            <div>{tenant.address.zip_code}</div>
                                            {tenant.email && <div className="mt-2 text-zinc-600 dark:text-zinc-400">{tenant.email}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sm:text-right">
                                <h1 className="text-4xl font-light tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">RECEIPT</h1>
                                <div className="space-y-1">
                                    <div className="text-sm">
                                        <span className="text-zinc-500 mr-2">Receipt Number:</span>
                                        <span className="font-medium">{receiptNum}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-zinc-500 mr-2">Payment Date:</span>
                                        <span className="font-medium">{new Date(receipt.payment_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                        <span className="text-zinc-500 mr-2">Invoice Ref:</span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{invoiceNum}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Paid By Section */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Paid By</h4>
                                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                    <div className="font-semibold text-base mb-1">
                                        {lead?.first_name} {lead?.last_name}
                                    </div>
                                    {lead?.designation && <div className="text-zinc-500">{lead.designation}</div>}

                                    {lead?.address && (
                                        <div className="mt-2 text-zinc-500">
                                            {lead.address.street && <div>{lead.address.street}</div>}
                                            {lead.address.address_line && <div>{lead.address.address_line}</div>}
                                            <div>{[lead.address.city, lead.address.state, lead.address.country].filter(Boolean).join(", ")}</div>
                                            {lead.address.zip_code && <div>{lead.address.zip_code}</div>}
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        {lead?.email && <div>{lead.email}</div>}
                                        {lead?.phone && <div>{lead.phone}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Minimalist Payment History Table */}
                            <div className="mt-8 overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="border-b-2 border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="text-left py-3 font-semibold text-zinc-500">Receipt Ref</th>
                                            <th className="text-center py-3 font-semibold text-zinc-500">Date Paid</th>
                                            <th className="text-right py-3 font-semibold text-zinc-500">Principal</th>
                                            <th className="text-right py-3 font-semibold text-zinc-500">Tax</th>
                                            <th className="text-right py-3 font-semibold text-zinc-500">Total Applied</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                        {cumulativeReceipts.map((r, idx) => (
                                            <tr key={r.id} className={idx === currentReceiptIndex ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                                                <td className="py-4 font-medium flex items-center gap-2">
                                                    RCP-{String(r.receipt_number).padStart(3, '0')}
                                                    {idx === currentReceiptIndex && <Badge variant="outline" className="text-[10px] h-5 bg-blue-100/50">Current</Badge>}
                                                </td>
                                                <td className="py-4 text-center text-zinc-600 dark:text-zinc-400">{new Date(r.payment_date).toLocaleDateString()}</td>
                                                <td className="py-4 text-right text-zinc-600 dark:text-zinc-400">{formatPrice(r.amount_paid)}</td>
                                                <td className="py-4 text-right text-zinc-600 dark:text-zinc-400">{formatPrice(r.tax_amount)}</td>
                                                <td className="py-4 text-right font-medium">{formatPrice(r.total_paid)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Financial Summary */}
                            <div className="flex justify-end pt-6">
                                <div className="w-80 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Previous Payments</span>
                                        <span className="font-medium">{formatPrice(previousTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">This Payment</span>
                                        <span className="font-medium">{formatPrice(receipt.total_paid)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-xl border-y border-zinc-200 dark:border-zinc-800 py-4 my-2">
                                        <span>Total Applied</span>
                                        <span>{formatPrice(totalPaid)}</span>
                                    </div>

                                    {remaining <= 0 ? (
                                        <div className="text-right text-green-600 font-bold tracking-wide uppercase mt-4">
                                            Invoice Fully Settled
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm mt-4 text-zinc-500">
                                            <span>Remaining Balance on Invoice</span>
                                            <span className="font-bold text-red-600">{formatPrice(remaining)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Notes & Actions */}
                            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row gap-4 justify-between items-center text-zinc-500 text-sm">
                                <p>Thank you for your payment!</p>
                                <Button onClick={handleDownload} disabled={isDownloading} size="lg" className="px-8 shadow-sm">
                                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    {isDownloading ? "Generating..." : "Download PDF"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
