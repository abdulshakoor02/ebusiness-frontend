import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Lead, LeadCategory, LeadComment, LeadAppointment, LeadSource, Country, Qualification } from "@/lib/schemas";
import { toast } from "sonner";
import { startOfDay, endOfDay } from "date-fns";

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

// --- Sources ---

export function useLeadSources(params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["lead-sources", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: LeadSource[]; total: number }>("/lead-sources/list", {
                filters: {},
                limit: params?.limit || 50,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

export function useCreateLeadSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<LeadSource>) => {
            const res = await apiClient.post("/lead-sources", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
            toast.success("Source created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create source", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateLeadSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<LeadSource> }) => {
            const res = await apiClient.put(`/lead-sources/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
            toast.success("Source updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update source", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useDeleteLeadSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/lead-sources/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
            toast.success("Source deleted");
        },
        onError: (error: any) => {
            toast.error("Failed to delete source", {
                description: error?.response?.data?.error || "This source might be in use.",
            });
        }
    });
}

// --- Leads ---

export function useLeads(params?: { 
    search?: string; 
    category_id?: string; 
    date_from?: string;
    date_to?: string;
    date_field?: 'created_at' | 'updated_at' | 'converted_at';
    limit?: number; 
    offset?: number 
}) {
    return useQuery({
        queryKey: ["leads", params],
        queryFn: async () => {
            const filters: Record<string, unknown> = {};
            
            if (params?.category_id) {
                filters.category_id = params.category_id;
            }
            
            if (params?.date_from) {
                filters.date_from = startOfDay(new Date(params.date_from)).toISOString();
            }
            
            if (params?.date_to) {
                filters.date_to = endOfDay(new Date(params.date_to)).toISOString();
            }
            
            if (params?.date_field && params?.date_from && params?.date_to) {
                filters.date_field = params.date_field;
            }
            
            const res = await apiClient.post<{ data: Lead[]; total: number }>("/leads/list", {
                filters,
                search: params?.search || undefined,
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

// --- Countries ---

export function useCountries(params?: { limit?: number; offset?: number; search?: string }) {
    return useQuery({
        queryKey: ["countries", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Country[]; total: number }>("/countries/list", {
                filters: {
                    is_active: true,
                    ...(params?.search ? { name: { $regex: params.search, $options: "i" } } : {})
                },
                limit: params?.limit || 100,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

// --- Qualifications ---

export function useQualifications(params?: { limit?: number; offset?: number; search?: string }) {
    return useQuery({
        queryKey: ["qualifications", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Qualification[]; total: number }>("/qualifications/list", {
                filters: {
                    is_active: true,
                    ...(params?.search ? { name: { $regex: params.search, $options: "i" } } : {})
                },
                limit: params?.limit || 100,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}
