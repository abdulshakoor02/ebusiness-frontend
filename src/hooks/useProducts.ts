import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Product } from "@/lib/schemas";
import { toast } from "sonner";

export function useProducts(params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ["products", params],
        queryFn: async () => {
            const res = await apiClient.post<{ data: Product[]; total: number }>("/products/list", {
                filters: {},
                limit: params?.limit || 50,
                offset: params?.offset || 0,
            });
            return res.data;
        },
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ["products", id],
        queryFn: async () => {
            const res = await apiClient.get<Product>(`/products/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const res = await apiClient.post("/products", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create product", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const res = await apiClient.put(`/products/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update product", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/products/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product deleted");
        },
        onError: (error: any) => {
            toast.error("Failed to delete product", {
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        }
    });
}
