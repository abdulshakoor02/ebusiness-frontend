"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAddPolicy } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface PermissionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const permissionFormSchema = z.object({
    sub: z.string().min(1, "Subject (Role/User) is required"),
    obj: z.string().min(1, "Object (Resource) is required"),
    act: z.string().min(1, "Action is required"),
});

type PermissionFormValues = z.infer<typeof permissionFormSchema>;

export function PermissionFormModal({ open, onOpenChange }: PermissionFormModalProps) {
    const addPolicy = useAddPolicy();

    const form = useForm<PermissionFormValues>({
        resolver: zodResolver(permissionFormSchema),
        defaultValues: {
            sub: "",
            obj: "tenant",
            act: "read",
        },
    });

    function onSubmit(data: PermissionFormValues) {
        addPolicy.mutate(data, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Access Policy</DialogTitle>
                    <DialogDescription>
                        Grant a role or user specific access to a system resource.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

                        <FormField
                            control={form.control}
                            name="sub"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role or User ID (Subject)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., manager or user-123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="obj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resource (Object)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Resource" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="tenant">Tenant</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="billing">Billing</SelectItem>
                                                <SelectItem value="dashboard">Dashboard</SelectItem>
                                                <SelectItem value="*">All (*)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="act"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Action</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Action" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="read">Read</SelectItem>
                                                <SelectItem value="write">Write</SelectItem>
                                                <SelectItem value="delete">Delete</SelectItem>
                                                <SelectItem value="manage">Manage (All)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addPolicy.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addPolicy.isPending}>
                                {addPolicy.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Policy"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
