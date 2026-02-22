"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTenantInput, CreateTenantSchema } from "@/lib/schemas";
import { useCreateTenant } from "@/hooks/useTenants";
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
import { Separator } from "@/components/ui/separator";

interface TenantFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TenantFormModal({ open, onOpenChange }: TenantFormModalProps) {
    const createTenant = useCreateTenant();

    const form = useForm<CreateTenantInput>({
        resolver: zodResolver(CreateTenantSchema),
        defaultValues: {
            name: "",
            email: "",
            logo_url: "",
            address: {
                city: "",
                country: "",
            },
            admin_user: {
                name: "",
                email: "",
                mobile: "",
                password: "",
                role: "admin",
            },
        },
    });

    function onSubmit(data: CreateTenantInput) {
        createTenant.mutate(data, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Tenant</DialogTitle>
                    <DialogDescription>
                        Add a new organization to the ERP. They will receive an email to begin setup.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Organization Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Organization Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Corp" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@acme.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address.city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="San Francisco" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="USA" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="logo_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Logo URL (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/logo.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator className="my-4" />

                        {/* Admin User Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Initial Administrator</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="admin_user.name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admin Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jane Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="admin_user.email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admin Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="jane@acme.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="admin_user.mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admin Mobile</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+1234567890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="admin_user.password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Temporary Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createTenant.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createTenant.isPending}>
                                {createTenant.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Tenant"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
