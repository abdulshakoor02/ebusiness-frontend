import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex h-[70vh] w-full items-center justify-center animate-in fade-in duration-500">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading module...</p>
            </div>
        </div>
    );
}
