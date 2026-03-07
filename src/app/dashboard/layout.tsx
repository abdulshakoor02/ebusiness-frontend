"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PermissionsProvider } from "@/context/PermissionsContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <PermissionsProvider>
                <AppSidebar />
                <div className="flex flex-col flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950/50">
                    <Topbar />
                    <main className="flex-1 p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
                        {children}
                    </main>
                </div>
            </PermissionsProvider>
        </SidebarProvider>
    );
}
