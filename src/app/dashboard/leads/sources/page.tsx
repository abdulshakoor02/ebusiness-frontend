"use client";

import { useState } from "react";
import { useLeadSources, useDeleteLeadSource } from "@/hooks/useLeads";
import { LeadSource } from "@/lib/schemas";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { LeadSourceFormModal } from "./components/LeadSourceForm";

export default function LeadSourcesPage() {
    const { data, isLoading } = useLeadSources();
    const deleteSource = useDeleteLeadSource();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<LeadSource | undefined>();

    // Delete Confirmation State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

    const sources = data?.data || [];

    const handleCreateNew = () => {
        setSelectedSource(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (source: LeadSource) => {
        setSelectedSource(source);
        setIsFormOpen(true);
    };

    const confirmDelete = (id: string) => {
        setSourceToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const executeDelete = () => {
        if (sourceToDelete) {
            deleteSource.mutate(sourceToDelete, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setSourceToDelete(null);
                }
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Lead Sources</h2>
                    <p className="text-zinc-500">Manage origination sources for your leads.</p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add Source
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Filter sources (UI Only)..."
                            className="pl-9"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                ) : sources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                        <p>No lead sources found.</p>
                        <Button variant="link" onClick={handleCreateNew}>Create the first one</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sources.map((source) => (
                                    <TableRow key={source.id}>
                                        <TableCell className="font-medium">{source.name}</TableCell>
                                        <TableCell className="text-zinc-500">{source.description || "-"}</TableCell>
                                        <TableCell className="text-zinc-500">
                                            {new Date(source.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(source)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => confirmDelete(source.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
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

            {/* Modals */}
            <LeadSourceFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                source={selectedSource}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the lead source.
                            Note: Deletion will fail if leads are currently tracking this source.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteSource.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                executeDelete();
                            }}
                            disabled={deleteSource.isPending}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleteSource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

