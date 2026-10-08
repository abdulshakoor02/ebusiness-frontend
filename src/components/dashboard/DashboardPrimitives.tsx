"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardMetric,
  DashboardRole,
  DashboardSummary,
  formatDashboardDate,
  formatDashboardMetric,
  getDashboardDelta,
  dashboardMetricPeriodLabel,
  dashboardRoleLabel,
} from "@/lib/dashboard";

export type DashboardPermissionState = {
  hasPermission: (permission: string) => boolean;
  isReady: boolean;
};

type IconType = typeof Target;

type MetricMeta = {
  label: string;
  helper: string;
  icon: IconType;
  tone: "blue" | "cyan" | "emerald" | "violet" | "amber" | "rose";
};

const metricMeta: Record<string, MetricMeta> = {
  tenants: { label: "Tenants", helper: "All platform workspaces", icon: Users, tone: "violet" },
  new_tenants: { label: "New tenants", helper: "Added this month", icon: Sparkles, tone: "cyan" },
  users: { label: "People", helper: "In this workspace scope", icon: Users, tone: "blue" },
  new_users: { label: "New people", helper: "Added this month", icon: UserRound, tone: "cyan" },
  leads: { label: "Leads", helper: "Current scope", icon: Target, tone: "blue" },
  active_leads: { label: "Active clients", helper: "Leads marked active", icon: CheckCircle2, tone: "emerald" },
  new_leads: { label: "New leads", helper: "Added this month", icon: ArrowUpRight, tone: "cyan" },
  revenue: { label: "Receipts", helper: "Net collected this month", icon: CircleDollarSign, tone: "emerald" },
  invoiced: { label: "Invoiced", helper: "Gross this month", icon: CircleDollarSign, tone: "blue" },
  outstanding: { label: "Outstanding", helper: "Gross unpaid balance", icon: Clock3, tone: "amber" },
  open_invoices: { label: "Open invoices", helper: "Currently unpaid", icon: ListChecks, tone: "amber" },
  appointments_today: { label: "Appointments today", helper: "Scheduled for today", icon: CalendarClock, tone: "cyan" },
  appointments_completed_today: { label: "Completed today", helper: "Appointments completed", icon: CheckCircle2, tone: "emerald" },
  open_follow_ups: { label: "Open follow-ups", helper: "Still to action", icon: ListChecks, tone: "rose" },
  overdue_follow_ups: { label: "Overdue follow-ups", helper: "Need attention", icon: AlertTriangle, tone: "rose" },
  comments_month: { label: "Comments", helper: "Added this month", icon: BarChart3, tone: "violet" },
};

const headlineKeys: Record<DashboardRole, string[]> = {
  superadmin: ["tenants", "new_tenants", "users", "leads"],
  admin: ["leads", "active_leads", "revenue", "outstanding"],
  user: ["leads", "active_leads", "appointments_today", "overdue_follow_ups"],
};

const supportingMetricKeys: Record<DashboardRole, string[]> = {
  superadmin: ["new_users", "new_leads"],
  admin: [
    "new_leads",
    "users",
    "new_users",
    "invoiced",
    "open_invoices",
    "appointments_today",
    "appointments_completed_today",
    "open_follow_ups",
    "overdue_follow_ups",
    "comments_month",
  ],
  user: ["new_leads", "appointments_completed_today", "open_follow_ups", "comments_month"],
};

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

function cardClassName(className?: string) {
  return `dashboard-card card-glass p-0 gap-0 ${className ?? ""}`.trim();
}

export function EmptyState({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`dashboard-empty-state ${className ?? ""}`.trim()}>
      <span>{label}</span>
    </div>
  );
}

export function DashboardSectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="dashboard-section-heading">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action ? <div className="dashboard-heading-action">{action}</div> : null}
    </CardHeader>
  );
}

