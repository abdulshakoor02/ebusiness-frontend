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

    const handleDownload = () => {
        if (invoice && tenant && lead) {
            generateInvoicePDF(invoice, {
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                phone: lead.phone,
                designation: lead.designation,
            }, tenant, currency);
        }
    };

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    if (!invoice) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between pr-8">
                        <span>Invoice</span>
                        {invoice.status === "paid" ? (
                            <Badge variant="secondary">PAID</Badge>
                        ) : (
                            <Badge variant="destructive">UNPAID</Badge>
                        )}
                    </DialogTitle>
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
                                    className="w-16 h-16 object-contain"
                                />
                            )}
                            <div>
                                <h3 className="font-bold text-lg">{tenant?.name || "Company"}</h3>
                                {tenant?.address && (
                                    <div className="text-sm text-zinc-500">
                                        {tenant.address.street && <div>{tenant.address.street}</div>}
                                        {tenant.address.address_line && <div>{tenant.address.address_line}</div>}
                                        <div>
                                            {[tenant.address.city, tenant.address.state, tenant.address.zip_code, tenant.address.country].filter(Boolean).join(", ")}
                                        </div>
                                        {tenant.email && <div>{tenant.email}</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-zinc-500">Invoice #</div>
                                <div className="font-semibold">{invoiceNum}</div>
                            </div>
                            <div>
                                <div className="text-sm text-zinc-500">Date</div>
                                <div className="font-semibold">{new Date(invoice.created_at).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-zinc-500">Due Date</div>
                                <div className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-zinc-500">Status</div>
                                <Badge variant={invoice.status === "paid" ? "secondary" : "destructive"}>
                                    {invoice.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Bill To */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-500 mb-2">Bill To:</h4>
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                                <div className="font-semibold">
                                    {lead?.first_name} {lead?.last_name}
                                </div>
                                {lead?.designation && <div className="text-sm text-zinc-500">{lead.designation}</div>}
                                {lead?.email && <div className="text-sm">{lead.email}</div>}
                                {lead?.phone && <div className="text-sm">{lead.phone}</div>}
                            </div>
                        </div>

                        {/* Line Items */}
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-500 mb-2">Items:</h4>
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Item</th>
                                            <th className="text-center p-3 font-medium">Qty</th>
                                            <th className="text-right p-3 font-medium">Unit Price</th>
                                            <th className="text-right p-3 font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {invoice.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3">{item.product_name}</td>
                                                <td className="p-3 text-center">{item.quantity}</td>
                                                <td className="p-3 text-right">{formatPrice(item.unit_price)}</td>
                                                <td className="p-3 text-right">{formatPrice(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Subtotal</span>
                                    <span>{formatPrice(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Discount</span>
                                    <span>-{formatPrice(invoice.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Tax ({invoice.tax_percentage}%)</span>
                                    <span>{formatPrice(invoice.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total</span>
                                    <span>{formatPrice(invoice.total_amount)}</span>
                                </div>
                                {invoice.paid_amount > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Paid</span>
                                            <span>{formatPrice(invoice.paid_amount_vat)}</span>
                                        </div>
                                        {invoice.total_amount - invoice.paid_amount_vat > 0 && (
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span>Remaining</span>
                                                <span>{formatPrice(invoice.total_amount - invoice.paid_amount_vat)}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
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
