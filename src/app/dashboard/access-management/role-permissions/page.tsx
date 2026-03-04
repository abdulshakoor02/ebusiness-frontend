"use client";

import { useState, useEffect } from "react";
import { useRolePermissions, useBulkUpdateRolePermissions, useRoleInheritances, useRoles, useAvailableRules } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RolePermissionsPage() {
    const rolesQuery = useRoles();
    const roles = rolesQuery.data || [];
    const [selectedRole, setSelectedRole] = useState("");

    // Set default selected role once roles load
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    // Fetch data for the currently selected role
    const availableRulesQuery = useAvailableRules();
    const rolePermissionsQuery = useRolePermissions(selectedRole);
    const bulkUpdateMutation = useBulkUpdateRolePermissions(selectedRole);
    const inheritancesQuery = useRoleInheritances();

    // Local state to track toggles before saving
    const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when API data arrives or changes
    // Use availableRules as source of truth for rules, merge with role-specific assignments
    useEffect(() => {
        const availableData = availableRulesQuery.data?.resources;
        const roleData = rolePermissionsQuery.data?.resources;
        
        if (!availableData) return;

        // Build a map from available rules
        const availableRulesMap = new Map<string, boolean>();
        availableData.forEach(group => {
            group.rules.forEach(rule => {
                const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
                availableRulesMap.set(key, false); // default to false
            });
        });

        // Override with role-specific assignments if available
        if (roleData) {
            roleData.forEach(group => {
                group.rules.forEach(rule => {
                    const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
                    if (availableRulesMap.has(key)) {
                        availableRulesMap.set(key, !!rule.assigned);
                    }
                });
            });
        }

        setLocalPermissions(Object.fromEntries(availableRulesMap));
        setHasChanges(false);
    }, [rolePermissionsQuery.data, availableRulesQuery.data, selectedRole]);

    const handleToggle = (rule: any, checked: boolean) => {
        const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
        setLocalPermissions(prev => ({ ...prev, [key]: checked }));
        setHasChanges(true);
    };

    const handleSave = () => {
        // Always use availableRulesQuery to get the correct permission_rule_id
        const availableData = availableRulesQuery.data?.resources;
        if (!availableData) return;

        // Build a map from available rules to get correct IDs
        const availableRulesMap = new Map<string, { id: string; resource: string; action: string }>();
        availableData.forEach(group => {
            group.rules.forEach(rule => {
                const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
                availableRulesMap.set(key, {
                    id: rule.id,
                    resource: rule.resource,
                    action: rule.action
                });
            });
        });

        const payloadPermissions: { id: string; resource: string; action: string; assigned: boolean }[] = [];

        availableData.forEach(group => {
            group.rules.forEach(rule => {
                const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
                const isAssignedLocal = localPermissions[key] || false;

                const availableRule = availableRulesMap.get(key);
                if (availableRule) {
                    payloadPermissions.push({
                        id: availableRule.id,
                        resource: availableRule.resource,
                        action: availableRule.action,
                        assigned: isAssignedLocal
                    });
                }
            });
        });

        bulkUpdateMutation.mutate({ permissions: payloadPermissions }, {
            onSuccess: () => setHasChanges(false)
        });
    };

    return (
        <Tabs defaultValue={selectedRole} onValueChange={setSelectedRole} className="w-full flex flex-col md:flex-row gap-6">
            {/* Left Side: Role Selection */}
            <div className="md:w-64 shrink-0">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-zinc-500">System Roles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        <TabsList className="flex flex-col h-auto bg-transparent border-0 p-2 space-y-1 items-stretch">
                            {roles.map((role) => (
                                <TabsTrigger
                                    key={role}
                                    value={role}
                                    className="justify-start px-4 py-2 font-medium capitalize data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400"
                                >
                                    <ShieldAlert className="mr-2 h-4 w-4 opacity-50" />
                                    {role}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </CardContent>
                </Card>

                {/* Simple Inheritances view underneath roles */}
                <Card className="mt-6">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-zinc-500">Inheritances</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        {inheritancesQuery.isLoading ? (
                            <div className="text-xs text-zinc-500">Loading...</div>
                        ) : inheritancesQuery.data?.length ? (
                            <ul className="space-y-2">
                                {inheritancesQuery.data.map((inh, idx) => {
                                    const offset = inh[0] === "g" ? 1 : 0;
                                    const child = inh[offset];
                                    const parent = inh[offset + 1];
                                    if (!child || !parent) return null;
                                    return (
                                        <li key={idx} className="text-xs flex items-center gap-2">
                                            <span className="font-semibold capitalize">{child}</span>
                                            <span className="text-zinc-400">&rarr;</span>
                                            <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded capitalize">{parent}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="text-xs text-zinc-500">No inheritances configured.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Side: Role Permissions Editor */}
            <div className="flex-1">
                {roles.map((role) => (
                    <TabsContent key={role} value={role} className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl capitalize">{role} Permissions</CardTitle>
                                    <CardDescription>
                                        Turn features on or off for users assigned the <span className="font-semibold">{role}</span> role.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={!hasChanges || bulkUpdateMutation.isPending}
                                    className="transition-all"
                                >
                                    {bulkUpdateMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </CardHeader>

                            <CardContent className="p-0">
                                {rolePermissionsQuery.isLoading || availableRulesQuery.isLoading ? (
                                    <div className="p-12 flex justify-center items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                    </div>
                                ) : availableRulesQuery.isError ? (
                                    <div className="p-12 text-center text-red-500">Failed to load available rules.</div>
                                ) : (
                                    (() => {
                                        // Always use availableRules as source for display (to get all rules with correct IDs)
                                        const displayData = availableRulesQuery.data?.resources || [];
                                        
                                        if (displayData.length === 0) {
                                            return <div className="p-12 text-center text-zinc-500">No permissions found.</div>;
                                        }

                                        return (
                                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                                {displayData.map((group) => (
                                                    <div key={group.resource} className="p-6">
                                                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{group.label}</h3>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {group.rules.map((rule) => {
                                                                const key = `${rule.path}_${rule.method}_${rule.resource}_${rule.action}`;
                                                                const isAssigned = localPermissions[key] || false;
                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${isAssigned
                                                                            ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20"
                                                                            : "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800"
                                                                            }`}
                                                                    >
                                                                        <div className="space-y-0.5 pr-4">
                                                                            <label className={`text-sm font-medium cursor-pointer ${isAssigned ? "text-indigo-900 dark:text-indigo-200" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                                                {rule.action_label}
                                                                            </label>
                                                                            {rule.description && (
                                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                                                    {rule.description}
                                                                                </p>
                                                                            )}
                                                                            <code className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 block">
                                                                                {rule.action}:{rule.resource}
                                                                            </code>
                                                                        </div>
                                                                        <Switch
                                                                            checked={isAssigned}
                                                                            onCheckedChange={(checked: boolean) => handleToggle(rule, checked)}
                                                                            disabled={role === "superadmin"}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </div>
        </Tabs>
    );
}