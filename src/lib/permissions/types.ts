import { LucideIcon } from "lucide-react";

export interface PermissionResponse {
  permissions: Record<string, boolean>;
  role: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface RoutePermissionMap {
  [route: string]: string;
}
