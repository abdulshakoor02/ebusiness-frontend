"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/lib/schemas";
import { Plus, Search, MoreHorizontal, Pencil, CalendarPlus, Loader2 } from "lucide-react";

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

import { AddAppointmentModal } from "./components/AddAppointmentModal";

export default function LeadsPage() {
    const router = useRouter();
    const { data, isLoading } = useLeads();

    // Appointment Modal State
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [appointmentLeadId, setAppointmentLeadId] = useState<string | null>(null);

    const leads = data?.data || [];

    const handleAddAppointment = (leadId: string) => {
        setAppointmentLeadId(leadId);
        setIsAppointmentModalOpen(true);
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
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Filter leads..."
                            className="pl-9"
                        />
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
                                            {typeof lead.country_id === 'object' && lead.country_id !== null ? (
                                                <span className="text-sm">{lead.country_id.name || "-"}</span>
                                            ) : lead.country_id ? (
                                                <span className="text-sm">{lead.country_id}</span>
                                            ) : (
                                                <span className="text-zinc-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof lead.qualification_id === 'object' && lead.qualification_id !== null ? (
                                                <span className="text-sm">{lead.qualification_id.name || "-"}</span>
                                            ) : lead.qualification_id ? (
                                                <span className="text-sm">{lead.qualification_id}</span>
                                            ) : (
                                                <span className="text-zinc-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof lead.category_id === 'object' && lead.category_id !== null ? (
                                                <Badge variant="outline">
                                                    {lead.category_id.name || "Category"}
                                                </Badge>
                                            ) : lead.category_id ? (
                                                <Badge variant="outline">
                                                    {lead.category_id}
                                                </Badge>
                                            ) : (
                                                <span className="text-zinc-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {typeof lead.assigned_to === 'object' && lead.assigned_to !== null ? (
                                                <span className="text-sm">{lead.assigned_to.name || "-"}</span>
                                            ) : lead.assigned_to ? (
                                                <span className="text-sm">{lead.assigned_to}</span>
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
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <AddAppointmentModal
                leadId={appointmentLeadId}
                open={isAppointmentModalOpen}
                onOpenChange={setIsAppointmentModalOpen}
            />
        </div>
    );
}
