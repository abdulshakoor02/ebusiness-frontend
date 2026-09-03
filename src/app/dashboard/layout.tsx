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
                <div className="flex flex-col flex-1 min-h-screen bg-background relative">
                    <Topbar />
                    <main className="flex-1 p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300 relative z-10">
                        {children}
                    </main>
                </div>
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
                >
                    <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-blue-500/[0.04] dark:bg-blue-500/[0.06] blur-[140px]" />
                    <div className="absolute top-[30%] -right-[10%] w-[45%] h-[45%] rounded-full bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] blur-[140px]" />
                    <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] blur-[140px]" />
                </div>
            </PermissionsProvider>
        </SidebarProvider>
    );
}
