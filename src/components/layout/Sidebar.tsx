"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, LayoutDashboard, Building2, Users, Shield, BookOpen, ScrollText, Network } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

const adminNavigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: BookOpen },
    { name: "Lead Categories", href: "/dashboard/leads/categories", icon: ScrollText },
    { name: "Lead Sources", href: "/dashboard/leads/sources", icon: Network },
    { name: "Tenants", href: "/dashboard/tenants", icon: Building2 },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Permissions", href: "/dashboard/permissions", icon: Shield },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
                <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="h-8 w-8 bg-black dark:bg-white rounded-md flex items-center justify-center">
                        <Gem className="text-white dark:text-black h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">ebusiness+</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-zinc-500 font-medium">Platform Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.name}
                                            className="transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
