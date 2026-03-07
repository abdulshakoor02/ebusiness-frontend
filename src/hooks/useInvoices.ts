import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Invoice, Receipt } from "@/lib/schemas";
import { toast } from "sonner";

export interface CreateInvoicePayload {
    items: { product_id: string; quantity: number }[];
    discount?: number;
    due_date: string;
}

export interface UpdateInvoicePayload {
    items?: { product_id: string; quantity: number }[];
    discount?: number;
    due_date?: string;
}

export interface CreateReceiptPayload {
    amount_paid: number;
    payment_date: string;
}

export interface UpdateReceiptPayload {
    amount_paid?: number;
    payment_date?: string;
}

// --- Lead Invoices ---

export function useLeadInvoices(lead_id: string) {
    return useQuery({
        queryKey: ["lead-invoices", lead_id],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Invoice[] }>(`/leads/${lead_id}/invoices`);
            return res.data.data;
        },
        enabled: !!lead_id,
    });
}

// --- Invoice CRUD ---

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ lead_id, data }: { lead_id: string; data: CreateInvoicePayload }) => {
            const res = await apiClient.post<Invoice>(`/leads/${lead_id}/invoices`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["lead-invoices", variables.lead_id] });
            toast.success("Invoice created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create invoice", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useInvoice(id: string) {
    return useQuery({
        queryKey: ["invoices", id],
        queryFn: async () => {
            const res = await apiClient.get<Invoice>(`/invoices/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useUpdateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateInvoicePayload }) => {
            const res = await apiClient.put<Invoice>(`/invoices/${id}`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["lead-invoices"] });
            toast.success("Invoice updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update invoice", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

// --- Invoice Receipts ---

export function useInvoiceReceipts(invoice_id: string) {
    return useQuery({
        queryKey: ["invoices", invoice_id, "receipts"],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Receipt[] }>(`/invoices/${invoice_id}/receipts/list`, {
                filters: {},
                limit: 50,
                offset: 0,
            });
            return res.data.data;
        },
        enabled: !!invoice_id,
    });
}

export function useCreateReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ invoice_id, data }: { invoice_id: string; data: CreateReceiptPayload }) => {
            const res = await apiClient.post<Receipt>(`/invoices/${invoice_id}/receipts`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id] });
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id, "receipts"] });
            queryClient.invalidateQueries({ queryKey: ["lead-invoices"] });
            toast.success("Receipt created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create receipt", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data, invoice_id }: { id: string; invoice_id: string; data: UpdateReceiptPayload }) => {
            const res = await apiClient.put<Receipt>(`/receipts/${id}`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id] });
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id, "receipts"] });
            queryClient.invalidateQueries({ queryKey: ["lead-invoices"] });
            toast.success("Receipt updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update receipt", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useDeleteReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, invoice_id }: { id: string; invoice_id: string }) => {
            const res = await apiClient.delete(`/receipts/${id}`);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id] });
            queryClient.invalidateQueries({ queryKey: ["invoices", variables.invoice_id, "receipts"] });
            queryClient.invalidateQueries({ queryKey: ["lead-invoices"] });
            toast.success("Receipt deleted successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to delete receipt", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}
