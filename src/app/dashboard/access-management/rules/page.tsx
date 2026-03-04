"use client";

import { useState } from "react";
import { useAvailableRules, useDeleteRule, PermissionRule, ScopeType } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Pencil, Trash2, Copy } from "lucide-react";
import { RuleFormModal } from "./components/RuleForm";
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
import { Badge } from "@/components/ui/badge";

export default function PermissionRulesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">("all");
    const [scopeFilter, setScopeFilter] = useState<"all" | ScopeType>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PermissionRule | null>(null);
    const [duplicatingRule, setDuplicatingRule] = useState<PermissionRule | null>(null);
    const [deletingRule, setDeletingRule] = useState<PermissionRule | null>(null);

    const { data, isLoading, isError } = useAvailableRules();
    const deleteRule = useDeleteRule();

    // Flatten the grouped rules for display
    const allRules: PermissionRule[] = data?.resources?.flatMap((group) => group.rules) || [];

    // Filter rules
    const filteredRules = allRules.filter((rule) => {
        const matchesSearch =
            !searchTerm ||
            rule.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.resource_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.action_label.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType =
            typeFilter === "all" ||
            (typeFilter === "system" && rule.is_system) ||
            (typeFilter === "custom" && !rule.is_system);

        const matchesScope =
            scopeFilter === "all" ||
            rule.scope_type === scopeFilter;

        return matchesSearch && matchesType && matchesScope;
    });

    const handleEdit = (rule: PermissionRule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleDelete = (rule: PermissionRule) => {
        setDeletingRule(rule);
    };

    const handleDuplicate = (rule: PermissionRule) => {
        const { id: _id, ...rest } = rule;
        setDuplicatingRule({ ...rest, id: "" });
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (deletingRule?.id) {
            deleteRule.mutate(deletingRule.id, {
                onSuccess: () => setDeletingRule(null),
            });
        }
    };

    const handleModalClose = (open: boolean) => {
        if (!open) {
            setEditingRule(null);
            setDuplicatingRule(null);
        }
        setIsModalOpen(open);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-zinc-500 mt-1">
                        Create and manage permission rules that can be assigned to roles.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search rules..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={typeFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={typeFilter === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter("system")}
                    >
                        System
                    </Button>
                    <Button
                        variant={typeFilter === "custom" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter("custom")}
                    >
                        Custom
                    </Button>
                    <span className="border-l border-zinc-300 dark:border-zinc-600 mx-2" />
                    <Button
                        variant={scopeFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScopeFilter("all")}
                    >
                        All Scopes
                    </Button>
                    <Button
                        variant={scopeFilter === "none" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScopeFilter("none")}
                    >
                        None
                    </Button>
                    <Button
                        variant={scopeFilter === "self" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScopeFilter("self")}
                    >
                        Self
                    </Button>
                    <Button
                        variant={scopeFilter === "group" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScopeFilter("group")}
                    >
                        Group
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-red-500">Failed to load permission rules.</div>
                ) : filteredRules.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">No permission rules found.</div>
                ) : (
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Resource</th>
                                    <th className="px-6 py-4 font-medium">Action</th>
                                    <th className="px-6 py-4 font-medium">Endpoint</th>
                                    <th className="px-6 py-4 font-medium">Scope</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredRules.map((rule) => (
                                    <tr
                                        key={rule.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                    {rule.resource_label}
                                                </span>
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {rule.resource}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-900 dark:text-zinc-100">
                                                    {rule.action_label}
                                                </span>
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {rule.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rule.method && rule.path ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {rule.method}
                                                    </Badge>
                                                    <span className="text-zinc-500 font-mono text-xs">
                                                        {rule.path}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400 text-xs">Frontend only</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        rule.scope_type === "self"
                                                            ? "default"
                                                            : rule.scope_type === "group"
                                                            ? "outline"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        rule.scope_type === "self"
                                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                            : rule.scope_type === "group"
                                                            ? "border-purple-300 text-purple-700"
                                                            : ""
                                                    }
                                                >
                                                    {rule.scope_type || "none"}
                                                </Badge>
                                                {rule.filter_field && (
                                                    <span className="text-xs text-zinc-500" title={`Filter by ${rule.filter_field}`}>
                                                        ({rule.filter_field})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={rule.is_system ? "secondary" : "default"}>
                                                {rule.is_system ? "System" : "Custom"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDuplicate(rule)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(rule)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {!rule.is_system && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(rule)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <RuleFormModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                rule={editingRule || duplicatingRule}
            />

            <AlertDialog open={!!deletingRule} onOpenChange={() => setDeletingRule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Permission Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the permission rule &quot;{deletingRule?.action_label}&quot;?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={deleteRule.isPending}
                        >
                            {deleteRule.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}