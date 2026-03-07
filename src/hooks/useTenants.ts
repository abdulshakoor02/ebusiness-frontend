import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Tenant, CreateTenantInput } from "@/lib/schemas";
import { toast } from "sonner";

export function useTenants(params?: { name?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["tenants", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Tenant[]; total: number }>("/tenants/list", {
                filters: { name: params?.name },
                limit: params?.limit || 10,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

export function useCreateTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTenantInput) => {
            const res = await apiClient.post("/tenants", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
            toast.success("Tenant created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create tenant", {
                description: error?.response?.data?.message || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
            const res = await apiClient.put(`/tenants/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
            toast.success("Tenant updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update tenant", {
                description: error?.response?.data?.message || "An unexpected error occurred",
            });
        }
    });
}
