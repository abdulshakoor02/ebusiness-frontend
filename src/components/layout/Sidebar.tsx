"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Shield, BookOpen, ScrollText, Network, FileKey, Package } from "lucide-react";

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
import { usePermissions } from "@/context/PermissionsContext";

const staticNavigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
];

const protectedNavigation = [
    { name: "Leads", href: "/dashboard/leads", icon: BookOpen, permission: "can_create_leads" },
    { name: "Lead Categories", href: "/dashboard/leads/categories", icon: ScrollText, permission: "can_create_lead-categories" },
    { name: "Lead Sources", href: "/dashboard/leads/sources", icon: Network, permission: "can_create_lead-sources" },
    { name: "Products", href: "/dashboard/products", icon: Package, permission: "can_create_products" },
    { name: "Tenants", href: "/dashboard/tenants", icon: Building2, permission: "can_create_tenants" },
    { name: "Users", href: "/dashboard/users", icon: Users, permission: "can_create_users" },
    { name: "Role Permissions", href: "/dashboard/access-management/role-permissions", icon: Shield, permission: "can_view-roles_permissions" },
    { name: "Permission Rules", href: "/dashboard/access-management/rules", icon: FileKey, permission: "can_create_tenants" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { hasPermission } = usePermissions();

    const visibleNavigation = protectedNavigation.filter((item) => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
    });

    const allNavigation = [...staticNavigation, ...visibleNavigation];

    return (
        <Sidebar className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <SidebarHeader className="!h-16 flex items-center justify-start px-3 py-0 border-b border-zinc-200 dark:border-zinc-800">
                <Link href="/dashboard" className="flex items-center w-full h-full transition-opacity hover:opacity-80">
                    <div className="bg-zinc-900 rounded-md px-3 py-1">
                        <Image src="/1.png" alt="ebusiness+" width={165} height={50} className="w-[165px] h-[45px] object-contain" />
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-zinc-500 font-medium">Platform Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {allNavigation.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
        </Sidebar >
    );
}
