import { LucideIcon, LayoutDashboard, BookOpen, ScrollText, Network, Building2, Users, Shield, FileKey } from "lucide-react";
import { NavItem } from "./types";

export const navigationConfig: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: BookOpen, permission: "can_list_leads" },
  { name: "Lead Categories", href: "/dashboard/leads/categories", icon: ScrollText, permission: "can_list_lead-categories" },
  { name: "Lead Sources", href: "/dashboard/leads/sources", icon: Network, permission: "can_list_lead-sources" },
  { name: "Tenants", href: "/dashboard/tenants", icon: Building2, permission: "can_list_tenants" },
  { name: "Users", href: "/dashboard/users", icon: Users, permission: "can_list_users" },
  { name: "Role Permissions", href: "/dashboard/access-management/role-permissions", icon: Shield, permission: "can_view-roles_permissions" },
  { name: "Permission Rules", href: "/dashboard/access-management/rules", icon: FileKey, permission: "can_view-rules_permissions" },
];
