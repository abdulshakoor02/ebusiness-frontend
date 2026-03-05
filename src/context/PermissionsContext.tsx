"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useMyPermissions, getStoredPermissions } from "@/hooks/useMyPermissions";
import { PermissionResponse } from "@/lib/permissions/types";

interface PermissionsContextType {
  permissions: PermissionResponse | null;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  role: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const { data: permissions, isLoading } = useMyPermissions();
  const [storedPermissions, setStoredPermissions] = useState<PermissionResponse | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      const stored = getStoredPermissions();
      setStoredPermissions(stored);
    }
  }, [status]);

  const effectivePermissions = permissions || storedPermissions;

  const checkPermission = (permission: string): boolean => {
    if (!effectivePermissions) return false;
    return effectivePermissions.permissions[permission] === true;
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions: effectivePermissions,
        hasPermission: checkPermission,
        isLoading: isLoading && !storedPermissions,
        role: effectivePermissions?.role || null,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
