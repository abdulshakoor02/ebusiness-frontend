import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";

export function useMyPermissions() {
    const { data: session } = useSession();

    return useQuery({
        queryKey: ["my-permissions", session?.user?.id],
        queryFn: async () => {
            const res = await apiClient.get<string[][] | string[]>("/permissions/my-permissions");
            return res.data;
        },
        enabled: !!session?.user?.id,
    });
}

/**
 * Hook to check if the current user has access to perform an action on a resource.
 */
export function useIsAllowed(resource: string, action: string) {
    const { data: session } = useSession();
    const { data: permissions } = useMyPermissions();

    if (!session) return false;

    // Super admin always has full access
    if (session.user?.role === "super_admin") return true;

    if (Array.isArray(permissions) && permissions.length > 0) {
        // If API returns string format e.g., "tenant:read"
        if (typeof permissions[0] === "string") {
            const perms = permissions as string[];
            return perms.includes(`${resource}:${action}`) ||
                perms.includes(`${resource}:manage`) ||
                perms.includes(`*:*`) ||
                perms.includes(`*`);
        }

        // If API returns Casbin array format e.g., [["tenant", "read"]]
        if (Array.isArray(permissions[0])) {
            const perms = permissions as string[][];
            return perms.some(
                (p) => (p[0] === resource || p[0] === "*") && (p[1] === action || p[1] === "manage" || p[1] === "*")
            );
        }
    }

    return false;
}
