"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUpdateInvoice, useInvoice } from "@/hooks/useInvoices";
import { useProducts } from "@/hooks/useProducts";
import { Product, Invoice } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";

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
import { Combobox } from "@/components/ui/combobox";

interface EditInvoiceModalProps {
    invoiceId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface InvoiceItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export function EditInvoiceModal({ invoiceId, open, onOpenChange }: EditInvoiceModalProps) {
    const { data: session } = useSession();
    const updateInvoice = useUpdateInvoice();
    const { data: invoice, isLoading: isLoadingInvoice } = useInvoice(invoiceId || "");
    const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 100 });

    const currency = session?.user?.currency || "USD";

    const products: Product[] = productsData?.data || [];
    const productOptions = products.map(p => ({ value: p.id, label: p.name }));

    const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
    const [showProductSelect, setShowProductSelect] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (invoice && open) {
            setSelectedItems(invoice.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })));
            setDiscount(invoice.discount);
            setDueDate(invoice.due_date.split('T')[0]);
        }
    }, [invoice, open]);

    const subtotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    }, [selectedItems]);

    const taxableAmount = Math.max(0, subtotal - discount);

    const handleAddProduct = (productId: string | undefined) => {
        if (!productId) return;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existing = selectedItems.find(item => item.product_id === productId);
        if (existing) {
            setSelectedItems(items =>
                items.map(item =>
                    item.product_id === productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setSelectedItems(items => [
                ...items,
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: 1,
                    unit_price: product.price,
                }
            ]);
        }
        setShowProductSelect(false);
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedItems(items => items.filter(item => item.product_id !== productId));
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedItems(items =>
            items.map(item =>
                item.product_id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    function onSubmit() {
        if (!invoiceId || selectedItems.length === 0 || !dueDate) return;

        const payload = {
            items: selectedItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
            })),
            discount,
            due_date: new Date(dueDate).toISOString(),
        };

        updateInvoice.mutate(
            { id: invoiceId, data: payload },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedItems([]);
            setDiscount(0);
            setDueDate("");
        }
        onOpenChange(isOpen);
    };

    const formatPrice = (amount: number) => formatCurrency(amount, currency);

    const isPaid = invoice?.status === 'paid';

    if (isLoadingInvoice) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        Invoice #{invoice?.invoice_number}
                        <Badge variant={isPaid ? "secondary" : invoice?.status === 'partial' ? "outline" : "default"}>
                            {invoice?.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        {isPaid ? "This invoice is fully paid and cannot be edited." : "Edit invoice items, discount, or due date."}
                    </DialogDescription>
                </DialogHeader>

                {isPaid ? (
                    <div className="py-6 text-center text-zinc-500">
                        <p>Fully paid invoices cannot be edited.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Products Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Products</div>
                            </div>
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-md">
                                {/* Selected Items */}
                                {selectedItems.length > 0 && (
                                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {selectedItems.map((item) => (
                                            <div key={item.product_id} className="p-3 flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.product_name}</p>
                                                    <p className="text-sm text-zinc-500">{formatPrice(item.unit_price)} each</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                                                        className="w-20 text-center"
                                                    />
                                                    <span className="text-sm text-zinc-500 w-24 text-right">
                                                        {formatPrice(item.unit_price * item.quantity)}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                                        onClick={() => handleRemoveProduct(item.product_id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Product */}
                                <div className="p-3">
                                    {showProductSelect ? (
                                        <div className="space-y-2">
                                            <Combobox
                                                options={productOptions.filter(p => !selectedItems.find(s => s.product_id === p.value)).map(p => ({ value: p.value, label: p.label }))}
                                                value=""
                                                onValueChange={handleAddProduct}
                                                placeholder="Select a product..."
                                                searchPlaceholder="Search products..."
                                                emptyText="No products found"
                                                disabled={isLoadingProducts}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowProductSelect(false)}
                                                className="text-zinc-500"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowProductSelect(true)}
                                            className="w-full"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Product
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {selectedItems.length === 0 && (
                                <p className="text-sm text-zinc-500">Please add at least one product.</p>
                            )}
                        </div>

                        {/* Calculations */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-sm font-medium">Discount</div>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-28 text-right h-8"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-medium">
                                <span>Total</span>
                                <span>{formatPrice(taxableAmount)}</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Tax will be recalculated based on your tenant settings.
                            </p>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Due Date</div>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full"
                            />
                            {!dueDate && <p className="text-sm text-red-500">Due date is required.</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={updateInvoice.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={updateInvoice.isPending || selectedItems.length === 0 || !dueDate}
                                onClick={onSubmit}
                            >
                                {updateInvoice.isPending ? (
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
                )}
            </DialogContent>
        </Dialog>
    );
}
