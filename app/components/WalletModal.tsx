"use client";

import { useMock } from "@/context/MockContext";
import BottomSheet from "./ui/BottomSheet";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    clientNit: string;
}

export default function WalletModal({ isOpen, onClose, clientName, clientNit }: WalletModalProps) {
    const { getInvoices } = useMock();

    const { invoices, walletTotal } = getInvoices(clientNit);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={`Cartera — ${clientName}`}>
            <div className="space-y-3">
                {invoices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="font-medium">Sin facturas pendientes</p>
                        <p className="text-sm mt-1">Este cliente no tiene cartera registrada.</p>
                    </div>
                ) : (
                    <>
                        {invoices.map(inv => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-700 rounded-xl"
                            >
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{inv.number}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(inv.date).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total: {formatCurrency(inv.total)} · Abonado: {formatCurrency(inv.totalPaid)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-lg font-black ${inv.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {formatCurrency(inv.balance)}
                                    </span>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                                        {inv.balance > 0 ? 'PENDIENTE' : 'PAGADA'}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Wallet Total */}
                        <div className="mt-4 p-4 bg-tenant-gradient rounded-xl text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Cartera Total</p>
                            <p className="text-2xl font-black">{formatCurrency(walletTotal)}</p>
                        </div>
                    </>
                )}
            </div>
        </BottomSheet>
    );
}
