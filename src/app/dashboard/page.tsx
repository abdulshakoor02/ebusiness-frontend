"use client";

import { useState } from "react";
import {
    Building2,
    Users,
    Activity,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Shield,
    Target,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    PhoneCall,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionsContext";
import { useMonthlySummary } from "@/hooks/useCharts";

// Dummy Data for Super Admin (SaaS View)
const superAdminChartData = [
    { month: "Jan", revenue: 12400, users: 400 },
    { month: "Feb", revenue: 15200, users: 450 },
    { month: "Mar", revenue: 14800, users: 510 },
    { month: "Apr", revenue: 18900, users: 620 },
    { month: "May", revenue: 21500, users: 780 },
    { month: "Jun", revenue: 25400, users: 950 },
    { month: "Jul", revenue: 28900, users: 1100 },
];

const superAdminRecentActivity = [
    { id: 1, type: "tenant_created", message: "Acme Corp was registered", time: "2 hours ago", status: "success" },
    { id: 2, type: "user_added", message: "Alice (Admin) joined Nexus", time: "5 hours ago", status: "success" },
    { id: 3, type: "system", message: "Database automated backup completed", time: "1 day ago", status: "info" },
    { id: 4, type: "permission_changed", message: "Manager role updated", time: "2 days ago", status: "warning" },
];

const crmRecentActivity = [
    { id: 1, type: "lead_assigned", message: "New lead 'John Doe' assigned to you", time: "10 mins ago" },
    { id: 2, type: "status_changed", message: "Lead 'Acme Corp' converted to Active Client", time: "1 hour ago" },
    { id: 3, type: "follow_up", message: "Follow-up appointed with Sarah Jenkins", time: "3 hours ago" },
    { id: 4, type: "receipt_generated", message: "New receipt #REC-089 generated", time: "5 hours ago" },
];

const leadsBySource = [
    { name: "Facebook Ads", value: 400 },
    { name: "Organic Search", value: 300 },
    { name: "Referrals", value: 200 },
    { name: "Direct", value: 100 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function DashboardOverview() {
    // Determine the current user's role 
    const { role } = usePermissions();
    const isSuperAdmin = role === "superadmin";

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const { data: monthlyData, isLoading: isMonthlyLoading } = useMonthlySummary(selectedMonth, selectedYear);

    const chartData = (monthlyData?.data ?? []).map((d) => ({
        day: new Date(d.date).getDate(),
        appointments_booked: d.appointments_booked,
        comments_added: d.comments_added,
    }));

    const goToPrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((y) => y - 1);
        } else {
            setSelectedMonth((m) => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((y) => y + 1);
        } else {
            setSelectedMonth((m) => m + 1);
        }
    };

    // Sub-component for Super Admin View
    const renderSuperAdminDash = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">$45,231.89</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">+2350</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +180 new today
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">+12,234</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Platform Health</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">99.9%</div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center mt-1.5">
                            +0.1% from last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <Card className="col-span-4 card-glass shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                        <CardDescription className="text-sm">
                            Platform revenue growth over the past 7 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[350px] w-full pr-6 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={superAdminChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        padding={{ left: 20, right: 20 }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                        width={80}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                                        formatter={(value: any) => [`$${value}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3 card-glass shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                        <CardDescription className="text-sm">
                            Latest actions performed across the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {superAdminRecentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start group">
                                    <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        {activity.type === 'tenant_created' && <Building2 className="h-4 w-4 text-blue-500" />}
                                        {activity.type === 'user_added' && <Users className="h-4 w-4 text-green-500" />}
                                        {activity.type === 'system' && <Activity className="h-4 w-4 text-muted-foreground" />}
                                        {activity.type === 'permission_changed' && <Shield className="h-4 w-4 text-amber-500" />}
                                    </div>
                                    <div className="ml-3 space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-tight">{activity.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    // Sub-component for CRM/Tenant View
    const renderCrmDash = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline Leads</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Target className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">1,245</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +12% vs last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">342</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            15 conversions this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">$18,402</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +5% vs last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-ups</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">28</div>
                        <p className="text-xs text-red-400 font-medium flex items-center mt-1.5">
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                            5 overdue tasks
                        </p>
                    </CardContent>
                </Card>
                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">12</div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center mt-1.5">
                            3 completed today
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-glass shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Follow-ups</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                            <PhoneCall className="h-4 w-4 text-pink-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">8</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1.5">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +2 since morning
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7">
                {/* Monthly Activity Tracker */}
                <Card className="col-span-4 card-glass shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                              <div>
                                  <CardTitle className="text-base font-semibold">Monthly Activity Tracker</CardTitle>
                                  <CardDescription className="text-sm">
                                      Daily appointments and comments for the month.
                                  </CardDescription>
                              </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <span className="text-sm font-medium min-w-[140px] text-center">
                                      {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                  </span>
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                                      <ChevronRight className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent className="pl-0">
                          <div className="h-[350px] w-full pr-6 pt-4">
                              {isMonthlyLoading ? (
                                  <div className="flex items-center justify-center h-full">
                                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                              ) : (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                              </linearGradient>
                                              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                              </linearGradient>
                                        </defs>
                                          <XAxis
                                              dataKey="day"
                                              stroke="#888888"
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                              padding={{ left: 10, right: 10 }}
                                              label={{ value: "Day", position: "insideBottomRight", offset: -5, fontSize: 12, fill: "#888888" }}
                                        />
                                        <YAxis
                                              stroke="#888888"
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                              width={40}
                                              allowDecimals={false}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                                        <Tooltip
                                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                                              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                                              labelFormatter={(label) => `Day ${label}`}
                                          />
                                          <Area
                                              type="monotone"
                                              dataKey="appointments_booked"
                                            name="Appointments"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAppointments)"
                                            animationDuration={1500}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="comments_added"
                                            name="Comments"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorComments)"
                                            animationDuration={1500}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Lead Sources Pie Chart */}
                <Card className="col-span-3 card-glass shadow-sm transition-all hover:shadow-md flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Leads by Source</CardTitle>
                        <CardDescription className="text-sm">
                            Distribution of incoming leads.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pb-2">
                        <div className="h-[350px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadsBySource}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {leadsBySource.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CRM Recent Activity */}
            <div className="grid gap-5 lg:grid-cols-1">
                <Card className="card-glass shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Recent CRM Activity</CardTitle>
                        <CardDescription className="text-sm">
                            Your latest updates, lead assignments, and tasks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {crmRecentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center group">
                                    <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        {activity.type === 'lead_assigned' && <Target className="h-4 w-4 text-blue-500" />}
                                        {activity.type === 'status_changed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {activity.type === 'follow_up' && <Calendar className="h-4 w-4 text-orange-500" />}
                                        {activity.type === 'receipt_generated' && <CreditCard className="h-4 w-4 text-indigo-500" />}
                                    </div>
                                    <div className="ml-3 flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-tight">{activity.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground mt-1.5">
                    {isSuperAdmin
                        ? "Your platform's general metrics and recent performance."
                        : "Your active leads, upcoming tasks, and conversion metrics."}
                </p>
            </div>
            
            {/* Conditional Rendering based on Role */}
            {isSuperAdmin ? renderSuperAdminDash() : renderCrmDash()}
            
        </div>
    );
}
