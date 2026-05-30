"use client";

import { useEffect, useState, useRef } from "react";
import { useMock } from "./context/MockContext";
import { useTheme } from "./context/ThemeContext";
import { useRouter } from "next/navigation";
import PullToRefresh from 'react-simple-pull-to-refresh';
import {
    RotateCw,
    Wallet,
    Fingerprint,
    Sun,
    Moon,
    Palette,
    TrendingUp
} from "lucide-react";
import Image from "next/image";
import NewClientSheet from "./components/NewClientSheet";
import WalletModal from "./components/WalletModal";
import VisitSummarySheet from "./components/VisitSummarySheet";
import ColorPickerSheet from "./components/ColorPickerSheet";
import TodaySalesSheet from "./components/TodaySalesSheet";
import KpiGrid from "./components/dashboard/KpiGrid";
import VisitColumns from "./components/dashboard/VisitColumns";
import { formatCurrency } from "./context/business-logic";

export default function Home() {
    const { seller, visits, clients, orders, isLoading, cancelVisit, beginVisit, reactivateVisit, resetVisit, getTodaySales, addClient, getTodayOrders } = useMock();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isNewClientOpen, setIsNewClientOpen] = useState(false);
    const [walletModal, setWalletModal] = useState<{ isOpen: boolean; clientName: string; clientNit: string }>({ isOpen: false, clientName: "", clientNit: "" });
    const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean; orderId: string }>({ isOpen: false, orderId: "" });
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isTodaySalesOpen, setIsTodaySalesOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Aggressive auto-focus: ensure scroll container is always the active element
    const forceFocus = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.focus({ preventScroll: true });
        }
    };

    // Focus on mount
    useEffect(() => {
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
    const today = new Date().toLocaleDateString('en-CA');
    const isToday = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-CA') === today;

    // Split visits: today vs previous days
    const myTodayVisits = myVisits.filter(v => isToday(v.date));
    const myOldVisits = myVisits.filter(v => !isToday(v.date) && (v.status === 'PENDING' || v.status === 'IN_PROCESS'));

    // KPIs (today only)
    const pendingVisits = myTodayVisits.filter(v => v.status === "PENDING").length;
    const inProcessVisits = myTodayVisits.filter(v => v.status === "IN_PROCESS").length;
    const cancelledVisits = myTodayVisits.filter(v => v.status === "CANCELLED").length;
    const completedOrders = getTodayOrders();
    const { salesTotal: todaySales } = getTodaySales();

    const formatPastDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    };

    const handleNavigateToCatalog = (nit: string) => {
        router.push(`/catalog?newVisit=true&nit=${nit}`);
    };

    const handleNewVisit = (client: { nit: string; name: string; phone: string; address: string; email?: string }) => {
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
    };

    return (
        <main className="h-screen flex flex-col overflow-hidden bg-white dark:bg-dark-900 transition-colors">
            {/* Header */}
            <header className="flex-none bg-white dark:bg-dark-900 sticky top-0 z-50 px-[15px] lg:px-8 pt-[20px] lg:pt-4 pb-[10px] lg:pb-4 flex items-center justify-between shadow-sm border-b border-slate-200 dark:border-transparent transition-colors">
                <div className="flex items-center gap-3 lg:gap-4">
                    <Image
                        src={theme === 'dark' ? "/logo-white.png" : "/logo.png"}
                        alt="Pymo"
                        width={120}
                        height={32}
                        className="h-[32px] w-auto object-contain"
                        priority
                    />
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
                    <button
                        onClick={() => setIsColorPickerOpen(true)}
                        className="text-slate-400 hover:text-primary transition-colors"
                        title="Personalizar Tema"
                    >
                        <Palette size={18} />
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
                    {/* Desktop: Ventas de Hoy inline button */}
                    <button
                        onClick={() => setIsTodaySalesOpen(true)}
                        className="hidden lg:flex items-center gap-3 text-left focus:outline-none group hover:scale-[1.02] active:scale-95 transition-all p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-800"
                        title="Ver desglose de ventas de hoy"
                        type="button"
                    >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:shadow-sm transition-all flex-shrink-0">
                            <TrendingUp size={16} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-primary transition-colors">Ventas de Hoy</span>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{formatCurrency(todaySales)}</p>
                        </div>
                    </button>
                    <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-dark-600"></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-none">{seller.name}</span>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative" id="scrollable-container" ref={scrollContainerRef} tabIndex={-1}>
                <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-y-auto pb-20">
                    <div className="space-y-6 min-h-full px-5 lg:px-8">
                        {/* KPIs */}
                        <KpiGrid
                            pendingVisits={pendingVisits}
                            inProcessVisits={inProcessVisits}
                            cancelledVisits={cancelledVisits}
                            completedOrdersCount={completedOrders.length}
                        />

                        {/* Ventas + Identificar: visible only on mobile */}
                        <div className="space-y-4 lg:hidden">
                            <button
                                onClick={() => setIsTodaySalesOpen(true)}
                                className="w-full bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-high flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                                type="button"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                    <TrendingUp size={22} className="stroke-[2.5]" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">{formatCurrency(todaySales)}</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setIsNewClientOpen(true)}
                                className="w-full bg-tenant-gradient text-white p-5 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <Fingerprint size={20} className="text-white" />
                                <span className="font-bold text-lg">Identificar Cliente</span>
                            </button>
                        </div>

                        {/* Visit Columns (mobile tabs + desktop 4-col grid) */}
                        <VisitColumns
                            myTodayVisits={myTodayVisits}
                            myOldVisits={myOldVisits}
                            completedOrders={completedOrders}
                            clients={clients}
                            pendingVisits={pendingVisits}
                            inProcessVisits={inProcessVisits}
                            cancelledVisits={cancelledVisits}
                            onWallet={(name, nit) => setWalletModal({ isOpen: true, clientName: name, clientNit: nit })}
                            onViewSummary={(orderId) => setSummaryModal({ isOpen: true, orderId })}
                            onCancel={cancelVisit}
                            onReset={resetVisit}
                            onBeginVisit={beginVisit}
                            onNavigateToCatalog={handleNavigateToCatalog}
                            onReactivate={reactivateVisit}
                            onNewVisit={handleNewVisit}
                            formatPastDate={formatPastDate}
                        />

                        <div className="mt-6 pb-10 text-center">
                            <Image
                                src={theme === 'dark' ? "/apolosoft-white.png" : "/apolosoft.png"}
                                alt="Apolosoft"
                                width={140}
                                height={40}
                                className="mx-auto opacity-50 block"
                            />
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
            <ColorPickerSheet
                isOpen={isColorPickerOpen}
                onClose={() => setIsColorPickerOpen(false)}
            />
            <TodaySalesSheet
                isOpen={isTodaySalesOpen}
                onClose={() => setIsTodaySalesOpen(false)}
                onViewSummary={(orderId) => setSummaryModal({ isOpen: true, orderId })}
            />
        </main >
    );
}
