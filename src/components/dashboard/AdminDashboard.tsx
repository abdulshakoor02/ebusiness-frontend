"use client";

import {
  DashboardPermissionState,
  FeatureChart,
  HeadlineMetrics,
  LeadStatusPanel,
  RecentLeadsPanel,
  SupportingMetricsPanel,
  UpcomingPanel,
} from "./DashboardPrimitives";
import { DashboardSummary } from "@/lib/dashboard";

export function AdminDashboard({
  summary,
  permissions,
}: {
  summary: DashboardSummary;
  permissions: DashboardPermissionState;
}) {
  return (
    <div className="dashboard-view dashboard-view-tenant">
      <HeadlineMetrics summary={summary} />
      <section className="dashboard-feature-grid dashboard-feature-grid-tenant">
        <FeatureChart summary={summary} />
        <LeadStatusPanel summary={summary} />
      </section>
      <section className="dashboard-context-grid dashboard-context-grid-tenant">
        <UpcomingPanel summary={summary} />
        <RecentLeadsPanel summary={summary} permissions={permissions} />
      </section>
      <SupportingMetricsPanel summary={summary} />
    </div>
  );
}
