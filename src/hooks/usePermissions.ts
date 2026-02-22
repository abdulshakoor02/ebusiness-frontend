import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface PolicyData {
    sub: string;
    obj: string;
    act: string;
}

export function usePolicies() {
    return useQuery({
        queryKey: ["policies"],
        queryFn: async () => {
            const res = await apiClient.get<{ data: string[][] }>("/permissions");
            return res.data.data;
        },
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

export function useAddPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: PolicyData) => {
            const res = await apiClient.post("/permissions", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] });
            toast.success("Permission added successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to add permission", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useRemovePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: PolicyData) => {
            const res = await apiClient.delete("/permissions", { data });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] });
            toast.success("Permission removed successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to remove permission", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}
