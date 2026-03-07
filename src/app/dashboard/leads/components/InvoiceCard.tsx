"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Invoice, Receipt } from "@/lib/schemas";
import { useInvoiceReceipts } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, ChevronDown, ChevronRight, Receipt as ReceiptIcon } from "lucide-react";

interface InvoiceCardProps {
    invoice: Invoice;
    onEdit: () => void;
    onAddReceipt: () => void;
    onEditReceipt: (receipt: Receipt) => void;
}

export function InvoiceCard({ invoice, onEdit, onAddReceipt, onEditReceipt }: InvoiceCardProps) {
    const { data: session } = useSession();
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: receipts, isLoading: isLoadingReceipts } = useInvoiceReceipts(invoice.id);

    const currency = session?.user?.currency || "USD";
    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    const remainingAmount = invoice.total_amount - invoice.paid_amount_vat;

    const statusVariant: "default" | "secondary" | "outline" | "destructive" = 
        invoice.status === 'paid' ? 'secondary' :
        invoice.status === 'partial' ? 'outline' : 'default';

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            {/* Invoice Header */}
            <div 
                className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">INV-{String(invoice.invoice_number).padStart(3, '0')}</span>
                                <Badge variant={statusVariant}>{invoice.status}</Badge>
                            </div>
                            <div className="text-sm text-zinc-500">
                                {formatPrice(invoice.total_amount)} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        {invoice.status !== 'paid' && (
                            <div className="text-sm text-zinc-500">
                                Paid: {formatPrice(invoice.paid_amount_vat)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                    {/* Invoice Items */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Items</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-3">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-zinc-500">
                                        <th className="pb-2">Product</th>
                                        <th className="pb-2 text-center">Qty</th>
                                        <th className="pb-2 text-right">Unit Price</th>
                                        <th className="pb-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-1">{item.product_name}</td>
                                            <td className="py-1 text-center">{item.quantity}</td>
                                            <td className="py-1 text-right">{formatPrice(item.unit_price)}</td>
                                            <td className="py-1 text-right">{formatPrice(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    <div className="flex justify-between text-sm">
                        <div className="space-y-1">
                            <div className="text-zinc-500">Subtotal</div>
                            <div className="text-zinc-500">Discount</div>
                            <div className="text-zinc-500">Tax ({invoice.tax_percentage}%)</div>
                            <div className="font-medium">Total</div>
                            <div className="text-zinc-500">Paid</div>
                            {invoice.status !== 'paid' && (
                                <div className="font-medium text-green-600">Remaining</div>
                            )}
                        </div>
                        <div className="space-y-1 text-right">
                            <div>{formatPrice(invoice.subtotal)}</div>
                            <div>-{formatPrice(invoice.discount)}</div>
                            <div>{formatPrice(invoice.tax_amount)}</div>
                            <div className="font-medium">{formatPrice(invoice.total_amount)}</div>
                            <div>{formatPrice(invoice.paid_amount_vat)}</div>
                            {invoice.status !== 'paid' && (
                                <div className="font-medium text-green-600">{formatPrice(remainingAmount)}</div>
                            )}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="text-sm text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                    </div>

                    {/* Receipts Section */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <ReceiptIcon className="h-4 w-4" />
                                Receipts
                            </h4>
                            {invoice.status !== 'paid' && (
                                <Button type="button" size="sm" variant="outline" onClick={onAddReceipt}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Receipt
                                </Button>
                            )}
                        </div>
                        
                        {isLoadingReceipts ? (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                            </div>
                        ) : !receipts || receipts.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic py-2">
                                No receipts yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {receipts.map((receipt) => (
                                    <div 
                                        key={receipt.id} 
                                        className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900 rounded-md text-sm"
                                    >
                                        <div>
                                            <span className="font-medium">RCP-{String(receipt.receipt_number).padStart(3, '0')}</span>
                                            <span className="text-zinc-500 ml-2">
                                                {formatPrice(receipt.amount_paid)} (+{formatPrice(receipt.tax_amount)} tax)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 text-xs">
                                                {new Date(receipt.payment_date).toLocaleDateString()}
                                            </span>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6"
                                                onClick={() => onEditReceipt(receipt)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <Button type="button" size="sm" variant="outline" onClick={onEdit} disabled={invoice.status === 'paid'}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit Invoice
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
