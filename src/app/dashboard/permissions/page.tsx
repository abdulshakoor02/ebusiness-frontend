"use client";

import { usePolicies, useRoleInheritances, useRemovePolicy } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { PermissionFormModal } from "./components/PermissionForm";

export default function PermissionsPage() {
    const policiesQuery = usePolicies();
    const inheritancesQuery = useRoleInheritances();
    const removePolicy = useRemovePolicy();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRemove = (sub: string, obj: string, act: string) => {
        if (confirm(`Are you sure you want to remove ${act} access on ${obj} from ${sub}?`)) {
            removePolicy.mutate({ sub, obj, act });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
                    <p className="text-zinc-500 mt-1">Manage role-based access control (RBAC) policies and inheritances.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Policy
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policies Table */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-lg">
                        <ShieldAlert className="h-4 w-4 text-indigo-500" />
                        <h3 className="font-semibold text-sm">Active Policies</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {policiesQuery.isLoading ? (
                            <div className="p-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                            </div>
                        ) : policiesQuery.isError ? (
                            <div className="p-8 text-center text-red-500 text-sm">Failed to load policies.</div>
                        ) : policiesQuery.data?.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">No policies found.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 uppercase border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Role/User</th>
                                        <th className="px-4 py-3 font-medium">Resource</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                        <th className="px-4 py-3 font-medium text-right">Remove</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {policiesQuery.data?.map((policy, idx) => {
                                        // Assuming policy comes back as ["p", "admin", "tenant", "read"] or ["admin", "tenant", "read"]
                                        // Adapt indexing based on how Casbin returns the 2D array via the API
                                        const offset = policy[0] === "p" ? 1 : 0;
                                        const sub = policy[offset];
                                        const obj = policy[offset + 1];
                                        const act = policy[offset + 2];

                                        if (!sub || !obj || !act) return null;

                                        return (
                                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{sub}</td>
                                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{obj}</td>
                                                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-mono text-xs border border-transparent">
                                                    <span className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">{act}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                                        onClick={() => handleRemove(sub, obj, act)}
                                                        disabled={removePolicy.isPending && removePolicy.variables?.sub === sub && removePolicy.variables?.obj === obj}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Role Inheritances Table */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col items-start h-fit">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-lg w-full">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <h3 className="font-semibold text-sm">Role Inheritances</h3>
                    </div>
                    <div className="w-full overflow-auto">
                        {inheritancesQuery.isLoading ? (
                            <div className="p-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                            </div>
                        ) : inheritancesQuery.isError ? (
                            <div className="p-8 text-center text-red-500 text-sm">Failed to load inheritances.</div>
                        ) : inheritancesQuery.data?.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">No role inheritances found.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 uppercase border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Child Role</th>
                                        <th className="px-4 py-3 font-medium">Inherits From (Parent)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {inheritancesQuery.data?.map((inh, idx) => {
                                        const offset = inh[0] === "g" ? 1 : 0;
                                        const child = inh[offset];
                                        const parent = inh[offset + 1];

                                        if (!child || !parent) return null;

                                        return (
                                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{child}</td>
                                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs font-mono">{parent}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <PermissionFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </div>
    );
}
