"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLeads, useLeadCategories } from "@/hooks/useLeads";
import { DateRangePicker, type DateField } from "@/components/date-range-picker";
import { Plus, Search, MoreHorizontal, Pencil, CalendarPlus, Loader2, ChevronLeft, ChevronRight, FileText, Phone, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { AddAppointmentModal } from "./components/AddAppointmentModal";
import { AddFollowUpModal } from "./components/AddFollowUpModal";
import { CreateInvoiceModal } from "./components/CreateInvoiceModal";

export default function LeadsPage() {
    const router = useRouter();
    
    // Filter states
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Date filter states
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [dateField, setDateField] = useState<DateField>('created_at');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedCategory, pageSize, startDate, endDate, dateField]);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    const formatDateForAPI = (date: Date | undefined): string | undefined => {
        if (!date) return undefined;
        return date.toISOString();
    };

    // Fetch leads with filters and pagination
    const { data, isLoading } = useLeads({
        search: searchQuery,
        category_id: selectedCategory,
        date_from: startDate ? formatDateForAPI(startDate) : undefined,
        date_to: endDate ? formatDateForAPI(endDate) : undefined,
        date_field: startDate && endDate ? dateField : undefined,
        limit: pageSize,
        offset,
    });

    const total = data?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Fetch categories for dropdown
    const { data: categoriesData } = useLeadCategories({ limit: 100 });
    const categories = categoriesData?.data || [];

    // Appointment Modal State
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [appointmentLeadId, setAppointmentLeadId] = useState<string | null>(null);

    // Follow-Up Modal State
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);

    // Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceLeadId, setInvoiceLeadId] = useState<string | null>(null);

    const leads = data?.data || [];

    const handleAddAppointment = (leadId: string) => {
        setAppointmentLeadId(leadId);
        setIsAppointmentModalOpen(true);
    };

    const handleAddFollowUp = (leadId: string) => {
        setFollowUpLeadId(leadId);
        setIsFollowUpModalOpen(true);
    };

    const handleCreateInvoice = (leadId: string) => {
        setInvoiceLeadId(leadId);
        setIsInvoiceModalOpen(true);
    };

    const navigateToEdit = (leadId: string) => {
        router.push(`/dashboard/leads/${leadId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
                    <p className="text-zinc-500">Manage and track your pipeline of potential customers.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/leads/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Lead
                    </Link>
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-9"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select
                            value={selectedCategory || "all"}
                            onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            dateField={dateField}
                            onDateFieldChange={setDateField}
                            showFieldSelector={true}
                            placeholder="Filter by date"
                        />
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => setPageSize(Number(value))}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                        <p>No leads found in the pipeline.</p>
                        <Button variant="link" asChild>
                            <Link href="/dashboard/leads/new">Import or create the first one</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead Name</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Qualification</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Comments</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map((lead) => (
                                        <TableRow key={lead.id} className="cursor-pointer group" onClick={() => navigateToEdit(lead.id)}>
                                            <TableCell className="font-medium group-hover:underline">
                                                {lead.first_name} {lead.last_name}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">
                                                {lead.designation || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {lead.country?.name ? (
                                                    <span className="text-sm">{lead.country.name}</span>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {lead.qualification?.name ? (
                                                    <span className="text-sm">{lead.qualification.name}</span>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {lead.category?.name ? (
                                                    <Badge variant="outline">
                                                        {lead.category.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {lead.assigned_to_user?.name ? (
                                                    <span className="text-sm">{lead.assigned_to_user.name}</span>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[250px]">
                                                {lead.comments ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-start gap-2 cursor-default">
                                                                    <MessageSquare className="h-4 w-4 mt-0.5 text-zinc-400 flex-shrink-0" />
                                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 text-left">
                                                                        {lead.comments}
                                                                    </p>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent 
                                                                side="top" 
                                                                className="max-w-[350px] p-3 text-sm bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg shadow-lg"
                                                            >
                                                                <p className="whitespace-pre-wrap break-words">{lead.comments}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-sm">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigateToEdit(lead.id)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            View / Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAddAppointment(lead.id)}>
                                                            <CalendarPlus className="mr-2 h-4 w-4 text-blue-500" />
                                                            Add Appointment
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAddFollowUp(lead.id)}>
                                                            <Phone className="mr-2 h-4 w-4 text-orange-500" />
                                                            Add Follow Up
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCreateInvoice(lead.id)}>
                                                            <FileText className="mr-2 h-4 w-4 text-green-600" />
                                                            Create Invoice
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="text-sm text-zinc-500">
                                Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total} leads
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={!hasPrevPage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-zinc-500">
                                    Page {page} of {totalPages || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!hasNextPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <AddAppointmentModal
                leadId={appointmentLeadId}
                open={isAppointmentModalOpen}
                onOpenChange={setIsAppointmentModalOpen}
            />

            <AddFollowUpModal
                leadId={followUpLeadId}
                open={isFollowUpModalOpen}
                onOpenChange={setIsFollowUpModalOpen}
            />

            <CreateInvoiceModal
                leadId={invoiceLeadId}
                open={isInvoiceModalOpen}
                onOpenChange={setIsInvoiceModalOpen}
            />
        </div>
    );
}
