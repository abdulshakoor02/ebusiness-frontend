"use client";

import { useIsAllowed } from "@/hooks/useAuthz";
import { ReactNode } from "react";

interface IsAllowedProps {
    resource: string;
    action: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function IsAllowed({ resource, action, children, fallback = null }: IsAllowedProps) {
    const isAllowed = useIsAllowed(resource, action);

    if (!isAllowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
