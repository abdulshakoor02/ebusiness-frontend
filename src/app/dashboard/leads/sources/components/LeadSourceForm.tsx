"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeadSourceSchema, LeadSource } from "@/lib/schemas";
import { useCreateLeadSource, useUpdateLeadSource } from "@/hooks/useLeads";
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

interface LeadSourceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    source?: LeadSource;
}

const sourceFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});
type SourceFormValues = z.infer<typeof sourceFormSchema>;

export function LeadSourceFormModal({ open, onOpenChange, source }: LeadSourceFormModalProps) {
    const createSource = useCreateLeadSource();
    const updateSource = useUpdateLeadSource();
    const isEditing = !!source;

    const form = useForm<SourceFormValues>({
        resolver: zodResolver(sourceFormSchema),
        defaultValues: {
            name: source?.name || "",
            description: source?.description || "",
        },
    });

    function onSubmit(data: SourceFormValues) {
        if (isEditing && source) {
            updateSource.mutate(
                { id: source.id, data },
                {
                    onSuccess: () => {
                        form.reset();
                        onOpenChange(false);
                    }
                }
            );
        } else {
            createSource.mutate(data, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            });
        }
    }

    const isPending = createSource.isPending || updateSource.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Source" : "Add New Source"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the details of this lead source."
                            : "Create a new source to track exactly where leads came from."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Source Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Website Signup, Referral" {...field} />
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
                                            placeholder="Optional description of this origination source..."
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
                                    isEditing ? "Save Changes" : "Create Source"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
