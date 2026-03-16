import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export function useCurrentTenant() {
    return useQuery({
        queryKey: ["currentTenant"],
        queryFn: async () => {
            const res = await apiClient.get<any>("/user/tenant");
            return res.data;
        },
    });
}

export function useUpdateCurrentTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.put("/user/tenant", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["currentTenant"] });
            toast.success("Company information updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update company information", {
                description: error?.response?.data?.message || "An unexpected error occurred",
            });
        }
    });
}
