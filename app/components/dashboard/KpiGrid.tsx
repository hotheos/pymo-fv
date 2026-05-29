import {
    CalendarClock,
    CheckCircle2,
    Ban,
    Loader2,
} from "lucide-react";

interface KpiGridProps {
    pendingVisits: number;
    inProcessVisits: number;
    cancelledVisits: number;
    completedOrdersCount: number;
}

/** Mobile-only 2x2 KPI grid (hidden on desktop via lg:hidden) */
export default function KpiGrid({ pendingVisits, inProcessVisits, cancelledVisits, completedOrdersCount }: KpiGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:hidden">
            {/* 1. Por visitar */}
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-high flex flex-col items-center justify-center aspect-[4/3]">
                <CalendarClock className="text-amber-500 mb-2" size={24} />
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{pendingVisits}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Por visitar</span>
            </div>
            {/* 2. Visitando */}
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-high flex flex-col items-center justify-center aspect-[4/3]">
                <Loader2 className="text-blue-500 mb-2 animate-spin-slow" size={24} />
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{inProcessVisits}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Visitando</span>
            </div>
            {/* 3. Canceladas */}
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-high flex flex-col items-center justify-center aspect-[4/3]">
                <Ban className="text-red-500 mb-2" size={24} />
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{cancelledVisits}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Canceladas</span>
            </div>
            {/* 4. Finalizadas */}
            <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-high flex flex-col items-center justify-center aspect-[4/3]">
                <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{completedOrdersCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Finalizadas</span>
            </div>
        </div>
    );
}
