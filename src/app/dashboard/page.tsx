"use client";

import {
    Building2,
    Users,
    Activity,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Shield
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dummy Data
const chartData = [
    { month: "Jan", revenue: 12400, users: 400 },
    { month: "Feb", revenue: 15200, users: 450 },
    { month: "Mar", revenue: 14800, users: 510 },
    { month: "Apr", revenue: 18900, users: 620 },
    { month: "May", revenue: 21500, users: 780 },
    { month: "Jun", revenue: 25400, users: 950 },
    { month: "Jul", revenue: 28900, users: 1100 },
];

const recentActivity = [
    { id: 1, type: "tenant_created", message: "Acme Corp was registered", time: "2 hours ago", status: "success" },
    { id: 2, type: "user_added", message: "Alice (Admin) joined Nexus", time: "5 hours ago", status: "success" },
    { id: 3, type: "system", message: "Database automated backup completed", time: "1 day ago", status: "info" },
    { id: 4, type: "permission_changed", message: "Manager role updated", time: "2 days ago", status: "warning" },
];

export default function DashboardOverview() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-zinc-500 mt-2">
                    Your platform metrics and recent performance.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Revenue</CardTitle>
                        <CreditCard className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Active Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +180 new today
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-green-500 font-medium flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Platform Health</CardTitle>
                        <Activity className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.9%</div>
                        <p className="text-xs text-zinc-500 font-medium flex items-center mt-1">
                            +0.1% from last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <Card className="col-span-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>
                            Platform revenue growth over the past 7 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[350px] w-full pr-6 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                                        formatter={(value: any) => [`$${value}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest actions performed across the ERP.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start">
                                    <div className="mt-1 bg-zinc-100 dark:bg-zinc-900 rounded-full p-2 border border-zinc-200 dark:border-zinc-800">
                                        {activity.type === 'tenant_created' && <Building2 className="h-4 w-4 text-blue-500" />}
                                        {activity.type === 'user_added' && <Users className="h-4 w-4 text-green-500" />}
                                        {activity.type === 'system' && <Activity className="h-4 w-4 text-zinc-500" />}
                                        {activity.type === 'permission_changed' && <Shield className="h-4 w-4 text-amber-500" />}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.message}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
}
