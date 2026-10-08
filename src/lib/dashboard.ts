import { z } from "zod";
import { isAxiosError } from "axios";

export const dashboardRoles = ["superadmin", "admin", "user"] as const;
export type DashboardRole = (typeof dashboardRoles)[number];

export const dashboardScopes = ["platform", "tenant", "personal"] as const;
export type DashboardScope = (typeof dashboardScopes)[number];

const idSchema = z.string().min(1);
const isoLikeSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid date");

export const dashboardMetricSchema = z.object({
  value: z.number(),
  previous: z.number().nullable().optional(),
  format: z.enum(["number", "currency"]),
  period: z.enum(["all_time", "month", "today", "current"]),
});

export const dashboardPeriodSchema = z.object({
  start: isoLikeSchema,
  end_exclusive: isoLikeSchema,
  comparison_start: isoLikeSchema,
  comparison_end_exclusive: isoLikeSchema,
  timezone: z.string().min(1),
});

export const dashboardTrendPointSchema = z.object({
  label: z.string(),
  start: isoLikeSchema,
  leads: z.number(),
  tenants: z.number(),
  users: z.number(),
  appointments: z.number(),
  follow_ups: z.number(),
  comments: z.number(),
  revenue: z.number().optional(),
});

export const dashboardSummarySchema = z.object({
  generated_at: isoLikeSchema,
  role: z.enum(dashboardRoles),
  scope: z.enum(dashboardScopes),
  tenant_name: z.string().optional(),
  currency: z.string().optional(),
  period: dashboardPeriodSchema,
  metrics: z.record(z.string(), dashboardMetricSchema),
  trend: z.array(dashboardTrendPointSchema),
  lead_status: z.array(z.object({ label: z.string(), value: z.number() })),
  upcoming: z.array(
    z.object({
      id: idSchema,
      lead_id: idSchema.optional(),
      kind: z.enum(["appointment", "follow_up"]),
      title: z.string(),
      start_time: isoLikeSchema,
      end_time: isoLikeSchema,
      status: z.string(),
      overdue: z.boolean(),
    }),
  ),
  recent_leads: z.array(
    z.object({
      id: idSchema,
      name: z.string(),
      status: z.string(),
      created_at: isoLikeSchema,
    }),
  ),
  tenant_highlights: z.array(
    z.object({
      id: idSchema,
      name: z.string(),
      created_at: isoLikeSchema,
      leads: z.number(),
      users: z.number(),
    }),
  ),
});

export const dashboardResponseSchema = z.object({
  data: dashboardSummarySchema,
});

export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;
export type DashboardTrendPoint = z.infer<typeof dashboardTrendPointSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type DashboardLeadStatus = DashboardSummary["lead_status"][number];
export type DashboardUpcoming = DashboardSummary["upcoming"][number];
export type DashboardRecentLead = DashboardSummary["recent_leads"][number];
export type DashboardTenantHighlight = DashboardSummary["tenant_highlights"][number];

export function isDashboardRole(value: unknown): value is DashboardRole {
  return typeof value === "string" && (dashboardRoles as readonly string[]).includes(value);
}

export class DashboardRoleMismatchError extends Error {
  readonly expectedRole: DashboardRole;
  readonly receivedRole: DashboardRole;

  constructor(expectedRole: DashboardRole, receivedRole: DashboardRole) {
    super("The dashboard response did not match the signed-in account role.");
    this.name = "DashboardRoleMismatchError";
    this.expectedRole = expectedRole;
    this.receivedRole = receivedRole;
  }
}

export class DashboardSchemaError extends Error {
  constructor() {
    super("The dashboard response was not valid.");
    this.name = "DashboardSchemaError";
  }
}

export function getDashboardErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return "Your session no longer has access to this dashboard. Sign in again or ask an administrator for access.";
    }
    if (status && status >= 500) {
      return "The dashboard service is temporarily unavailable. Try again in a moment.";
    }
  }

  if (error instanceof DashboardRoleMismatchError) {
    return "The dashboard account context changed. Refresh the page to load the right view.";
  }

  if (error instanceof DashboardSchemaError) {
    return "The dashboard returned data in an unexpected format. Try again or contact support.";
  }

  return "We could not load live dashboard data. Try again.";
}

export function getDashboardTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatDashboardMetric(
  metric: DashboardMetric | undefined,
  currency?: string,
  locale?: string,
): string {
  if (!metric) return "—";

  if (metric.format === "currency" && currency?.trim()) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency.trim().toUpperCase(),
        maximumFractionDigits: 2,
      }).format(metric.value);
    } catch {
      // Currency values without a valid configured ISO code stay symbol-free.
    }
  }

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(metric.value);
}

export type DashboardDelta = {
  direction: "up" | "down" | "flat";
  label: string;
};

export function getDashboardDelta(metric: DashboardMetric | undefined): DashboardDelta | null {
  if (!metric || metric.previous === undefined || metric.previous === null || metric.previous === 0) {
    return null;
  }

  const change = ((metric.value - metric.previous) / Math.abs(metric.previous)) * 100;
  if (!Number.isFinite(change)) return null;
  if (change === 0) return { direction: "flat", label: "No change" };

  return {
    direction: change > 0 ? "up" : "down",
    label: `${change > 0 ? "+" : ""}${Math.round(change)}% vs previous period`,
  };
}

export function formatDashboardDate(
  value: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
  locale?: string,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

export function dashboardRoleLabel(role: DashboardRole): string {
  switch (role) {
    case "superadmin":
      return "Platform administrator";
    case "admin":
      return "Workspace administrator";
    case "user":
      return "Personal workspace";
  }
}

export function dashboardMetricPeriodLabel(period: DashboardMetric["period"]): string {
  switch (period) {
    case "all_time":
      return "All time";
    case "month":
      return "This month";
    case "today":
      return "Today";
    case "current":
      return "Current";
  }
}
