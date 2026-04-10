import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DailyActivity {
    date: string;
    appointments_booked: number;
    comments_added: number;
}

interface MonthlySummaryResponse {
    data: DailyActivity[];
}

export function useMonthlySummary(month?: number, year?: number) {
    return useQuery({
        queryKey: ["monthly-summary", month, year],
        queryFn: async () => {
            const res = await apiClient.get<MonthlySummaryResponse>("/charts/monthly-summary", {
                params: { month, year },
            });
            return res.data;
        },
    });
}
