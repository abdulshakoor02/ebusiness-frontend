"use client";

import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { TenantFormModal } from "./components/TenantForm";

export default function TenantsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading, isError } = useTenants({ name: searchTerm || undefined });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
                    <p className="text-zinc-500 mt-1">Manage global organizations and their sub-resources.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tenant
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search organizations..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                {/* Table logic simplified here out of raw Tanstack table for speed/layout demonstration - usually we embed a robust <DataTable> here */}
                {isLoading ? (
                    <div className="p-8 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">Failed to load tenants. Please try again.</div>
                ) : data?.data?.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">No tenants found. Try creating one!</div>
                ) : (
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Organization</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Location</th>
                                    <th className="px-6 py-4 font-medium">Created On</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data?.data?.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                                {tenant.logo_url ? <img src={tenant.logo_url} className="h-full w-full object-cover" alt="Logo" /> : tenant.name.substring(0, 2)}
                                            </div>
                                            {tenant.name}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{tenant.email}</td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            {tenant.address?.city ? `${tenant.address.city}, ${tenant.address.country}` : "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <TenantFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </div>
    );
}
