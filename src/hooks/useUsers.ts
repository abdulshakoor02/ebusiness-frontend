import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { User } from "@/lib/schemas";
import { toast } from "sonner";

export function useUsers(params?: { name?: string; tenant_id?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["users", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: User[]; total: number }>("/users/list", {
                filters: {
                    name: params?.name,
                    tenant_id: params?.tenant_id
                },
                limit: params?.limit || 10,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

// Define minimal create input for demonstration - usually this matches a Zod schema
export interface CreateUserInput {
    name: string;
    email: string;
    mobile: string;
    password?: string;
    role: string;
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateUserInput) => {
            const res = await apiClient.post("/users", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create user", {
                description: error?.response?.data?.message || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const res = await apiClient.put(`/users/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update user", {
                description: error?.response?.data?.message || "An unexpected error occurred",
            });
        }
    });
}
