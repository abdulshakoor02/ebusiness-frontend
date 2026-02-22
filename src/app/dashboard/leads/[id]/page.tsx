"use client";

import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    useLead,
    useUpdateLead,
    useLeadCategories,
    useLeadComments,
    useCreateLeadComment,
    useLeadAppointments
} from "@/hooks/useLeads";
import { LeadSchema, Lead } from "@/lib/schemas";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, MessageSquarePlus, CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";

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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AddAppointmentModal } from "../components/AddAppointmentModal";

const editLeadSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    company: z.string().optional(),
    title: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    status: z.enum(["New", "Contacted", "Qualified", "Lost", "Won"]),
    category_id: z.string().optional(),
    source: z.string().optional(),
});
type EditLeadFormValues = z.infer<typeof editLeadSchema>;

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const leadId = resolvedParams.id;
    const router = useRouter();

    // Queries
    const { data: lead, isLoading: isLoadingLead } = useLead(leadId);
    const { data: categoriesData } = useLeadCategories({ limit: 100 });
    const { data: commentsData, isLoading: isLoadingComments } = useLeadComments(leadId);
    const { data: appointmentsData, isLoading: isLoadingAppointments } = useLeadAppointments(leadId);

    // Mutations
    const updateLead = useUpdateLead();
    const createComment = useCreateLeadComment();

    const categories = categoriesData?.data || [];
    const comments = commentsData?.data || [];
    const appointments = appointmentsData?.data || [];

    // State for Modals & Local Forms
    const [newComment, setNewComment] = useState("");
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

    const form = useForm<EditLeadFormValues>({
        resolver: zodResolver(editLeadSchema),
        values: lead ? {
            first_name: lead.first_name,
            last_name: lead.last_name,
            company: lead.company || "",
            title: lead.title || "",
            email: lead.email || "",
            phone: lead.phone || "",
            status: lead.status as "New" | "Contacted" | "Qualified" | "Lost" | "Won",
            category_id: lead.category_id || "",
            source: lead.source || "",
        } : undefined,
    });

    function onSubmit(data: EditLeadFormValues) {
        updateLead.mutate({ id: leadId, data });
    }

    function handleAddComment() {
        if (!newComment.trim()) return;
        createComment.mutate(
            { lead_id: leadId, content: newComment },
            {
                onSuccess: () => setNewComment(""),
            }
        );
    }

    if (isLoadingLead) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500">Lead not found</p>
                <Button variant="link" asChild><Link href="/dashboard/leads">Back to Leads</Link></Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/leads">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {lead.first_name} {lead.last_name}
                    </h2>
                    <p className="text-zinc-500">View and edit lead details, comments, and appointments.</p>
                </div>
            </div>

            {/* Main Lead Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
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
                                            <FormControl><Input {...field} /></FormControl>
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
                                            <FormControl><Input type="email" {...field} /></FormControl>
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
                                            <FormControl><Input type="tel" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lead Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="New">New</SelectItem>
                                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                                    <SelectItem value="Qualified">Qualified</SelectItem>
                                                    <SelectItem value="Lost">Lost</SelectItem>
                                                    <SelectItem value="Won">Won</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
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
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Source</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={updateLead.isPending}>
                            {updateLead.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" />Save Changes</>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="space-y-4">
                <Accordion type="multiple" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg" defaultValue={["comments", "appointments"]}>

                    {/* Comments Accordion */}
                    <AccordionItem value="comments" className="px-6">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                            <span className="flex items-center gap-2">
                                <MessageSquarePlus className="h-5 w-5 text-zinc-500" />
                                Comments & Notes
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pb-6">
                            <div className="flex flex-col gap-3">
                                <Textarea
                                    placeholder="Add a new note to this lead..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="resize-none h-24"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddComment}
                                        disabled={createComment.isPending || !newComment.trim()}
                                    >
                                        {createComment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Post Comment"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {isLoadingComments ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
                                ) : comments.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic py-4 text-center bg-zinc-50 dark:bg-zinc-900 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
                                        No comments yet.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-medium text-zinc-500">User {comment.author_id.slice(-4)}</span>
                                                    <span className="text-xs text-zinc-400">{new Date(comment.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Appointments Accordion */}
                    <AccordionItem value="appointments" className="px-6 border-b-0">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-zinc-500" />
                                Appointments
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-6">
                            <div className="flex justify-end">
                                <Button type="button" size="sm" onClick={() => setIsAppointmentModalOpen(true)}>
                                    Schedule Appointment
                                </Button>
                            </div>

                            {isLoadingAppointments ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
                            ) : appointments.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic py-4 text-center bg-zinc-50 dark:bg-zinc-900 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
                                    No appointments scheduled.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.map((apt) => (
                                        <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    {apt.status === 'completed' ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : apt.status === 'cancelled' ? (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-blue-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{apt.title}</h4>
                                                    <p className="text-sm text-zinc-500">
                                                        {new Date(apt.start_time).toLocaleString()} - {new Date(apt.end_time).toLocaleTimeString()}
                                                    </p>
                                                    {apt.description && (
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{apt.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    apt.status === 'completed' ? 'secondary' :
                                                        apt.status === 'cancelled' ? 'destructive' : 'default'
                                                }>
                                                    {apt.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <AddAppointmentModal
                leadId={leadId}
                open={isAppointmentModalOpen}
                onOpenChange={setIsAppointmentModalOpen}
            />
        </div>
    );
}
