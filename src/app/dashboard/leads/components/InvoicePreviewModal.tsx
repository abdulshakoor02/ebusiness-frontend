"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Invoice } from "@/lib/schemas";
import { useCurrentTenant } from "@/hooks/useTenant";
import { useLead } from "@/hooks/useLeads";
import { formatCurrency } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";

interface InvoicePreviewModalProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewModal({ invoice, open, onOpenChange }: InvoicePreviewModalProps) {
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
    const invoiceNum = invoice ? `INV-${String(invoice.invoice_number).padStart(3, '0')}` : "";

    const handleDownload = async () => {
        if (invoice && tenant && lead) {
            setIsDownloading(true);
            try {
                await generateInvoicePDF(invoice, {
                    first_name: lead.first_name,
                    last_name: lead.last_name,
                    email: lead.email,
                    phone: lead.phone,
                    designation: lead.designation,
                    address: lead.address || undefined,
                }, tenant, currency);
            } finally {
                setIsDownloading(false);
            }
        }
    };

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    if (!invoice) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 bg-white dark:bg-zinc-950">
                <DialogHeader className="sr-only">
                    <DialogTitle>Invoice Preview</DialogTitle>
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
                                <h1 className="text-4xl font-light tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">INVOICE</h1>
                                <div className="space-y-1">
                                    <div className="text-sm">
                                        <span className="text-zinc-500 mr-2">Invoice Number:</span>
                                        <span className="font-medium">{invoiceNum}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-zinc-500 mr-2">Date:</span>
                                        <span className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-zinc-500 mr-2">Due Date:</span>
                                        <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mt-4 inline-block">
                                        <Badge variant={invoice.status === "paid" ? "secondary" : "destructive"} className="px-3 py-1 uppercase tracking-wider text-xs">
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Bill To Section */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Billed To</h4>
                                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                    <div className="font-semibold text-base mb-1">
                                        {lead?.first_name} {lead?.last_name}
                                    </div>
                                    {lead?.designation && <div className="text-zinc-500">{lead.designation}</div>}

                                    {/* New Lead Address rendering */}
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

                            {/* Minimalist Line Items */}
                            <div className="mt-8 overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="border-b-2 border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="text-left py-3 font-semibold text-zinc-500">Item Description</th>
                                            <th className="text-center py-3 font-semibold text-zinc-500 w-24">Qty</th>
                                            <th className="text-right py-3 font-semibold text-zinc-500 w-32">Rate</th>
                                            <th className="text-right py-3 font-semibold text-zinc-500 w-32">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                        {invoice.items.map((item, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="py-4 font-medium">{item.product_name}</td>
                                                <td className="py-4 text-center text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                                                <td className="py-4 text-right text-zinc-600 dark:text-zinc-400">{formatPrice(item.unit_price)}</td>
                                                <td className="py-4 text-right font-medium">{formatPrice(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Financial Summary */}
                            <div className="flex justify-end pt-6">
                                <div className="w-80 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Subtotal</span>
                                        <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
                                    </div>
                                    {invoice.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Discount</span>
                                            <span className="font-medium text-red-600">-{formatPrice(invoice.discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Tax ({invoice.tax_percentage}%)</span>
                                        <span className="font-medium">{formatPrice(invoice.tax_amount)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-xl border-y border-zinc-200 dark:border-zinc-800 py-4 my-2">
                                        <span>Total</span>
                                        <span>{formatPrice(invoice.total_amount)}</span>
                                    </div>

                                    {invoice.paid_amount > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm pt-2">
                                                <span className="text-zinc-500">Amount Paid</span>
                                                <span className="font-medium text-green-600">{formatPrice(invoice.paid_amount_vat)}</span>
                                            </div>
                                            {invoice.total_amount - invoice.paid_amount_vat > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500">Balance Due</span>
                                                    <span className="font-bold text-red-600">{formatPrice(invoice.total_amount - invoice.paid_amount_vat)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer Notes & Actions */}
                            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row gap-4 justify-between items-center text-zinc-500 text-sm">
                                <p>Thank you for your business!</p>
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
