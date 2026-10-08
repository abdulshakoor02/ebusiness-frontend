"use client";

import {
  DashboardPermissionState,
  FeatureChart,
  HeadlineMetrics,
  LeadStatusPanel,
  PlatformOnboardingPanel,
  SupportingMetricsPanel,
  TenantHighlightsPanel,
} from "./DashboardPrimitives";
import { DashboardSummary } from "@/lib/dashboard";

export function SuperadminDashboard({
  summary,
  permissions,
}: {
  summary: DashboardSummary;
  permissions: DashboardPermissionState;
}) {
  return (
    <div className="dashboard-view dashboard-view-platform">
      <HeadlineMetrics summary={summary} />
      <section className="dashboard-feature-grid dashboard-feature-grid-platform">
        <FeatureChart summary={summary} />
        <PlatformOnboardingPanel summary={summary} permissions={permissions} />
      </section>
      <section className="dashboard-context-grid dashboard-context-grid-platform">
        <TenantHighlightsPanel summary={summary} permissions={permissions} />
        <LeadStatusPanel summary={summary} />
      </section>
      <SupportingMetricsPanel summary={summary} />
    </div>
  );
}
