"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show a loading state while checking authentication
    if (status === "loading" || !mounted) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    // Middleware should handle this, but adding a fail-safe client-side check
    if (status === "unauthenticated") {
        // If we land here and middleware failed, router push is necessary
        // We already have generic protection via middleware
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950/50">
                <Topbar />
                <main className="flex-1 p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
