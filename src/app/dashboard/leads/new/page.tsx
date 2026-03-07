"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCreateLead, useCreateLeadComment, useLeadCategories, useLeadSources, useCountries, useQualifications } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { LeadSchema, Lead } from "@/lib/schemas";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Combobox } from "@/components/ui/combobox";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// Extended schema to include the optional initial comment field
const newLeadSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    designation: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    category_id: z.string().optional(),
    source_id: z.string().optional(),
    country_id: z.string().optional(),
    qualification_id: z.string().optional(),
    assigned_to: z.string().optional(),
    initial_comment: z.string().optional(),
});
type NewLeadFormValues = z.infer<typeof newLeadSchema>;

export default function NewLeadPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const createLead = useCreateLead();
    const createComment = useCreateLeadComment();
    const { data: categoriesData, isLoading: isLoadingCategories } = useLeadCategories({ limit: 100 });
    const { data: sourcesData, isLoading: isLoadingSources } = useLeadSources({ limit: 100 });
    const { data: countriesData, isLoading: isLoadingCountries } = useCountries({ limit: 200 });
    const { data: qualificationsData, isLoading: isLoadingQualifications } = useQualifications({ limit: 100 });
    const { data: usersData } = useUsers({ limit: 100 });
    
    const categories = categoriesData?.data || [];
    const sources = sourcesData?.data || [];
    const countries = countriesData?.data || [];
    const qualifications = qualificationsData?.data || [];
    const users = usersData?.data || [];

    const countryOptions = countries.map(c => ({ value: c.id, label: c.name }));
    const qualificationOptions = qualifications.map(q => ({ value: q.id, label: q.name }));
    const assignedToOptions = users.map(u => ({ value: u.id, label: u.name }));

    const form = useForm<NewLeadFormValues>({
        resolver: zodResolver(newLeadSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            designation: "",
            email: "",
            phone: "",
            category_id: "",
            source_id: "",
            country_id: "",
            qualification_id: "",
            assigned_to: "",
            initial_comment: "",
        },
    });

    useEffect(() => {
        if (session?.user?.id) {
            form.setValue("assigned_to", session.user.id);
        }
    }, [session, form]);

    function onSubmit(data: NewLeadFormValues) {
        const { initial_comment, ...leadData } = data;
        const payload = { ...leadData, assigned_to: session?.user?.id };

        // First save the lead
        createLead.mutate(payload, {
            onSuccess: (newLead) => {
                // If there's an initial comment, create it using the new lead's ID
                if (initial_comment && initial_comment.trim().length > 0) {
                    createComment.mutate(
                        { lead_id: newLead.id, content: initial_comment },
                        {
                            onSuccess: () => {
                                router.push(`/dashboard/leads/${newLead.id}`);
                            },
                        }
                    );
                } else {
                    router.push(`/dashboard/leads/${newLead.id}`);
                }
            },
        });
    }

    const isPending = createLead.isPending || createComment.isPending;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/leads">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add New Lead</h2>
                    <p className="text-zinc-500">Create a new lead profile in the CRM.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Primary contact details for this lead.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jane" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Smith" {...field} />
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="jane@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+1234567890" {...field} />
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
                            <CardTitle>Professional & Pipeline Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="designation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Designation</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VP of Sales" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <Combobox
                                                options={countryOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select a country"
                                                searchPlaceholder="Search countries..."
                                                emptyText="No countries found"
                                                disabled={isLoadingCountries}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="qualification_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Qualification</FormLabel>
                                            <Combobox
                                                options={qualificationOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select qualification"
                                                searchPlaceholder="Search qualifications..."
                                                emptyText="No qualifications found"
                                                disabled={isLoadingQualifications}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="source_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Source</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingSources}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a source" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">No Source</SelectItem>
                                                    {sources.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="assigned_to"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assigned To</FormLabel>
                                            <Combobox
                                                options={assignedToOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Assign to user"
                                                searchPlaceholder="Search users..."
                                                emptyText="No users found"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Initial Notes</CardTitle>
                            <CardDescription>Optionally add a comment to be saved with this lead immediately.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="initial_comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Initial Comment</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Met at the trade show, seemed very interested in our premium tier..."
                                                className="resize-none h-32"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild disabled={isPending}>
                            <Link href="/dashboard/leads">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Lead
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
