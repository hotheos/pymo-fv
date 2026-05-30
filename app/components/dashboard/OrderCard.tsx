"use client";

import { useState } from "react";
import { Wallet, Phone, Clock, DollarSign, Plus } from "lucide-react";

interface OrderCardProps {
    order: { id: string; clientNit: string; date: string; total: number };
    client: { nit: string; name: string; phone: string; address: string; email?: string };
    onWallet: (clientName: string, clientNit: string) => void;
    onViewSummary: (orderId: string) => void;
    onNewVisit: (client: { nit: string; name: string; phone: string; address: string; email?: string }) => void;
}

export default function OrderCard({ order, client, onWallet, onViewSummary, onNewVisit }: OrderCardProps) {
    const [showTime, setShowTime] = useState(false);
    
    const orderTime = new Date(order.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const formatTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(order.total);

    return (
        <div key={order.id} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
            <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight">{client.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{client.address}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-2 mb-5">
                {/* Wallet Button with Tooltip */}
                <div className="relative group">
                    <button 
                        onClick={() => onWallet(client.name, client.nit)} 
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                        type="button"
                    >
                        <Wallet size={18} className="lg:hidden" /><Wallet size={14} className="hidden lg:block" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                        Ver Cartera
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                    </div>
                </div>

                {/* Phone Button with Tooltip */}
                <div className="relative group">
                    <button 
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                        type="button"
                    >
                        <Phone size={18} className="lg:hidden" /><Phone size={14} className="hidden lg:block" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                        Llamar Cliente
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                    </div>
                </div>
                
                {/* Dynamic Toggle Button (Clock <-> DollarSign) with Tooltip */}
                <div className="relative group">
                    <button
                        onClick={() => setShowTime(!showTime)}
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all active:scale-95"
                        type="button"
                    >
                        {showTime ? (
                            <>
                                <DollarSign size={18} className="lg:hidden" />
                                <DollarSign size={14} className="hidden lg:block" />
                            </>
                        ) : (
                            <>
                                <Clock size={18} className="lg:hidden" />
                                <Clock size={14} className="hidden lg:block" />
                            </>
                        )}
                    </button>
                    {/* Dynamic Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                        {showTime ? "Ver Precio Total" : "Ver Hora"}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                    </div>
                </div>

                <div className="flex-1 text-right relative h-10 lg:h-8 flex items-center justify-end">
                    <div className="relative w-full h-full flex items-center justify-end">
                        {/* Total Price display - Stacked vertically for large values */}
                        <div className={`absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end transition-all duration-300 transform ${
                            showTime ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"
                        }`}>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total</span>
                            <span className="font-black text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-none whitespace-nowrap">{formatTotal}</span>
                        </div>

                        {/* Completed Hour display - Stacked vertically with a descriptive "Finalizado" label */}
                        <div className={`absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end transition-all duration-300 transform ${
                            showTime ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
                        }`}>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Finalizado</span>
                            <span className="font-black text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-none whitespace-nowrap">{orderTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 items-center">
                {/* Main Expanded Button */}
                <button
                    onClick={() => onViewSummary(order.id)}
                    className="flex-1 py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all text-center"
                    type="button"
                >
                    VER RESUMEN
                </button>
                
                {/* Secondary Compact Plus Button wrapped in a relative group for custom premium tooltip */}
                <div className="relative group flex-shrink-0">
                    <button
                        onClick={() => onNewVisit(client)}
                        className="w-[44px] h-[44px] lg:w-[36px] lg:h-[36px] flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all"
                        type="button"
                    >
                        <Plus size={20} className="lg:hidden" />
                        <Plus size={16} className="hidden lg:block" />
                    </button>

                    {/* Custom Animated Premium Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                        Nueva Visita
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                    </div>
                </div>
            </div>
        </div>
    );
}
