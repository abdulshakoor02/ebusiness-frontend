"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Shield, BookOpen, ScrollText, Network, FileKey, Package, Bot } from "lucide-react";

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
    { name: "Company Info", href: "/dashboard/company-info", icon: Building2, permission: "can_update_user-tenants" },
    { name: "AI Chat", href: "/dashboard/ai-chat", icon: Bot, permission: "can_chat_ai" },
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
        <Sidebar className="border-r border-border bg-background sidebar-glass">
            <SidebarHeader className="!h-16 flex items-center justify-start px-4 py-0 border-b border-border">
                <Link href="/dashboard" className="flex items-center w-full h-full transition-opacity hover:opacity-80 duration-200">
                    <div className="bg-zinc-900 rounded-lg px-3 py-1.5">
                        <Image src="/1.png" alt="ebusiness+" width={165} height={50} className="w-[165px] h-[45px] object-contain" />
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent className="py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider px-4 mb-2">Platform Management</SidebarGroupLabel>
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
                                            className="transition-all duration-200 text-foreground/70 hover:text-foreground hover:bg-sidebar-accent/50 data-[active=true]:text-primary data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium mx-2 rounded-lg"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4 transition-transform duration-200" />
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
