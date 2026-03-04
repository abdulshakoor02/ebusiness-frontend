"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateRule, useUpdateRule, PermissionRule, CreateRuleInput, ScopeType, FilterField } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RuleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule?: PermissionRule | null;
}

const ruleFormSchema = z.object({
    resource: z.string().min(1, "Resource is required"),
    resource_label: z.string().min(1, "Resource label is required"),
    action: z.string().min(1, "Action is required"),
    action_label: z.string().min(1, "Action label is required"),
    path: z.string().optional(),
    method: z.string().optional(),
    description: z.string().optional(),
    scope_type: z.enum(["none", "self", "group"]).optional(),
    filter_field: z.enum(["assigned_to", "created_by"]).optional(),
}).refine((data) => {
    if (data.scope_type && data.scope_type !== "none" && !data.filter_field) {
        return false;
    }
    return true;
}, {
    message: "Filter field is required when scope type is not 'none'",
    path: ["filter_field"],
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export function RuleFormModal({ open, onOpenChange, rule }: RuleFormModalProps) {
    const createRule = useCreateRule();
    const updateRule = useUpdateRule();
    const isEditing = !!rule?.id;

    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: {
            resource: "",
            resource_label: "",
            action: "",
            action_label: "",
            path: "",
            method: "",
            description: "",
            scope_type: "none",
            filter_field: undefined,
        },
    });

    const scopeType = form.watch("scope_type");

    // Reset form when rule or open state changes
    useEffect(() => {
        form.reset({
            resource: rule?.resource || "",
            resource_label: rule?.resource_label || "",
            action: rule?.action || "",
            action_label: rule?.action_label || "",
            path: rule?.path || "",
            method: rule?.method || "",
            description: rule?.description || "",
            scope_type: rule?.scope_type || "none",
            filter_field: rule?.filter_field || undefined,
        });
    }, [rule, open, form]);

    function onSubmit(data: RuleFormValues) {
        const processedData = {
            ...data,
            method: data.method === "__clear__" ? "" : data.method,
        };

        if (isEditing && rule?.id) {
            updateRule.mutate(
                { id: rule.id, data: processedData },
                {
                    onSuccess: () => {
                        form.reset();
                        onOpenChange(false);
                    },
                }
            );
        } else {
            createRule.mutate(processedData, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            });
        }
    }

    const isPending = createRule.isPending || updateRule.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Permission Rule" : "Create Permission Rule"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the permission rule details. System rules can only have labels/description updated."
                            : "Create a new custom permission rule."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="resource"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resource Key</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., users"
                                                disabled={isEditing && rule?.is_system}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="resource_label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resource Label</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., User Management" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="action"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Action Key</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., create"
                                                disabled={isEditing && rule?.is_system}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="action_label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Action Label</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Create User" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="path"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Path (optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., /api/users" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Method (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="__clear__">None</SelectItem>
                                                {HTTP_METHODS.map((method) => (
                                                    <SelectItem key={method} value={method}>
                                                        {method}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this permission allows..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scope_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Scope Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isEditing && rule?.is_system}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select scope type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="self">Self</SelectItem>
                                                <SelectItem value="group">Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Self = own records only, Group = team records
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="filter_field"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Filter Field</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value || ""}
                                            disabled={scopeType === "none" || (isEditing && rule?.is_system)}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select filter field" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="assigned_to">assigned_to</SelectItem>
                                                <SelectItem value="created_by">created_by</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {scopeType === "none" ? "Set scope type first" : "Field to filter by"}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    isEditing ? "Update Rule" : "Create Rule"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}