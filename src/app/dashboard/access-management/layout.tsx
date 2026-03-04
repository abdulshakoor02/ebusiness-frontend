"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, FileKey } from "lucide-react";

export default function AccessManagementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        {
            name: "Role Permissions",
            href: "/dashboard/access-management/role-permissions",
            icon: Shield,
        },
        {
            name: "Permission Rules",
            href: "/dashboard/access-management/rules",
            icon: FileKey,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Access Management</h2>
                    <p className="text-zinc-500 mt-1">
                        Manage role-based access control, permissions, and security policies.
                    </p>
                </div>
            </div>

            <div className="border-b border-zinc-200 dark:border-zinc-800">
                <nav className="flex space-x-8" aria-label="Access Management">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {children}
        </div>
    );
}