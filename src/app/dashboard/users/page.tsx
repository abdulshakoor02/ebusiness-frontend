"use client";

import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { UserFormModal } from "./components/UserForm";

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading, isError } = useUsers({ name: searchTerm || undefined });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-zinc-500 mt-1">Manage platform users, roles, and organizational access.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search users by name..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoading ? (
                    <div className="p-8 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">Failed to load users. Please try again.</div>
                ) : data?.data?.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">No users found. Try creating one!</div>
                ) : (
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User Profile</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Organization (Tenant ID)</th>
                                    <th className="px-6 py-4 font-medium">Joined On</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data?.data?.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-600 dark:text-zinc-300">
                                                {u.name.substring(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{u.name}</span>
                                                <span className="text-xs text-zinc-500 font-normal">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                                                {u.role === "super_admin" || u.role === "admin" ? (
                                                    <Shield className="h-3 w-3 text-indigo-500" />
                                                ) : (
                                                    <UserIcon className="h-3 w-3 text-emerald-500" />
                                                )}
                                                {u.role.replace("_", " ")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                                            {u.tenant_id}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            {new Date(u.created_at).toLocaleDateString()}
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

            <UserFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </div>
    );
}
