import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Lead, LeadCategory, LeadComment, LeadAppointment } from "@/lib/schemas";
import { toast } from "sonner";

// --- Categories ---

export function useLeadCategories(params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["lead-categories", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: LeadCategory[]; total: number }>("/lead-categories/list", {
                filters: {},
                limit: params?.limit || 50,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

export function useCreateLeadCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<LeadCategory>) => {
            const res = await apiClient.post("/lead-categories", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-categories"] });
            toast.success("Category created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create category", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateLeadCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<LeadCategory> }) => {
            const res = await apiClient.put(`/lead-categories/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-categories"] });
            toast.success("Category updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update category", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useDeleteLeadCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/lead-categories/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-categories"] });
            toast.success("Category deleted");
        },
        onError: (error: any) => {
            toast.error("Failed to delete category", {
                description: error?.response?.data?.error || "This category might be in use.",
            });
        }
    });
}

// --- Leads ---

export function useLeads(params?: { status?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["leads", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Lead[]; total: number }>("/leads/list", {
                filters: {
                    status: params?.status
                },
                limit: params?.limit || 10,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

export function useLead(id: string) {
    return useQuery({
        queryKey: ["leads", id],
        queryFn: async () => {
            const res = await apiClient.get<Lead>(`/leads/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Lead>) => {
            const res = await apiClient.post("/leads", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            toast.success("Lead created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create lead", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
            const res = await apiClient.put(`/leads/${id}`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads", variables.id] });
            toast.success("Lead updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update lead", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

// --- Comments ---

export function useLeadComments(lead_id: string) {
    return useQuery({
        queryKey: ["leads", lead_id, "comments"],
        queryFn: async () => {
            const res = await apiClient.post<{ data: LeadComment[]; total: number }>(`/leads/${lead_id}/comments/list`, {
                filters: {},
                limit: 50,
                offset: 0,
            });
            return res.data;
        },
        enabled: !!lead_id,
    });
}

export function useCreateLeadComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ lead_id, content }: { lead_id: string; content: string }) => {
            const res = await apiClient.post(`/leads/${lead_id}/comments`, { content });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["leads", variables.lead_id, "comments"] });
            toast.success("Comment added");
        },
        onError: (error: any) => {
            toast.error("Failed to add comment", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

// --- Appointments ---

export function useLeadAppointments(lead_id: string) {
    return useQuery({
        queryKey: ["leads", lead_id, "appointments"],
        queryFn: async () => {
            const res = await apiClient.post<{ data: LeadAppointment[]; total: number }>(`/leads/${lead_id}/appointments/list`, {
                filters: {},
                limit: 50,
                offset: 0,
            });
            return res.data;
        },
        enabled: !!lead_id,
    });
}

export function useCreateLeadAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ lead_id, data }: { lead_id: string; data: Partial<LeadAppointment> }) => {
            const res = await apiClient.post(`/leads/${lead_id}/appointments`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["leads", variables.lead_id, "appointments"] });
            toast.success("Appointment scheduled");
        },
        onError: (error: any) => {
            toast.error("Failed to schedule appointment", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}
