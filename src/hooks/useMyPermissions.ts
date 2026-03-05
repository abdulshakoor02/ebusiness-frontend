import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { PermissionResponse } from "@/lib/permissions/types";

const PERMISSIONS_KEY = "user_permissions";

export function useMyPermissions() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["my-permissions"],
    queryFn: async (): Promise<PermissionResponse> => {
      const res = await apiClient.get<PermissionResponse>("/permissions/my-permissions");

      if (typeof window !== "undefined") {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(res.data));
      }

      return res.data;
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity,
    retry: false,
  });
}

export function getStoredPermissions(): PermissionResponse | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(PERMISSIONS_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function hasPermissionSync(permissionKey: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;

  return perms.permissions[permissionKey] === true;
}

export function clearPermissions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PERMISSIONS_KEY);
  }
}
