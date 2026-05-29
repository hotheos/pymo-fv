import { useState } from "react";
import {
    CalendarClock,
    CheckCircle2,
    Ban,
    Loader2,
} from "lucide-react";
import type { Visit, Order, Client } from "../../types";
import VisitCard from "./VisitCard";
import OrderCard from "./OrderCard";

interface VisitColumnsProps {
    // Data
    myTodayVisits: Visit[];
    myOldVisits: Visit[];
    completedOrders: Order[];
    clients: Client[];
    // KPI counts
    pendingVisits: number;
    inProcessVisits: number;
    cancelledVisits: number;
    // Callbacks
    onWallet: (clientName: string, clientNit: string) => void;
    onViewSummary: (orderId: string) => void;
    onCancel: (nit: string) => void;
    onReset: (nit: string) => void;
    onBeginVisit: (nit: string) => void;
    onNavigateToCatalog: (nit: string) => void;
    onReactivate: (nit: string) => Promise<void>;
    onNewVisit: (client: Client) => void;
    // Helpers
    formatPastDate: (dateStr: string) => string;
}

type TabName = 'Por visitar' | 'Visitando' | 'Canceladas' | 'Finalizadas';

export default function VisitColumns(props: VisitColumnsProps) {
    const {
        myTodayVisits, myOldVisits, completedOrders, clients,
        pendingVisits, inProcessVisits, cancelledVisits,
        onWallet, onViewSummary, onCancel, onReset, onBeginVisit,
        onNavigateToCatalog, onReactivate, onNewVisit, formatPastDate,
    } = props;

    const [activeTab, setActiveTab] = useState<TabName>('Por visitar');

    const findClient = (nit: string) => clients.find(c => c.nit === nit);

    // Shared card props builder
    const visitCardProps = (visit: Visit, client: Client) => ({
        visit, client, onWallet, onCancel, onReset, onBeginVisit, onNavigateToCatalog, onReactivate,
    });

    const orderCardProps = (order: Order, client: Client) => ({
        order, client, onWallet, onViewSummary, onNewVisit,
    });

    // Render helpers for visit list sections (today + previous)
    const renderVisitSection = (statusFilter: 'PENDING' | 'IN_PROCESS') => {
        const todayFiltered = myTodayVisits.filter(v => v.status === statusFilter);
        const oldFiltered = myOldVisits.filter(v => v.status === statusFilter);

        if (todayFiltered.length === 0 && oldFiltered.length === 0) {
            const msg = statusFilter === 'PENDING' ? "No tienes clientes por visitar" : "Actualmente no estás visitando a nadie";
            return <p className="text-center py-8 text-sm text-slate-400 opacity-50">{msg}</p>;
        }

        return (
            <>
                {todayFiltered.map(visit => {
                    const client = findClient(visit.clientNit);
                    if (!client) return null;
                    return <VisitCard key={visit.clientNit} {...visitCardProps(visit, client)} />;
                })}
                {oldFiltered.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 py-2">
                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⏰ Anteriores ({oldFiltered.length})</span>
                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                        </div>
                        {oldFiltered.map(visit => {
                            const client = findClient(visit.clientNit);
                            if (!client) return null;
                            return (
                                <div key={`old-${visit.clientNit}`} className="relative">
                                    <span className="absolute top-3 right-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-full z-10">
                                        {formatPastDate(visit.date)}
                                    </span>
                                    <VisitCard {...visitCardProps(visit, client)} />
                                </div>
                            );
                        })}
                    </>
                )}
            </>
        );
    };

    const renderCancelledSection = () => {
        const todayCancelled = myTodayVisits.filter(v => v.status === 'CANCELLED');
        if (todayCancelled.length === 0) {
            return <p className="text-center py-8 text-sm text-slate-400 opacity-50">Actualmente no tienes visitas canceladas</p>;
        }
        return todayCancelled.map(visit => {
            const client = findClient(visit.clientNit);
            if (!client) return null;
            return <VisitCard key={visit.clientNit} {...visitCardProps(visit, client)} />;
        });
    };

    const renderCompletedSection = () => {
        if (completedOrders.length === 0) {
            return <p className="text-center py-8 text-sm text-slate-400 opacity-50">No tienes pedidos finalizados hoy</p>;
        }
        return completedOrders.map(order => {
            const client = findClient(order.clientNit);
            if (!client) return null;
            return <OrderCard key={order.id} {...orderCardProps(order, client)} />;
        });
    };

    // Mobile tab content
    const renderMobileTab = () => {
        switch (activeTab) {
            case 'Finalizadas': return renderCompletedSection();
            case 'Canceladas': return renderCancelledSection();
            case 'Por visitar': return renderVisitSection('PENDING');
            case 'Visitando': return renderVisitSection('IN_PROCESS');
        }
    };

    // Desktop column header
    const ColumnHeader = ({ icon: Icon, iconColor, borderColor, count, label }: {
        icon: typeof CalendarClock; iconColor: string; borderColor: string; count: number; label: string;
    }) => (
        <div className={`flex items-center gap-3 mb-5 pb-4 border-b-2 ${borderColor}`}>
            <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                <Icon size={18} className={iconColor.includes('amber') ? 'text-amber-500' : iconColor.includes('blue') ? 'text-blue-500' : iconColor.includes('red') ? 'text-red-500' : 'text-emerald-500'} />
            </div>
            <div>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{count}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );

    return (
        <div className="pt-2">
            {/* === MOBILE: Tab navigation (hidden on desktop) === */}
            <div className="lg:hidden">
                <div className="flex items-center justify-center gap-6 border-b border-slate-100 dark:border-dark-600 pb-0 mb-6">
                    {(['Por visitar', 'Visitando', 'Canceladas', 'Finalizadas'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm transition-all ${activeTab === tab
                                ? 'text-black dark:text-white font-bold border-b-2 border-black dark:border-white'
                                : 'text-slate-400 font-medium hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {renderMobileTab()}
            </div>

            {/* === DESKTOP: 4 simultaneous columns (hidden on mobile) === */}
            <div className="hidden lg:grid lg:grid-cols-4">
                {/* Column 1: Por visitar */}
                <div className="pr-5">
                    <ColumnHeader icon={CalendarClock} iconColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-200 dark:border-amber-500/30" count={pendingVisits} label="Por visitar" />
                    <div className="space-y-4">{renderVisitSection('PENDING')}</div>
                </div>

                {/* Column 2: Visitando */}
                <div className="px-5 border-l border-slate-200 dark:border-dark-600">
                    <ColumnHeader icon={Loader2} iconColor="bg-blue-50 dark:bg-blue-500/10" borderColor="border-blue-200 dark:border-blue-500/30" count={inProcessVisits} label="Visitando" />
                    <div className="space-y-4">{renderVisitSection('IN_PROCESS')}</div>
                </div>

                {/* Column 3: Canceladas */}
                <div className="px-5 border-l border-slate-200 dark:border-dark-600">
                    <ColumnHeader icon={Ban} iconColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-200 dark:border-red-500/30" count={cancelledVisits} label="Canceladas" />
                    <div className="space-y-4">{renderCancelledSection()}</div>
                </div>

                {/* Column 4: Finalizadas */}
                <div className="pl-5 border-l border-slate-200 dark:border-dark-600">
                    <ColumnHeader icon={CheckCircle2} iconColor="bg-emerald-50 dark:bg-emerald-500/10" borderColor="border-emerald-200 dark:border-emerald-500/30" count={completedOrders.length} label="Finalizadas" />
                    <div className="space-y-4">{renderCompletedSection()}</div>
                </div>
            </div>
        </div>
    );
}
