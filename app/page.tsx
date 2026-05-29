"use client";

import { useEffect, useState, useRef } from "react";
import { useMock } from "./context/MockContext";
import { useTheme } from "./context/ThemeContext";
import { useRouter } from "next/navigation";
import PullToRefresh from 'react-simple-pull-to-refresh';
import {
    CalendarClock,
    CheckCircle2,
    Ban,
    RotateCw,
    Wallet,
    Phone,
    FileText,
    Trash2,
    Fingerprint,
    Loader2,
    Eraser,
    Sun,
    Moon
} from "lucide-react";
import NewClientSheet from "./components/NewClientSheet";
import WalletModal from "./components/WalletModal";
import VisitSummarySheet from "./components/VisitSummarySheet";

export default function Home() {
    const { seller, visits, clients, orders, isLoading, cancelVisit, beginVisit, reactivateVisit, resetVisit, getTodaySales, addClient, getTodayOrders } = useMock();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isNewClientOpen, setIsNewClientOpen] = useState(false);
    const [walletModal, setWalletModal] = useState<{ isOpen: boolean; clientName: string; clientNit: string }>({ isOpen: false, clientName: "", clientNit: "" });
    const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean; orderId: string }>({ isOpen: false, orderId: "" });
    const [activeTab, setActiveTab] = useState<'Por visitar' | 'Visitando' | 'Canceladas' | 'Finalizadas'>('Por visitar');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Aggressive auto-focus: ensure scroll container is always the active element
    const forceFocus = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.focus({ preventScroll: true });
        }
    };

    // Focus on mount
    useEffect(() => {
        // Small delay to ensure DOM is fully ready
        const timer = setTimeout(forceFocus, 100);
        return () => clearTimeout(timer);
    }, []);

    // Re-focus when window regains focus (returning from another app/tab)
    useEffect(() => {
        window.addEventListener('focus', forceFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') forceFocus();
        });
        return () => {
            window.removeEventListener('focus', forceFocus);
            document.removeEventListener('visibilitychange', forceFocus);
        };
    }, []);

    // Re-focus whenever visits change (returning from catalog triggers state update)
    useEffect(() => {
        forceFocus();
    }, [visits]);

    useEffect(() => {
        if (!isLoading && !seller) {
            router.push("/login");
        }
    }, [seller, router, isLoading]);

    if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span></div>;

    if (!seller) return null;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate network request
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setIsRefreshing(false);
                resolve();
            }, 1500);
        });
    };

    // Seller-scoped visits for tab filtering
    const myVisits = visits.filter(v => v.sellerId === seller?.id);

    // Date helper: determine if a visit is from today
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const isToday = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-CA') === today;

    // Split visits: today vs previous days (only PENDING and IN_PROCESS have "previous")
    const myTodayVisits = myVisits.filter(v => isToday(v.date));
    const myOldVisits = myVisits.filter(v => !isToday(v.date) && (v.status === 'PENDING' || v.status === 'IN_PROCESS'));

    // KPIs — only count TODAY's visits
    const pendingVisits = myTodayVisits.filter(v => v.status === "PENDING").length;
    const inProcessVisits = myTodayVisits.filter(v => v.status === "IN_PROCESS").length;
    const cancelledVisits = myTodayVisits.filter(v => v.status === "CANCELLED").length;
    const completedOrders = getTodayOrders();

    // Today's sales from context (simulates GET /finalizadas)
    const { salesTotal: todaySales } = getTodaySales();

    // Format past date for separator badges
    const formatPastDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    // === Reusable card renderers (used by both mobile tabs and desktop columns) ===

    const renderVisitCard = (visit: { clientNit: string; status: string }, client: { nit: string; name: string; phone: string; address: string; email?: string }) => {
        const isInProcess = visit.status === "IN_PROCESS";
        const isCancelled = visit.status === "CANCELLED";

        return (
            <div key={visit.clientNit} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
                <div className="flex justify-between items-start mb-4">
                    <div className="pr-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight">{client.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{client.address}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-2 mb-5">
                    <button
                        onClick={() => setWalletModal({ isOpen: true, clientName: client.name, clientNit: client.nit })}
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                    >
                        <Wallet size={18} className="lg:hidden" /><Wallet size={14} className="hidden lg:block" />
                    </button>
                    <button className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Phone size={18} className="lg:hidden" /><Phone size={14} className="hidden lg:block" />
                    </button>

                    {isInProcess && (
                        <button
                            onClick={() => resetVisit(visit.clientNit)}
                            className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 transition-colors"
                            title="Vaciar carrito"
                        >
                            <Eraser size={18} className="lg:hidden" /><Eraser size={14} className="hidden lg:block" />
                        </button>
                    )}

                    {!isCancelled && (
                        <button
                            onClick={() => cancelVisit(visit.clientNit)}
                            className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 transition-colors">
                            <Trash2 size={18} className="lg:hidden" /><Trash2 size={14} className="hidden lg:block" />
                        </button>
                    )}
                    <div className="h-px bg-slate-100 dark:bg-dark-700 flex-1"></div>
                </div>

                {visit.status === 'IN_PROCESS' ? (
                    <button
                        onClick={() => {
                            beginVisit(visit.clientNit);
                            router.push(`/catalog?newVisit=true&nit=${client.nit}`);
                        }}
                        className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                        CONTINUAR VISITA
                    </button>
                ) : (
                    <button
                        onClick={async () => {
                            if (visit.status === 'PENDING') {
                                beginVisit(visit.clientNit);
                                router.push(`/catalog?newVisit=true&nit=${client.nit}`);
                            } else if (visit.status === 'CANCELLED') {
                                await reactivateVisit(visit.clientNit);
                                router.push(`/catalog?newVisit=true&nit=${client.nit}`);
                            }
                        }}
                        className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
                        {visit.status === 'PENDING' ? 'COMENZAR VISITA' : 'REACTIVAR VISITA'}
                    </button>
                )}
            </div>
        );
    };

    const renderOrderCard = (order: { id: string; clientNit: string; date: string; total: number }, client: { nit: string; name: string; phone: string; address: string; email?: string }) => {
        const orderTime = new Date(order.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const formatTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(order.total);

        return (
            <div key={order.id} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
                <div className="flex justify-between items-start mb-4">
                    <div className="pr-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight">{client.name}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{client.address}</p>
                    </div>
                    <span className="text-xs text-slate-400">{orderTime}</span>
                </div>

                <div className="flex items-center gap-3 lg:gap-2 mb-5">
                    <button onClick={() => setWalletModal({ isOpen: true, clientName: client.name, clientNit: client.nit })} className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                        <Wallet size={18} className="lg:hidden" /><Wallet size={14} className="hidden lg:block" />
                    </button>
                    <button className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Phone size={18} className="lg:hidden" /><Phone size={14} className="hidden lg:block" />
                    </button>
                    <div className="flex-1 text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Total</span>
                        <span className="font-black text-slate-800 dark:text-slate-100">{formatTotal}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setSummaryModal({ isOpen: true, orderId: order.id })}
                        className="flex-1 py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                        VER RESUMEN
                    </button>
                    <button
                        onClick={() => {
                            const result = addClient({
                                nit: client.nit,
                                name: client.name,
                                phone: client.phone,
                                address: client.address,
                                email: client.email || ""
                            });
                            if (!result.error) {
                                beginVisit(client.nit);
                                router.push(`/catalog?newVisit=true&nit=${client.nit}`);
                            }
                        }}
                        className="flex-1 py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                        NUEVA VISITA
                    </button>
                </div>
            </div>
        );
    };

    return (
        <main className="h-screen flex flex-col overflow-hidden bg-white dark:bg-dark-900 transition-colors">
            {/* Header */}
            <header className="flex-none bg-white dark:bg-dark-900 sticky top-0 z-50 px-[15px] lg:px-8 pt-[20px] lg:pt-4 pb-[10px] lg:pb-4 flex items-center justify-between shadow-sm border-b border-slate-200 dark:border-transparent transition-colors">
                <div className="flex items-center gap-3 lg:gap-4">
                    <img src={theme === 'dark' ? "/logo-white.png" : "/logo.png"} alt="Pymo" className="h-[32px] w-auto object-contain" />
                    <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-dark-600"></div>
                    <button
                        onClick={handleRefresh}
                        className={`text-slate-400 hover:text-primary transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="text-slate-400 hover:text-primary transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    {/* Desktop: Identificar Cliente button after icons */}
                    <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-dark-600"></div>
                    <button
                        onClick={() => setIsNewClientOpen(true)}
                        className="hidden lg:flex items-center gap-2 bg-tenant-gradient text-white px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all font-bold text-sm"
                    >
                        <Fingerprint size={16} />
                        <span>Identificar Cliente</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Desktop: Ventas de Hoy inline, left of seller name */}
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet size={16} className="text-primary" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{formatCurrency(todaySales)}</p>
                        </div>
                    </div>
                    <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-dark-600"></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-none">{seller.name}</span>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative" id="scrollable-container" ref={scrollContainerRef} tabIndex={-1}>
                <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-y-auto pb-20">
                    <div className="space-y-6 min-h-full px-5 lg:px-8">
                        {/* KPIs */}
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
                                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{completedOrders.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Finalizadas</span>
                            </div>
                        </div>

                        {/* Ventas + Identificar: visible only on mobile */}
                        <div className="space-y-4 lg:hidden">
                            {/* Ventas de Hoy - compact card */}
                            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-high flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Wallet size={22} className="text-primary" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">{formatCurrency(todaySales)}</p>
                                </div>
                            </div>

                            {/* Acción Prioritaria */}
                            <button
                                onClick={() => setIsNewClientOpen(true)}
                                className="w-full bg-tenant-gradient text-white p-5 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <Fingerprint size={20} className="text-white" />
                                <span className="font-bold text-lg">Identificar Cliente</span>
                            </button>
                        </div>


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

                                {/* Mobile: Single tab content */}
                                {(() => {
                                    // Finalizadas tab — special handling
                                    if (activeTab === 'Finalizadas') {
                                        if (completedOrders.length === 0) {
                                            return <div className="text-center py-10 opacity-50"><p className="text-sm font-medium text-slate-400">No tienes pedidos finalizados hoy</p></div>;
                                        }
                                        return completedOrders.map(order => {
                                            const client = clients.find(c => c.nit === order.clientNit);
                                            if (!client) return null;
                                            return renderOrderCard(order, client);
                                        });
                                    }

                                    // Canceladas — only today, no previous
                                    if (activeTab === 'Canceladas') {
                                        const todayCancelled = myTodayVisits.filter(v => v.status === 'CANCELLED');
                                        if (todayCancelled.length === 0) {
                                            return <div className="text-center py-10 opacity-50"><p className="text-sm font-medium text-slate-400">Actualmente no tienes visitas canceladas</p></div>;
                                        }
                                        return todayCancelled.map(visit => {
                                            const client = clients.find(c => c.nit === visit.clientNit);
                                            if (!client) return null;
                                            return renderVisitCard(visit, client);
                                        });
                                    }

                                    // Por visitar / Visitando — today + previous days
                                    const statusFilter = activeTab === 'Por visitar' ? 'PENDING' : 'IN_PROCESS';
                                    const todayFiltered = myTodayVisits.filter(v => v.status === statusFilter);
                                    const oldFiltered = myOldVisits.filter(v => v.status === statusFilter);

                                    if (todayFiltered.length === 0 && oldFiltered.length === 0) {
                                        const emptyMessage = activeTab === 'Por visitar' ? "No tienes clientes por visitar" : "Actualmente no estás visitando a nadie";
                                        return <div className="text-center py-10 opacity-50"><p className="text-sm font-medium text-slate-400">{emptyMessage}</p></div>;
                                    }

                                    return (
                                        <>
                                            {todayFiltered.map(visit => {
                                                const client = clients.find(c => c.nit === visit.clientNit);
                                                if (!client) return null;
                                                return renderVisitCard(visit, client);
                                            })}
                                            {oldFiltered.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-3 py-3 mt-2">
                                                        <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                            ⏰ Anteriores ({oldFiltered.length})
                                                        </span>
                                                        <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                    </div>
                                                    {oldFiltered.map(visit => {
                                                        const client = clients.find(c => c.nit === visit.clientNit);
                                                        if (!client) return null;
                                                        return (
                                                            <div key={`old-${visit.clientNit}`} className="relative">
                                                                <span className="absolute top-3 right-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-full z-10">
                                                                    {formatPastDate(visit.date)}
                                                                </span>
                                                                {renderVisitCard(visit, client)}
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* === DESKTOP: 4 simultaneous columns (hidden on mobile) === */}
                            <div className="hidden lg:grid lg:grid-cols-4">
                                {/* Column 1: Por visitar */}
                                <div className="pr-5">
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-amber-200 dark:border-amber-500/30">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                            <CalendarClock size={18} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{pendingVisits}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por visitar</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {myTodayVisits.filter(v => v.status === 'PENDING').length === 0 && myOldVisits.filter(v => v.status === 'PENDING').length === 0 ? (
                                            <p className="text-center py-8 text-sm text-slate-400 opacity-50">Sin visitas pendientes</p>
                                        ) : (
                                            <>
                                                {myTodayVisits.filter(v => v.status === 'PENDING').map(visit => {
                                                    const client = clients.find(c => c.nit === visit.clientNit);
                                                    if (!client) return null;
                                                    return renderVisitCard(visit, client);
                                                })}
                                                {myOldVisits.filter(v => v.status === 'PENDING').length > 0 && (
                                                    <>
                                                        <div className="flex items-center gap-2 py-2">
                                                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⏰ Anteriores ({myOldVisits.filter(v => v.status === 'PENDING').length})</span>
                                                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                        </div>
                                                        {myOldVisits.filter(v => v.status === 'PENDING').map(visit => {
                                                            const client = clients.find(c => c.nit === visit.clientNit);
                                                            if (!client) return null;
                                                            return (
                                                                <div key={`old-${visit.clientNit}`} className="relative">
                                                                    <span className="absolute top-3 right-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-full z-10">{formatPastDate(visit.date)}</span>
                                                                    {renderVisitCard(visit, client)}
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Visitando */}
                                <div className="px-5 border-l border-slate-200 dark:border-dark-600">
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-500/30">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                            <Loader2 size={18} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{inProcessVisits}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visitando</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {myTodayVisits.filter(v => v.status === 'IN_PROCESS').length === 0 && myOldVisits.filter(v => v.status === 'IN_PROCESS').length === 0 ? (
                                            <p className="text-center py-8 text-sm text-slate-400 opacity-50">No hay visitas activas</p>
                                        ) : (
                                            <>
                                                {myTodayVisits.filter(v => v.status === 'IN_PROCESS').map(visit => {
                                                    const client = clients.find(c => c.nit === visit.clientNit);
                                                    if (!client) return null;
                                                    return renderVisitCard(visit, client);
                                                })}
                                                {myOldVisits.filter(v => v.status === 'IN_PROCESS').length > 0 && (
                                                    <>
                                                        <div className="flex items-center gap-2 py-2">
                                                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⏰ Anteriores ({myOldVisits.filter(v => v.status === 'IN_PROCESS').length})</span>
                                                            <div className="h-px bg-slate-200 dark:bg-dark-600 flex-1" />
                                                        </div>
                                                        {myOldVisits.filter(v => v.status === 'IN_PROCESS').map(visit => {
                                                            const client = clients.find(c => c.nit === visit.clientNit);
                                                            if (!client) return null;
                                                            return (
                                                                <div key={`old-${visit.clientNit}`} className="relative">
                                                                    <span className="absolute top-3 right-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-full z-10">{formatPastDate(visit.date)}</span>
                                                                    {renderVisitCard(visit, client)}
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Column 3: Canceladas */}
                                <div className="px-5 border-l border-slate-200 dark:border-dark-600">
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-red-200 dark:border-red-500/30">
                                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                            <Ban size={18} className="text-red-500" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{cancelledVisits}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canceladas</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {myTodayVisits.filter(v => v.status === 'CANCELLED').length === 0 ? (
                                            <p className="text-center py-8 text-sm text-slate-400 opacity-50">Sin cancelaciones</p>
                                        ) : myTodayVisits.filter(v => v.status === 'CANCELLED').map(visit => {
                                            const client = clients.find(c => c.nit === visit.clientNit);
                                            if (!client) return null;
                                            return renderVisitCard(visit, client);
                                        })}
                                    </div>
                                </div>

                                {/* Column 4: Finalizadas */}
                                <div className="pl-5 border-l border-slate-200 dark:border-dark-600">
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-emerald-200 dark:border-emerald-500/30">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{completedOrders.length}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finalizadas</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {completedOrders.length === 0 ? (
                                            <p className="text-center py-8 text-sm text-slate-400 opacity-50">Sin pedidos finalizados</p>
                                        ) : completedOrders.map(order => {
                                            const client = clients.find(c => c.nit === order.clientNit);
                                            if (!client) return null;
                                            return renderOrderCard(order, client);
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pb-10 text-center">
                            <img src={theme === 'dark' ? "/apolosoft-white.png" : "/apolosoft.png"} alt="Apolosoft" className="w-[140px] mx-auto opacity-50 block" />
                        </div>
                    </div>
                </PullToRefresh>
            </div>

            <NewClientSheet isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />
            <WalletModal
                isOpen={walletModal.isOpen}
                onClose={() => setWalletModal({ isOpen: false, clientName: "", clientNit: "" })}
                clientName={walletModal.clientName}
                clientNit={walletModal.clientNit}
            />
            <VisitSummarySheet
                isOpen={summaryModal.isOpen}
                onClose={() => setSummaryModal({ isOpen: false, orderId: "" })}
                orderId={summaryModal.orderId}
            />
        </main >
    );
}
