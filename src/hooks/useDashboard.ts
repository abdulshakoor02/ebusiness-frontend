"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import {
  DashboardResponse,
  DashboardRole,
  DashboardRoleMismatchError,
  DashboardSchemaError,
  DashboardSummary,
  dashboardResponseSchema,
  getDashboardTimezone,
  isDashboardRole,
} from "@/lib/dashboard";

export type {
  DashboardLeadStatus,
  DashboardMetric,
  DashboardPeriod,
  DashboardRecentLead,
  DashboardResponse,
  DashboardRole,
  DashboardScope,
  DashboardSummary,
  DashboardTenantHighlight,
  DashboardTrendPoint,
  DashboardUpcoming,
} from "@/lib/dashboard";

export type DashboardQueryKey = readonly [
  "dashboard-summary",
  string,
  string,
  DashboardRole | null,
  string,
];

export class DashboardSessionError extends Error {
  constructor() {
    super("A valid authenticated dashboard session is required.");
    this.name = "DashboardSessionError";
  }
}

function shouldRetryDashboard(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) return false;
  }

  if (error instanceof DashboardRoleMismatchError || error instanceof DashboardSchemaError) {
    return false;
  }

  return failureCount < 1;
}

export function useDashboardSummary(requestedEnabled = true) {
  const { data: session, status: sessionStatus } = useSession();
  const sessionId = session?.user?.id ?? "";
  const tenantId = session?.user?.tenant_id ?? "";
  const sessionRole = isDashboardRole(session?.user?.role) ? session.user.role : null;
  const timezone = getDashboardTimezone();
  const hasValidSession = sessionStatus === "authenticated" && Boolean(sessionId) && Boolean(sessionRole) && (sessionRole === "superadmin" || Boolean(tenantId));
  const queryKey: DashboardQueryKey = [
    "dashboard-summary",
    sessionId,
    tenantId,
    sessionRole,
    timezone,
  ];

  const query = useQuery<DashboardSummary, unknown, DashboardSummary, DashboardQueryKey>({
    queryKey,
    enabled: requestedEnabled && hasValidSession,
    queryFn: async ({ signal }): Promise<DashboardSummary> => {
      if (!hasValidSession || !sessionRole) {
        throw new DashboardSessionError();
      }

      const response = await apiClient.get<DashboardResponse>("/dashboard/summary", {
        params: { timezone },
        signal,
      });
      const parsed = dashboardResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new DashboardSchemaError();
      }

      if (parsed.data.data.role !== sessionRole) {
        throw new DashboardRoleMismatchError(sessionRole, parsed.data.data.role);
      }

      return parsed.data.data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: shouldRetryDashboard,
  });

  const accessDenied = isAxiosError(query.error) && (query.error.response?.status === 401 || query.error.response?.status === 403);

  return {
    accessDenied,
    data: query.data,
    summary: query.data,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetchError: query.isRefetchError,
    isSuccess: query.isSuccess,
    status: query.status,
    refetch: query.refetch,
    queryKey,
    session,
    sessionStatus,
    sessionId,
    tenantId,
    sessionRole,
    timezone,
    hasValidSession,
  };
}
