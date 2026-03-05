import { RoutePermissionMap } from "./types";

export const routePermissions: RoutePermissionMap = {
  "/dashboard": "can_view_dashboard",
  "/dashboard/leads": "can_list_leads",
  "/dashboard/leads/new": "can_create_leads",
  "/dashboard/leads/[id]": "can_view_leads",
  "/dashboard/leads/categories": "can_list_lead-categories",
  "/dashboard/leads/sources": "can_list_lead-sources",
  "/dashboard/users": "can_list_users",
  "/dashboard/users/new": "can_create_users",
  "/dashboard/tenants": "can_list_tenants",
  "/dashboard/access-management/role-permissions": "can_view-roles_permissions",
  "/dashboard/access-management/rules": "can_view-rules_permissions",
  "/dashboard/access-management": "can_view-roles_permissions",
};
