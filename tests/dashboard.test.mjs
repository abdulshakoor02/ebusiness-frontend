import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

// Exercise the actual TypeScript helpers without adding a test-runner dependency.
const source = await readFile(new URL("../src/lib/dashboard.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const testModule = { exports: {} };
new Function("require", "exports", "module", compiled)(createRequire(import.meta.url), testModule.exports, testModule);
const helpers = testModule.exports;
const sample = () => ({
  data: {
    generated_at: "2026-10-08T00:00:00Z", role: "user", scope: "personal", tenant_name: "Test tenant",
    period: { start: "2026-10-01T00:00:00Z", end_exclusive: "2026-10-08T00:00:00Z", comparison_start: "2026-09-01T00:00:00Z", comparison_end_exclusive: "2026-09-08T00:00:00Z", timezone: "UTC" },
    metrics: { leads: { value: 0, format: "number", period: "all_time" } },
    trend: [{ label: "Oct", start: "2026-10-01", leads: 0, tenants: 0, users: 0, appointments: 0, follow_ups: 0, comments: 0 }],
    lead_status: [], upcoming: [], recent_leads: [], tenant_highlights: [],
  },
});

test("dashboard accepts only supported account roles", () => {
  for (const role of ["superadmin", "admin", "user"]) assert.equal(helpers.isDashboardRole(role), true);
  for (const role of [undefined, null, "", "manager", "super_admin", 1]) assert.equal(helpers.isDashboardRole(role), false);
});

test("live response schema preserves real zeroes and rejects broken responses", () => {
  const result = helpers.dashboardResponseSchema.parse(sample());
  assert.equal(result.data.metrics.leads.value, 0);
  assert.deepEqual(result.data.upcoming, []);
  for (const change of [value => { value.data.upcoming = null; }, value => { value.data.generated_at = "not a date"; }, value => { value.data.role = "manager"; }, value => { value.data.metrics.leads.value = "42"; }]) {
    const value = sample(); change(value);
    assert.equal(helpers.dashboardResponseSchema.safeParse(value).success, false);
  }
});

test("legacy tasks without a lead reference remain displayable", () => {
  const value = sample();
  value.data.upcoming.push({ id: "task-1", title: "Call", kind: "appointment", start_time: "2026-10-08T01:00:00Z", end_time: "2026-10-08T02:00:00Z", status: "scheduled", overdue: false });
  assert.equal(helpers.dashboardResponseSchema.safeParse(value).success, true);
});

test("snapshots and zero comparison periods never fabricate growth percentages", () => {
  const metric = { value: 12, format: "number", period: "month" };
  for (const previous of [undefined, null, 0]) assert.equal(helpers.getDashboardDelta({ ...metric, previous }), null);
  assert.deepEqual(helpers.getDashboardDelta({ ...metric, previous: 10 }), { direction: "up", label: "+20% vs previous period" });
  assert.equal(helpers.getDashboardDelta({ ...metric, previous: 24 }).direction, "down");
  assert.equal(helpers.getDashboardDelta({ ...metric, previous: 12 }).direction, "flat");
});

test("missing currency is not silently labelled USD", () => {
  const metric = { value: 1250.5, format: "currency", period: "month" };
  assert.equal(helpers.formatDashboardMetric(metric, undefined, "en-US"), "1,250.5");
  assert.equal(helpers.formatDashboardMetric(metric, "", "en-US"), "1,250.5");
  assert.match(helpers.formatDashboardMetric(metric, "AED", "en-US"), /AED/);
  assert.equal(helpers.formatDashboardMetric(undefined), "—");
});

test("display dates follow response timezone rather than browser month", () => {
  assert.match(helpers.formatDashboardDate("2026-09-30T21:00:00Z", "Asia/Dubai", { dateStyle: "medium" }, "en-US"), /Oct 1, 2026/);
  assert.equal(helpers.formatDashboardDate("bad-date", "UTC"), "Date unavailable");
});

test("dashboard query is isolated by account and uses cancellable aggregate API", async () => {
  const hook = await readFile(new URL("../src/hooks/useDashboard.ts", import.meta.url), "utf8");
  assert.match(hook, /"dashboard-summary",\s*sessionId,\s*tenantId,\s*sessionRole,\s*timezone/);
  assert.match(hook, /params: \{ timezone \}/);
  assert.match(hook, /signal,/);
  assert.match(hook, /status === 401 \|\| status === 403/);
  assert.match(hook, /parsed\.data\.data\.role !== sessionRole/);
  assert.match(hook, /refetchInterval: 60_000/);
});

test("dashboard renders distinct role views without old static fixtures", async () => {
  const page = await readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8");
  for (const component of ["SuperadminDashboard", "AdminDashboard", "UserDashboard"]) assert.ok(page.includes(component));
  assert.doesNotMatch(page, /superAdminChartData|crmRecentActivity|45,231|99\.9%|localStorage/);
  assert.match(page, /dashboard\.accessDenied/);
});
