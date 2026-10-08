"use client";

import {
  DashboardPermissionState,
  DueFocusPanel,
  FeatureChart,
  HeadlineMetrics,
  RecentLeadsPanel,
  SupportingMetricsPanel,
  UpcomingPanel,
} from "./DashboardPrimitives";
import { DashboardSummary } from "@/lib/dashboard";

export function UserDashboard({
  summary,
  permissions,
}: {
  summary: DashboardSummary;
  permissions: DashboardPermissionState;
}) {
  return (
    <div className="dashboard-view dashboard-view-personal">
      <HeadlineMetrics summary={summary} />
      <section className="dashboard-feature-grid dashboard-feature-grid-personal">
        <FeatureChart summary={summary} />
        <DueFocusPanel summary={summary} />
      </section>
      <section className="dashboard-context-grid dashboard-context-grid-personal">
        <UpcomingPanel summary={summary} />
        <RecentLeadsPanel summary={summary} permissions={permissions} />
      </section>
      <SupportingMetricsPanel summary={summary} />
    </div>
  );
}
