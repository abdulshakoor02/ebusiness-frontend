import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface PermissionRule {
    id: string;
    resource: string;
    resource_label: string;
    action: string;
    action_label: string;
    path: string;
    method: string;
    description: string;
    is_system?: boolean;
    assigned?: boolean;
}

export interface ResourceGroup {
    resource: string;
    label: string;
    rules: PermissionRule[];
}

export interface RolePermissionsResponse {
    role: string;
    resources: ResourceGroup[];
}

export interface AvailableRulesResponse {
    resources: ResourceGroup[];
}

export interface BulkUpdatePayload {
    permissions: {
        path: string;
        method: string;
        assigned: boolean;
    }[];
}

export function useRoles() {
    return useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get<{ data: string[] }>("/permissions/roles");
            return res.data.data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRoleInheritances() {
    return useQuery({
        queryKey: ["role-inheritances"],
        queryFn: async () => {
            const res = await apiClient.get<{ data: string[][] }>("/permissions/roles/inherit");
            return res.data.data;
        },
    });
}

// Fetch all available rules in grouped format
export function useAvailableRules() {
    return useQuery({
        queryKey: ["available-rules"],
        queryFn: async () => {
            const res = await apiClient.get<AvailableRulesResponse>("/permissions/available-rules");
            return res.data;
        },
    });
}

// Fetch grouped rules for a specific role
export function useRolePermissions(role: string) {
    return useQuery({
        queryKey: ["role-permissions", role],
        queryFn: async () => {
            const res = await apiClient.get<RolePermissionsResponse>(`/permissions/roles/${role}`);
            return res.data;
        },
        enabled: !!role, // Only run if a role is provided
    });
}

// Bulk update permissions for a role
export function useBulkUpdateRolePermissions(role: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: BulkUpdatePayload) => {
            const res = await apiClient.post(`/permissions/roles/${role}/bulk`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["role-permissions", role] });
            toast.success("Permissions updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update permissions", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}
