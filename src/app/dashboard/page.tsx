"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePermissions } from "@/context/PermissionsContext";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { getDashboardErrorMessage } from "@/lib/dashboard";
import {
  DashboardAccessState,
  DashboardErrorState,
  DashboardHeader,
  DashboardStaleBanner,
  DashboardUpdatedLine,
  LoadingDashboard,
} from "@/components/dashboard/DashboardPrimitives";
import { SuperadminDashboard } from "@/components/dashboard/SuperadminDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

function DashboardFrame({ children, role, scope }: { children: ReactNode; role?: string | null; scope?: string | null }) {
  return <div data-glass="overview" data-dashboard-role={role ?? undefined} data-dashboard-scope={scope ?? undefined} className="dashboard-root">{children}</div>;
}

export default function DashboardOverview() {
  const dashboard = useDashboardSummary();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const permissions = useMemo(
    () => ({ hasPermission, isReady: !permissionsLoading }),
    [hasPermission, permissionsLoading],
  );

  if (dashboard.sessionStatus === "loading") {
    return <DashboardFrame><LoadingDashboard /></DashboardFrame>;
  }

  if (dashboard.sessionStatus !== "authenticated") {
    return <DashboardFrame><DashboardAccessState title="Sign in to view your dashboard" description="Your live metrics are available after an authenticated session is established." /></DashboardFrame>;
  }

  if (!dashboard.sessionId) {
    return <DashboardFrame><DashboardAccessState title="Account identity unavailable" description="We could not verify the signed-in account. Sign in again before loading dashboard data." /></DashboardFrame>;
  }

  if (!dashboard.sessionRole) {
    return <DashboardFrame><DashboardAccessState title="Dashboard role unavailable" description="This account does not have a supported dashboard role. Ask an administrator to review your access." /></DashboardFrame>;
  }

  if (dashboard.sessionRole !== "superadmin" && !dashboard.tenantId) {
    return <DashboardFrame><DashboardAccessState title="Workspace identity unavailable" description="Sign in again to verify your workspace before loading metrics." /></DashboardFrame>;
  }

  if (dashboard.accessDenied) {
    return <DashboardFrame><DashboardAccessState title="Dashboard access expired" description={getDashboardErrorMessage(dashboard.error)} /></DashboardFrame>;
  }

  if (dashboard.isPending && !dashboard.summary) {
    return <DashboardFrame><LoadingDashboard /></DashboardFrame>;
  }

  if (!dashboard.summary) {
    return <DashboardFrame><DashboardErrorState message={getDashboardErrorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} isRetrying={dashboard.isFetching} /></DashboardFrame>;
  }

  if (dashboard.summary.role !== dashboard.sessionRole) {
    return <DashboardFrame role={dashboard.sessionRole}><DashboardAccessState title="Dashboard context changed" description="The account role changed while this page was open. Refresh to load the matching dashboard view." /></DashboardFrame>;
  }

  const stale = dashboard.isRefetchError || Boolean(dashboard.error);
  const dashboardView = dashboard.summary.role === "superadmin" ? (
    <SuperadminDashboard summary={dashboard.summary} permissions={permissions} />
  ) : dashboard.summary.role === "admin" ? (
    <AdminDashboard summary={dashboard.summary} permissions={permissions} />
  ) : (
    <UserDashboard summary={dashboard.summary} permissions={permissions} />
  );

  return (
    <DashboardFrame role={dashboard.summary.role} scope={dashboard.summary.scope}>
      <DashboardHeader
        summary={dashboard.summary}
        userName={dashboard.session?.user?.name}
        permissions={permissions}
        isRefreshing={dashboard.isFetching}
        onRefresh={() => void dashboard.refetch()}
      />
      {stale ? <DashboardStaleBanner onRetry={() => void dashboard.refetch()} isRefreshing={dashboard.isFetching} /> : null}
      {dashboardView}
      <DashboardUpdatedLine summary={dashboard.summary} isStale={stale} />
    </DashboardFrame>
  );
}
