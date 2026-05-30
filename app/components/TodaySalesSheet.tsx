"use client";

import { Clock, TrendingUp, ShoppingBag, ArrowRight } from "lucide-react";
import { useMock } from "@/context/MockContext";
import { formatCurrency } from "@/context/business-logic";
import BottomSheet from "./ui/BottomSheet";

interface TodaySalesSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onViewSummary: (orderId: string) => void;
}

export default function TodaySalesSheet({ isOpen, onClose, onViewSummary }: TodaySalesSheetProps) {
    const { clients, getTodayOrders, getTodaySales } = useMock();
    
    const completedOrders = getTodayOrders().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const { salesTotal: todaySales, ordersCount } = getTodaySales();

    const findClientName = (nit: string) => {
        return clients.find((c) => c.nit === nit)?.name || "Cliente Desconocido";
    };

    const formatOrderTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Rendimiento del Día">
            <div className="space-y-6">
                {/* Dashboard Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-800 dark:to-dark-700/50 border border-slate-150 dark:border-dark-600 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                    {/* Glowing Accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Total Facturado Hoy
                        </span>
                        <h3 className="text-3xl font-black text-primary leading-tight">
                            {formatCurrency(todaySales)}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {ordersCount === 1 
                                ? "1 pedido completado con éxito" 
                                : `${ordersCount} pedidos completados con éxito`}
                        </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 z-10">
                        <TrendingUp size={24} className="stroke-[2.5]" />
                    </div>
                </div>

                {/* List Header */}
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Desglose de Pedidos ({ordersCount})
                    </h4>
                </div>

                {/* Orders List */}
                <div className="space-y-3.5 max-h-[45vh] overflow-y-auto pr-1">
                    {completedOrders.length > 0 ? (
                        completedOrders.map((order) => {
                            const clientName = findClientName(order.clientNit);
                            const orderTime = formatOrderTime(order.date);
                            const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

                            return (
                                <div 
                                    key={order.id}
                                    className="bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5 min-w-0">
                                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                                            {clientName}
                                        </h5>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} /> {orderTime}
                                            </span>
                                            <span>·</span>
                                            <span>
                                                {itemsCount === 1 ? "1 producto" : `${itemsCount} productos`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Monto
                                            </span>
                                            <span className="font-black text-slate-850 dark:text-slate-100 text-base leading-none">
                                                {formatCurrency(order.total)}
                                            </span>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                onViewSummary(order.id);
                                                onClose();
                                            }}
                                            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                                            title="Ver resumen"
                                            type="button"
                                        >
                                            <ArrowRight size={16} className="stroke-[2.5]" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border-2 border-dashed border-slate-100 dark:border-dark-700 rounded-2xl">
                            <ShoppingBag className="text-slate-300 dark:text-dark-600" size={36} />
                            <div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-350">
                                    No hay ventas facturadas hoy
                                </p>
                                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-[200px]">
                                    Comienza tu ruta diaria y realiza pedidos para ver tu rendimiento aquí.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
}
