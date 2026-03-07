"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tenant, CreateTenantSchema, EditTenantSchema } from "@/lib/schemas";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenants";
import { useCountries } from "@/hooks/useLeads";
import { Loader2 } from "lucide-react";
import * as z from "zod";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TenantFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant?: Tenant;
}

export function TenantFormModal({ open, onOpenChange, tenant }: TenantFormModalProps) {
    const createTenant = useCreateTenant();
    const updateTenant = useUpdateTenant();
    const isEditing = !!tenant;
    const { data: countriesData } = useCountries({ limit: 200 });
    const countries = countriesData?.data || [];

    const createForm = useForm({
        resolver: zodResolver(CreateTenantSchema),
        defaultValues: {
            name: "",
            email: "",
            logo_url: "",
            country_id: "",
            tax: "",
            address: {
                street: "",
                address_line: "",
                city: "",
                state: "",
                country: "",
                zip_code: "",
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

    const editForm = useForm({
        resolver: zodResolver(EditTenantSchema),
        defaultValues: {
            name: "",
            email: "",
            logo_url: "",
            country_id: "",
            tax: "",
            address: {
                street: "",
                address_line: "",
                city: "",
                state: "",
                country: "",
                zip_code: "",
            },
        },
    });

    useEffect(() => {
        if (tenant) {
            editForm.reset({
                name: tenant.name || "",
                email: tenant.email || "",
                logo_url: tenant.logo_url || "",
                country_id: tenant.country_id || "",
                tax: tenant.tax ? String(tenant.tax) : "",
                address: {
                    street: tenant.address?.street || "",
                    address_line: tenant.address?.address_line || "",
                    city: tenant.address?.city || "",
                    state: tenant.address?.state || "",
                    country: tenant.address?.country || "",
                    zip_code: tenant.address?.zip_code || "",
                },
            });
        } else {
            createForm.reset({
                name: "",
                email: "",
                logo_url: "",
                country_id: "",
                tax: "",
                address: {
                    street: "",
                    address_line: "",
                    city: "",
                    state: "",
                    country: "",
                    zip_code: "",
                },
                admin_user: {
                    name: "",
                    email: "",
                    mobile: "",
                    password: "",
                    role: "admin",
                },
            });
        }
    }, [tenant, open, editForm, createForm]);

    function onCreateSubmit(data: any) {
        const payload = {
            ...data,
            country_id: data.country_id || undefined,
            tax: data.tax ? parseFloat(data.tax) : undefined,
        };
        createTenant.mutate(payload, {
            onSuccess: () => {
                createForm.reset();
                onOpenChange(false);
            },
        });
    }

    function onEditSubmit(data: any) {
        if (!tenant) return;
        const payload = {
            ...data,
            country_id: data.country_id || undefined,
            tax: data.tax ? parseFloat(data.tax) : undefined,
            next_invoice_number: tenant.next_invoice_number,
            next_receipt_number: tenant.next_receipt_number,
        };
        updateTenant.mutate(
            { id: tenant.id, data: payload },
            {
                onSuccess: () => {
                    editForm.reset();
                    onOpenChange(false);
                },
            }
        );
    }

    const isPending = createTenant.isPending || updateTenant.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Tenant" : "Create New Tenant"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the organization details."
                            : "Add a new organization to the ERP. They will receive an email to begin setup."}
                    </DialogDescription>
                </DialogHeader>

                {isEditing ? (
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Organization Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
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
                                        control={editForm.control}
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
                                        control={editForm.control}
                                        name="country_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a country" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.id} value={country.id}>
                                                                {country.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="tax"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Percentage (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g. 5.0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={editForm.control}
                                    name="address.street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Street Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Tech Lane" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="address.address_line"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Suite 100, Floor 2" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
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
                                        control={editForm.control}
                                        name="address.state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={editForm.control}
                                        name="address.zip_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ZIP/Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="94105" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="address.country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="USA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={editForm.control}
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

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Organization Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                        control={createForm.control}
                                        name="country_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a country" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.id} value={country.id}>
                                                                {country.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="tax"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Percentage (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g. 5.0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={createForm.control}
                                    name="address.street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Street Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Tech Lane" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={createForm.control}
                                    name="address.address_line"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Suite 100, Floor 2" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
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
                                        control={createForm.control}
                                        name="address.state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
                                        name="address.zip_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ZIP/Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="94105" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="address.country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="USA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={createForm.control}
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

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Initial Administrator</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                        control={createForm.control}
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
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
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
                )}
            </DialogContent>
        </Dialog>
    );
}
