import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCurrentTenant() {
    return useQuery({
        queryKey: ["currentTenant"],
        queryFn: async () => {
            const res = await apiClient.get<any>("/user/tenant");
            return res.data;
        },
    });
}