export function DashboardActionLink({
  href,
  label,
  permission,
  permissions,
}: {
  href: string;
  label: string;
  permission: string | string[];
  permissions: DashboardPermissionState;
}) {
  const allowedPermissions = Array.isArray(permission) ? permission : [permission];
  if (!permissions.isReady || !allowedPermissions.some((item) => permissions.hasPermission(item))) return null;

  return (
    <Button variant="ghost" size="sm" asChild className="dashboard-action-link">
      <Link href={href}>
        {label}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

export function DashboardHeader({
  summary,
  userName,
  permissions,
  isRefreshing,
  onRefresh,
}: {
  summary: DashboardSummary;
  userName?: string | null;
  permissions: DashboardPermissionState;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] || "there";
  const periodStart = formatDashboardDate(summary.period.start, summary.period.timezone, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const periodEnd = formatDashboardDate(summary.period.end_exclusive, summary.period.timezone, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="dashboard-hero" data-glass="dashboard-hero">
      <div className="dashboard-hero-copy">
        <div className="flex flex-wrap items-center gap-2">
          <p className="dashboard-eyebrow">{dashboardRoleLabel(summary.role)}</p>
          <Badge variant="outline" className="dashboard-scope-badge">
            {summary.scope} scope
          </Badge>
        </div>
        <h1 className="dashboard-hero-title">Good to see you, {firstName}.</h1>
        <p className="dashboard-hero-description">
          {summary.role === "superadmin"
            ? "Keep a clear view of platform growth and tenant onboarding."
            : summary.role === "admin"
              ? `A live view of ${summary.tenant_name || "your workspace"}, pipeline health, and collections.`
              : "A focused view of your assigned work and the next customer moments."}
        </p>
        <div className="dashboard-period-line">
          <span>{periodStart} – {periodEnd}</span>
          <span aria-hidden="true">·</span>
          <span>Timezone: {summary.period.timezone}</span>
        </div>
      </div>
      <div className="dashboard-hero-actions">
        {summary.role === "superadmin" ? (
          <DashboardActionLink
            href="/dashboard/tenants"
            label="Manage tenants"
            permission="can_list_tenants"
            permissions={permissions}
          />
        ) : (
          <DashboardActionLink
            href="/dashboard/leads"
            label="Open leads"
            permission={summary.role === "user" ? ["can_view_own_leads", "can_view_leads"] : ["can_list_leads", "can_view_leads"]}
            permissions={permissions}
          />
        )}
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function MetricDelta({ metric }: { metric: DashboardMetric }) {
  const delta = getDashboardDelta(metric);
  if (!delta) {
    return <span className="dashboard-metric-neutral">Live data · {dashboardMetricPeriodLabel(metric.period)}</span>;
  }

  const DeltaIcon = delta.direction === "down" ? ArrowDownRight : delta.direction === "up" ? ArrowUpRight : null;
  return (
    <span className={`dashboard-metric-delta dashboard-metric-delta-${delta.direction}`}>
      {DeltaIcon ? <DeltaIcon className="h-3.5 w-3.5" /> : null}
      {delta.label}
    </span>
  );
}

export function HeadlineMetrics({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="dashboard-headline-grid" aria-label="Headline metrics">
      {headlineKeys[summary.role].map((key) => {
        const metric = summary.metrics[key];
        const meta = metricMeta[key];
        if (!metric || !meta) return null;
        const Icon = meta.icon;
        return (
          <Card key={key} data-glass="dashboard-metric" className={cardClassName("dashboard-metric-card")}>
            <div className={`dashboard-metric-orb dashboard-metric-orb-${meta.tone}`} aria-hidden="true" />
            <CardHeader className="dashboard-metric-header">
              <div>
                <CardTitle>{meta.label}</CardTitle>
                <CardDescription>{meta.helper}</CardDescription>
              </div>
              <span className={`dashboard-metric-icon dashboard-metric-icon-${meta.tone}`}><Icon /></span>
            </CardHeader>
            <CardContent className="dashboard-metric-content">
              <div className="dashboard-metric-value" data-format={metric.format} title={formatDashboardMetric(metric, summary.currency)}>{formatDashboardMetric(metric, summary.currency)}</div>
              <MetricDelta metric={metric} />
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

export function SupportingMetricsPanel({ summary }: { summary: DashboardSummary }) {
  const metrics = supportingMetricKeys[summary.role]
    .map((key) => ({ key, metric: summary.metrics[key], meta: metricMeta[key] }))
    .filter((item): item is { key: string; metric: DashboardMetric; meta: MetricMeta } => Boolean(item.metric && item.meta));

  if (metrics.length === 0) return null;

  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-supporting-card")}>
      <DashboardSectionHeading title="More live signals" description="Additional metrics returned for this scope." />
      <CardContent className="dashboard-supporting-content">
        {metrics.map(({ key, metric, meta }) => {
          const Icon = meta.icon;
          return (
            <div className="dashboard-supporting-row" key={key}>
              <span className={`dashboard-supporting-icon dashboard-metric-icon-${meta.tone}`}><Icon /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{meta.label}</p><p className="text-xs text-muted-foreground">{meta.helper}</p></div>
              <div className="text-right"><p className="font-semibold">{formatDashboardMetric(metric, summary.currency)}</p><MetricDelta metric={metric} /></div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

type ChartSeries = {
  key: keyof DashboardSummary["trend"][number];
  label: string;
  color: string;
  format?: "currency" | "number";
};

const chartSeriesByRole: Record<DashboardRole, ChartSeries[]> = {
  superadmin: [
    { key: "tenants", label: "Tenants", color: "var(--dashboard-chart-primary)" },
    { key: "users", label: "People", color: "var(--dashboard-chart-secondary)" },
    { key: "leads", label: "Leads", color: "var(--dashboard-chart-tertiary)" },
  ],
  admin: [
    { key: "revenue", label: "Receipts · before tax", color: "var(--dashboard-chart-primary)", format: "currency" },
  ],
  user: [
    { key: "leads", label: "Leads", color: "var(--dashboard-chart-primary)" },
    { key: "appointments", label: "Appointments", color: "var(--dashboard-chart-secondary)" },
    { key: "follow_ups", label: "Follow-ups", color: "var(--dashboard-chart-tertiary)" },
  ],
};

function getChartSeries(summary: DashboardSummary): ChartSeries[] {
  const candidates = chartSeriesByRole[summary.role];
  if (summary.role !== "admin") return candidates;

  const hasRevenue = summary.trend.some((point) => typeof point.revenue === "number");
  return hasRevenue ? candidates : [{ key: "leads", label: "Leads", color: "var(--dashboard-chart-primary)" }];
}

export function FeatureChart({ summary }: { summary: DashboardSummary }) {
  const series = getChartSeries(summary);
  const chartData = summary.trend.map((point) => {
    const result: Record<string, string | number> = { label: point.label };
    series.forEach((item) => {
      const value = point[item.key];
      if (typeof value === "number") result[item.key] = value;
    });
    return result;
  });
  const title = summary.role === "superadmin" ? "Platform growth" : summary.role === "admin" ? (series.some((item) => item.key === "revenue") ? "Collections pulse" : "Workspace activity") : "Your activity pulse";
  const description = summary.role === "superadmin" ? "Monthly movement across the platform." : summary.role === "admin" ? "Monthly movement in this workspace." : "Monthly activity in your personal scope.";

  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-chart-card")}>
      <DashboardSectionHeading
        title={title}
        description={description}
        action={<Badge variant="outline" className="dashboard-live-badge"><span />Live</Badge>}
      />
      <CardContent className="dashboard-chart-content">
        {chartData.length === 0 || series.length === 0 ? (
          <EmptyState label="Trend data will appear here when activity is available." />
        ) : (
          <div className="dashboard-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {series.map((item, index) => (
                    <linearGradient key={item.key} id={`dashboard-trend-fill-${summary.role}-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.34} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--dashboard-chart-grid)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" stroke="var(--dashboard-chart-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--dashboard-chart-muted)" tickLine={false} axisLine={false} fontSize={11} width={48} allowDecimals={false} tickFormatter={(value: number) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                <Tooltip
                  contentStyle={{ background: "var(--dashboard-chart-tooltip)", border: "1px solid var(--border)", borderRadius: "14px", color: "var(--foreground)" }}
                  formatter={(value, name) => {
                    const config = series.find((item) => item.key === name);
                    if (config?.format === "currency") return [formatDashboardMetric({ value: Number(value), format: "currency", period: "month" }, summary.currency), config.label];
                    return [numberFormatter.format(Number(value)), config?.label ?? name];
                  }}
                />
                {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} formatter={(key) => series.find((item) => item.key === key)?.label ?? key} /> : null}
                {series.map((item, index) => (
                  <Area key={item.key} type="monotone" dataKey={item.key} name={item.key} stroke={item.color} strokeWidth={index === 0 ? 3 : 2} fill={`url(#dashboard-trend-fill-${summary.role}-${index})`} dot={false} connectNulls={false} isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeadStatusPanel({ summary }: { summary: DashboardSummary }) {
  const total = summary.lead_status.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-status-card")}>
      <DashboardSectionHeading title="Lead health" description="The current distribution of lead status." />
      <CardContent className="dashboard-panel-content">
        {summary.lead_status.length === 0 ? (
          <EmptyState label="No lead status data is available yet." />
        ) : (
          <div className="dashboard-status-list">
            {summary.lead_status.map((item, index) => {
              const value = Math.max(item.value, 0);
              const width = total > 0 ? (value / total) * 100 : 0;
              return (
                <div className="dashboard-status-item" key={`${item.label}-${index}`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{numberFormatter.format(value)}</span>
                  </div>
                  <div className="dashboard-status-track" aria-hidden="true"><div className="dashboard-status-fill" style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
            <div className="dashboard-panel-footnote"><BarChart3 />{numberFormatter.format(total)} leads in this scope</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingPanel({ summary }: { summary: DashboardSummary }) {
  const items = [...summary.upcoming].sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime());
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-upcoming-card")}>
      <DashboardSectionHeading title={summary.role === "user" ? "Your next actions" : "Next up"} description="Appointments and follow-ups returned for this scope." action={<CalendarClock className="dashboard-heading-icon" />} />
      <CardContent className="dashboard-panel-content">
        {items.length === 0 ? (
          <EmptyState label="Nothing scheduled in the current window." />
        ) : (
          <div className="dashboard-activity-list">
            {items.map((task) => (
              <div data-glass="dashboard-list-row" key={`${task.kind}-${task.id}`} className={`dashboard-activity-row ${task.overdue ? "dashboard-activity-row-overdue" : ""}`}>
                <div className={`dashboard-task-icon ${task.overdue ? "dashboard-task-icon-overdue" : ""}`}>
                  {task.kind === "appointment" ? <CalendarClock /> : <Clock3 />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDashboardDate(task.start_time, summary.period.timezone)}</p>
                </div>
                <Badge variant={task.overdue ? "destructive" : "outline"} className="capitalize">{task.overdue ? "Overdue" : task.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentLeadsPanel({ summary, permissions }: { summary: DashboardSummary; permissions: DashboardPermissionState }) {
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-recent-card")}>
      <DashboardSectionHeading
        title="Recent leads"
        description={summary.role === "user" ? "Leads visible in your personal scope." : "Most recently created in this view."}
        action={<DashboardActionLink href="/dashboard/leads" label="View leads" permission={summary.role === "user" ? ["can_view_own_leads", "can_view_leads"] : ["can_list_leads", "can_view_leads"]} permissions={permissions} />}
      />
      <CardContent className="dashboard-table-content">
        {summary.recent_leads.length === 0 ? (
          <EmptyState label="No recent leads to show." />
        ) : (
          <div className="dashboard-table-scroll">
            <table data-glass="table" className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col">Lead</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-medium">{lead.name}</td>
                    <td><Badge variant="outline" className="capitalize">{lead.status}</Badge></td>
                    <td className="text-right text-muted-foreground">{formatDashboardDate(lead.created_at, summary.period.timezone, { dateStyle: "medium" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TenantHighlightsPanel({ summary, permissions }: { summary: DashboardSummary; permissions: DashboardPermissionState }) {
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-tenant-card")}>
      <DashboardSectionHeading
        title="Tenant momentum"
        description="Recent tenants with all-time lead and people counts."
        action={<DashboardActionLink href="/dashboard/tenants" label="View tenants" permission="can_list_tenants" permissions={permissions} />}
      />
      <CardContent className="dashboard-table-content">
        {summary.tenant_highlights.length === 0 ? (
          <EmptyState label="No tenant activity to show yet." />
        ) : (
          <div className="dashboard-table-scroll">
            <table data-glass="table" className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col">Tenant</th>
                  <th scope="col">Created</th>
                  <th scope="col">Leads</th>
                  <th scope="col" className="text-right">People</th>
                </tr>
              </thead>
              <tbody>
                {summary.tenant_highlights.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="font-medium">{tenant.name}</td>
                    <td className="text-muted-foreground">{formatDashboardDate(tenant.created_at, summary.period.timezone, { dateStyle: "medium" })}</td>
                    <td className="text-muted-foreground">{numberFormatter.format(tenant.leads)}</td>
                    <td className="text-right font-medium">{numberFormatter.format(tenant.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformOnboardingPanel({ summary, permissions }: { summary: DashboardSummary; permissions: DashboardPermissionState }) {
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-onboarding-card")}>
      <DashboardSectionHeading title="Onboarding this month" description="New activity across all workspaces, month to date." action={<Sparkles className="dashboard-heading-icon" />} />
      <CardContent className="dashboard-panel-content">
        <div className="dashboard-onboarding-list">
          {[
            { key: "new_tenants", label: "Tenant registrations", description: "New workspaces on the platform", Icon: Users },
            { key: "new_users", label: "People added", description: "New accounts across your tenants", Icon: UserRound },
            { key: "new_leads", label: "Pipeline additions", description: "New leads created this month", Icon: Target },
          ].map(({ key, label, description, Icon }) => (
            <div className="dashboard-onboarding-item" key={key}>
              <span className="dashboard-onboarding-check"><Icon /></span>
              <div className="min-w-0 flex-1"><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div>
              <strong className="text-xl tabular-nums">{formatDashboardMetric(summary.metrics[key])}</strong>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <DashboardActionLink href="/dashboard/tenants" label="Manage tenants" permission="can_create_tenants" permissions={permissions} />
          <DashboardActionLink href="/dashboard/users" label="Manage people" permission="can_list_users" permissions={permissions} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DueFocusPanel({ summary }: { summary: DashboardSummary }) {
  const overdue = summary.metrics.overdue_follow_ups;
  const next = summary.upcoming.filter((item) => !item.overdue).sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())[0];
  return (
    <Card data-glass="dashboard-feature" className={cardClassName("dashboard-focus-card")}>
      <DashboardSectionHeading title="Due focus" description="A truthful snapshot of what needs your attention." action={<AlertTriangle className="dashboard-heading-icon" />} />
      <CardContent className="dashboard-panel-content">
        <div className="dashboard-focus-stats">
          <div className="dashboard-focus-stat dashboard-focus-stat-alert"><span>Overdue</span><strong>{formatDashboardMetric(overdue)}</strong><small>active follow-ups past their end time</small></div>
          <div className="dashboard-focus-stat"><span>Next due</span><strong>{next ? formatDashboardDate(next.start_time, summary.period.timezone, { month: "short", day: "numeric" }) : "—"}</strong><small>{next?.title || "Nothing scheduled next"}</small></div>
        </div>
        <div className="dashboard-panel-footnote"><ListChecks />{formatDashboardMetric(summary.metrics.open_follow_ups)} open follow-ups in your scope</div>
      </CardContent>
    </Card>
  );
}

export function DashboardStaleBanner({ onRetry, isRefreshing }: { onRetry: () => void; isRefreshing?: boolean }) {
  return (
    <div className="dashboard-stale-banner" role="status">
      <div className="flex min-w-0 items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-medium">Showing the last successful snapshot.</p><p className="text-xs opacity-80">The latest refresh failed, so these metrics may be out of date.</p></div></div>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={isRefreshing}><RefreshCw className={isRefreshing ? "animate-spin" : ""} />Retry</Button>
    </div>
  );
}

export function DashboardUpdatedLine({ summary, isStale }: { summary: DashboardSummary; isStale?: boolean }) {
  return (
    <p className="dashboard-updated-line">
      <span className={isStale ? "dashboard-stale-dot" : "dashboard-live-dot"} aria-hidden="true" />
      {isStale ? "Snapshot from " : "Updated "}{formatDashboardDate(summary.generated_at, summary.period.timezone, { dateStyle: "medium", timeStyle: "short" })}
      <span aria-hidden="true">·</span>
      {isStale ? "Refresh to get current metrics" : "Live scope: " + summary.scope}
    </p>
  );
}

export function DashboardErrorState({ message, onRetry, isRetrying }: { message: string; onRetry: () => void; isRetrying?: boolean }) {
  return (
    <Card data-glass="dashboard-error" className={cardClassName("dashboard-error-card")}>
      <div className="dashboard-error-icon"><AlertTriangle /></div>
      <h2>Dashboard data is unavailable</h2>
      <p>{message}</p>
      <Button className="mt-5" onClick={onRetry} disabled={isRetrying}><RefreshCw className={isRetrying ? "animate-spin" : ""} />Try again</Button>
    </Card>
  );
}

export function DashboardAccessState({ title, description, icon = <UserRound /> }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <Card data-glass="dashboard-error" className={cardClassName("dashboard-error-card")}>
      <div className="dashboard-error-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  );
}

export function LoadingDashboard() {
  return (
    <div className="dashboard-loading" aria-busy="true" aria-live="polite">
      <div className="dashboard-loading-copy"><Skeleton className="h-3 w-32" /><Skeleton className="h-10 w-3/4 max-w-xl" /><Skeleton className="h-4 w-full max-w-lg" /></div>
      <div className="dashboard-headline-grid">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-[1.75rem]" />)}</div>
      <div className="dashboard-loading-main"><Skeleton className="h-[370px] rounded-[1.75rem]" /><Skeleton className="h-[370px] rounded-[1.75rem]" /></div>
    </div>
  );
}
