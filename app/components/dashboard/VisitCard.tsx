"use client";

import { useState } from "react";
import {
    Wallet,
    Phone,
    Trash2,
    Eraser,
} from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";

// Custom highly detailed premium SVG icon showing an upside-down shopping cart dropping its contents (falling products with motion trails)
const CartUpsideDownIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-8.5 h-8.5"
    >
        {/* Shopping Cart rotated 140 degrees (upside down, dumping) */}
        <g transform="translate(12, 9.5) rotate(140) translate(-12, -9.5)">
            {/* Basket Handle */}
            <path d="M17 5H20" strokeWidth="1.5" />
            {/* Basket Wheels */}
            <circle cx="6" cy="19" r="1.2" fill="none" strokeWidth="2" />
            <circle cx="17" cy="19" r="1.2" fill="none" strokeWidth="2" />
            {/* Basket Frame Wire */}
            <path d="M2 3h3l2.5 11h9.5" />
            {/* Semi-transparent Basket fill */}
            <path d="M5.5 6h12.5l-1.5 6.5h-9.5z" fill="currentColor" fillOpacity="0.12" />
        </g>

        {/* Falling Products with motion paths */}
        
        {/* Product 1: A little apple/fruit falling on the left */}
        <g transform="translate(5, 14.5) scale(0.65)">
            {/* Motion line */}
            <path d="M2 -3 L2 5" stroke="currentColor" strokeWidth="1" strokeDasharray="1,2" opacity="0.4" />
            {/* Stem/Leaf */}
            <path d="M2 -0.8 C2.5 -2, 3.8 -2, 3.8 -2" stroke="currentColor" strokeWidth="1.2" />
            {/* Fruit body */}
            <circle cx="2" cy="2.5" r="3.2" fill="currentColor" />
        </g>

        {/* Product 2: A small milk carton/box falling in the center */}
        <g transform="translate(11, 15) rotate(-12) scale(0.6)">
            {/* Motion line */}
            <path d="M2 -5 L2 5" stroke="currentColor" strokeWidth="1" strokeDasharray="1,2" opacity="0.4" />
            {/* Box Body */}
            <rect x="0" y="0" width="5.2" height="6.8" rx="0.5" fill="currentColor" />
            {/* Gable top of carton */}
            <path d="M0 0 L2.6 -2 L5.2 0" fill="currentColor" />
        </g>

        {/* Product 3: A tiny bottle/soda falling on the right */}
        <g transform="translate(16.5, 13.5) rotate(40) scale(0.65)">
            {/* Motion line */}
            <path d="M2 -4 L2 4" stroke="currentColor" strokeWidth="1" strokeDasharray="1,2" opacity="0.4" />
            {/* Bottle body */}
            <rect x="0.5" y="1" width="3" height="5" rx="0.8" fill="currentColor" />
            {/* Bottle neck */}
            <rect x="1.2" y="-1" width="1.6" height="2" fill="currentColor" />
            {/* Bottle Cap */}
            <line x1="1" y1="-1" x2="3" y2="-1" stroke="currentColor" strokeWidth="1.2" />
        </g>
    </svg>
);


interface VisitCardProps {
    visit: { clientNit: string; status: string };
    client: { nit: string; name: string; phone: string; address: string; email?: string };
    onWallet: (clientName: string, clientNit: string) => void;
    onCancel: (nit: string) => void;
    onReset: (nit: string) => void;
    onBeginVisit: (nit: string) => void;
    onNavigateToCatalog: (nit: string) => void;
    onReactivate: (nit: string) => Promise<void>;
}

export default function VisitCard({
    visit, client, onWallet, onCancel, onReset, onBeginVisit, onNavigateToCatalog, onReactivate
}: VisitCardProps) {
    const isInProcess = visit.status === "IN_PROCESS";
    const isCancelled = visit.status === "CANCELLED";

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    return (
        <div key={visit.clientNit} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
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

                {/* Clear Cart (Eraser) Button with Tooltip */}
                {isInProcess && (
                    <div className="relative group">
                        <button
                            onClick={() => setIsResetConfirmOpen(true)}
                            className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                            type="button"
                        >
                            <Eraser size={18} className="lg:hidden" /><Eraser size={14} className="hidden lg:block" />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                            Vaciar Carrito
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                        </div>
                    </div>
                )}

                {/* Cancel Visit (Trash2) Button with Tooltip */}
                {!isCancelled && (
                    <div className="relative group">
                        <button
                            onClick={() => setIsCancelConfirmOpen(true)}
                            className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                            type="button"
                        >
                            <Trash2 size={18} className="lg:hidden" /><Trash2 size={14} className="hidden lg:block" />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30">
                            Cancelar Visita
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                        </div>
                    </div>
                )}
                <div className="h-px bg-slate-100 dark:bg-dark-700 flex-1"></div>
            </div>

            {visit.status === 'IN_PROCESS' ? (
                <button
                    onClick={() => {
                        onBeginVisit(visit.clientNit);
                        onNavigateToCatalog(client.nit);
                    }}
                    className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    CONTINUAR VISITA
                </button>
            ) : (
                <button
                    onClick={async () => {
                        if (visit.status === 'PENDING') {
                            onBeginVisit(visit.clientNit);
                            onNavigateToCatalog(client.nit);
                        } else if (visit.status === 'CANCELLED') {
                            await onReactivate(visit.clientNit);
                            onNavigateToCatalog(client.nit);
                        }
                    }}
                    className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
                    {visit.status === 'PENDING' ? 'COMENZAR VISITA' : 'REACTIVAR VISITA'}
                </button>
            )}

            {/* Custom ConfirmModal for Clear Cart (Warning Yellow theme + Upside-down Shopping Cart Icon) */}
            {/* Custom ConfirmModal for Clear Cart (Warning Yellow theme + Spilling Cart Premium Illustration) */}
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={() => onReset(visit.clientNit)}
                title="¿Vaciar Carrito?"
                message={`¿Estás seguro de que deseas vaciar el carrito de "${client.name}"? Esta acción eliminará de forma permanente todos los productos agregados.`}
                confirmText="Sí, vaciar"
                cancelText="No"
                theme="warning"
                imageSrc="/cart_spilling_light.png"
                imageSrcDark="/cart_spilling_dark.png"
            />

            {/* Standard ConfirmModal for Cancel Visit (Danger Red theme + Warning Icon) */}
            <ConfirmModal
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                onConfirm={() => onCancel(visit.clientNit)}
                title="¿Cancelar Visita?"
                message={`¿Estás seguro de que deseas cancelar la visita programada para "${client.name}"?`}
                confirmText="Sí, cancelar"
                cancelText="No"
                theme="danger"
            />
        </div>
    );
}
