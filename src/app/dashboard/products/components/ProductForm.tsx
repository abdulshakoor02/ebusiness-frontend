"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/lib/schemas";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

interface ProductFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product;
}

const productFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.string().min(1, "Price is required"),
});
type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductFormModal({ open, onOpenChange, product }: ProductFormModalProps) {
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const isEditing = !!product;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            description: "",
            price: "",
        },
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name || "",
                description: product.description || "",
                price: String(product.price || ""),
            });
        } else {
            form.reset({
                name: "",
                description: "",
                price: "",
            });
        }
    }, [product, form]);

    function onSubmit(data: ProductFormValues) {
        const payload = {
            name: data.name,
            description: data.description || undefined,
            price: parseFloat(data.price),
        };
        if (isEditing && product) {
            updateProduct.mutate(
                { id: product.id, data: payload },
                {
                    onSuccess: () => {
                        form.reset();
                        onOpenChange(false);
                    }
                }
            );
        } else {
            createProduct.mutate(payload, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            });
        }
    }

    const isPending = createProduct.isPending || updateProduct.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the details of this product."
                            : "Create a new product for your inventory."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. CRM License - Annual" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Optional description of the product..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onOpenChange(false);
                                }}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? "Saving..." : "Creating..."}
                                    </>
                                ) : (
                                    isEditing ? "Save Changes" : "Create Product"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
