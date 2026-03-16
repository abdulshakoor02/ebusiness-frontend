"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCurrentTenant, useUpdateCurrentTenant } from "@/hooks/useTenant";
import { useNextcloudUpload } from "@/hooks/useNextcloudUpload";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const companyInfoSchema = z.object({
    name: z.string().min(1, "Company name is required"),
    email: z.string().email("Invalid email address"),
    address: z.object({
        street: z.string().optional(),
        address_line: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip_code: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
});

type CompanyInfoFormValues = z.infer<typeof companyInfoSchema>;

export default function CompanyInfoPage() {
    const { data: tenant, isLoading } = useCurrentTenant();
    const updateTenant = useUpdateCurrentTenant();
    const { uploadToNextcloud, deleteFromNextcloud, isUploading } = useNextcloudUpload();

    const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedStamp, setSelectedStamp] = useState<File | null>(null);
    const [stampPreview, setStampPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampFileInputRef = useRef<HTMLInputElement>(null);

    const getProxyImageUrl = (url: string) => {
        if (!url) return null;
        const encodedUrl = encodeURIComponent(url);
        return `/api/nextcloud/image?url=${encodedUrl}`;
    };

    const form = useForm<CompanyInfoFormValues>({
        resolver: zodResolver(companyInfoSchema),
        defaultValues: {
            name: "",
            email: "",
            address: {
                street: "",
                address_line: "",
                city: "",
                state: "",
                zip_code: "",
                country: "",
            },
        },
    });

    useEffect(() => {
        if (tenant) {
            form.reset({
                name: tenant.name || "",
                email: tenant.email || "",
                address: {
                    street: tenant.address?.street || "",
                    address_line: tenant.address?.address_line || "",
                    city: tenant.address?.city || "",
                    state: tenant.address?.state || "",
                    zip_code: tenant.address?.zip_code || "",
                    country: tenant.address?.country || "",
                },
            });
            setSelectedLogo(null);
            setLogoPreview(tenant.logo_url ? getProxyImageUrl(tenant.logo_url) : null);
            setSelectedStamp(null);
            setStampPreview(tenant.stamp_url ? getProxyImageUrl(tenant.stamp_url) : null);
        }
    }, [tenant, form]);

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSelectedLogo = () => {
        setSelectedLogo(null);
        setLogoPreview(tenant?.logo_url ? getProxyImageUrl(tenant.logo_url) : null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedStamp(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setStampPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSelectedStamp = () => {
        setSelectedStamp(null);
        setStampPreview(tenant?.stamp_url ? getProxyImageUrl(tenant.stamp_url) : null);
        if (stampFileInputRef.current) {
            stampFileInputRef.current.value = "";
        }
    };

    async function onSubmit(data: CompanyInfoFormValues) {
        if (!tenant) return;

        let logoUrl: string | undefined = undefined;
        let stampUrl: string | undefined = undefined;

        if (selectedLogo) {
            if (tenant.logo_url) {
                await deleteFromNextcloud(tenant.logo_url);
            }
            const uploadedUrl = await uploadToNextcloud(data.name, selectedLogo);
            if (uploadedUrl) {
                logoUrl = uploadedUrl;
            }
        }

        if (selectedStamp) {
            if (tenant.stamp_url) {
                await deleteFromNextcloud(tenant.stamp_url);
            }
            const uploadedUrl = await uploadToNextcloud(data.name, selectedStamp);
            if (uploadedUrl) {
                stampUrl = uploadedUrl;
            }
        }

        const payload = {
            ...data,
            logo_url: logoUrl,
            stamp_url: stampUrl,
        };

        updateTenant.mutate(payload);
    }

    const isPending = updateTenant.isPending || isUploading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Company Information</h2>
                <p className="text-zinc-500">View and update your company details.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Your company name and business email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Logo & Stamp</CardTitle>
                            <CardDescription>Upload your company logo and stamp for invoices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <FormLabel>Logo (Optional)</FormLabel>
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.svg"
                                        onChange={handleLogoFileChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                        id="logo-upload-company"
                                    />
                                    {logoPreview ? (
                                        <div className="space-y-2">
                                            <div className="relative w-32 h-32 border rounded-md overflow-hidden group">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        clearSelectedLogo();
                                                    }}
                                                    disabled={isPending}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <label
                                                htmlFor="logo-upload-company"
                                                className="block text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                                            >
                                                Click to replace image
                                            </label>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="logo-upload-company"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                                            <span className="text-sm text-zinc-500">Click to upload</span>
                                            <span className="text-xs text-zinc-400">PNG, JPG, SVG (max 5MB)</span>
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <FormLabel>Stamp (Optional)</FormLabel>
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.svg"
                                        onChange={handleStampFileChange}
                                        ref={stampFileInputRef}
                                        className="hidden"
                                        id="stamp-upload-company"
                                    />
                                    {stampPreview ? (
                                        <div className="space-y-2">
                                            <div className="relative w-32 h-32 border rounded-md overflow-hidden group">
                                                <img
                                                    src={stampPreview}
                                                    alt="Stamp preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        clearSelectedStamp();
                                                    }}
                                                    disabled={isPending}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <label
                                                htmlFor="stamp-upload-company"
                                                className="block text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                                            >
                                                Click to replace image
                                            </label>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="stamp-upload-company"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                                            <span className="text-sm text-zinc-500">Click to upload</span>
                                            <span className="text-xs text-zinc-400">PNG, JPG, SVG (max 5MB)</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                            <CardDescription>Your company address for invoices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
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
                                control={form.control}
                                name="address.address_line"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 2</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Suite, Apt, Unit, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address.city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="New York" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State / Province</FormLabel>
                                            <FormControl>
                                                <Input placeholder="NY" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.zip_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ZIP / Postal Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="10001" {...field} />
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
                                                <Input placeholder="United States" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
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
        </div>
    );
}
