"use client";

import { usePermissions } from "@/context/PermissionsContext";

interface IsAllowedProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function IsAllowed({ permission, children, fallback = null }: IsAllowedProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
