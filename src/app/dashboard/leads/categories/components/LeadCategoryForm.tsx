"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeadCategorySchema, LeadCategory } from "@/lib/schemas";
import { useCreateLeadCategory, useUpdateLeadCategory } from "@/hooks/useLeads";
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

interface LeadCategoryFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: LeadCategory;
}

// We extract just the fields needed for creation/updating from the main schema
const categoryFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function LeadCategoryFormModal({ open, onOpenChange, category }: LeadCategoryFormModalProps) {
    const createCategory = useCreateLeadCategory();
    const updateCategory = useUpdateLeadCategory();
    const isEditing = !!category;

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: category?.name || "",
            description: category?.description || "",
        },
    });

    useEffect(() => {
        form.reset({
            name: category?.name || "",
            description: category?.description || "",
        });
    }, [category, form]);

    function onSubmit(data: CategoryFormValues) {
        if (isEditing && category) {
            updateCategory.mutate(
                { id: category.id, data },
                {
                    onSuccess: () => {
                        form.reset();
                        onOpenChange(false);
                    }
                }
            );
        } else {
            createCategory.mutate(data, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            });
        }
    }

    const isPending = createCategory.isPending || updateCategory.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the details of this lead category."
                            : "Create a new category to group related leads."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. High Priority, Cold Lead" {...field} />
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
                                            placeholder="Optional description of when to use this category..."
                                            className="resize-none"
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
                                    isEditing ? "Save Changes" : "Create Category"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
