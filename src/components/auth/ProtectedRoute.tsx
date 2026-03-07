"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/context/PermissionsContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const router = useRouter();
  const { hasPermission, isLoading, permissions } = usePermissions();

  useEffect(() => {
    if (isLoading) return;

    if (!permissions) {
      router.push("/");
      return;
    }

    if (permission && !hasPermission(permission)) {
      router.push("/dashboard");
    }
  }, [isLoading, permissions, permission, hasPermission, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return <>{children}</>;
}
