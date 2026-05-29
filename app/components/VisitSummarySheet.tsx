"use client";

import { useState } from "react";
import { useMock } from "@/context/MockContext";
import BottomSheet from "./ui/BottomSheet";
import ProductImage from "./ui/ProductImage";
import { CheckCircle2, FileDown, MessageCircle, Loader2 } from "lucide-react";
import { generateOrderPDF, shareOrderWhatsApp } from "@/utils/orderSharing";

interface VisitSummarySheetProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export default function VisitSummarySheet({ isOpen, onClose, orderId }: VisitSummarySheetProps) {
    const { getOrderById, clients, products, seller } = useMock();
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const order = orderId ? getOrderById(orderId) : null;
    const client = order ? clients.find(c => c.nit === order.clientNit) : null;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    if (!order || !client) {
        return (
            <BottomSheet isOpen={isOpen} onClose={onClose} title="Resumen de Visita">
                <div className="text-center py-10 text-slate-400">
                    <p className="font-medium">No se encontró el pedido para esta visita.</p>
                </div>
            </BottomSheet>
        );
    }

    const orderItems = order.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
    });

    const sharingData = {
        order,
        client,
        sellerName: seller?.name || "Vendedor",
        items: orderItems,
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        // Small delay so the spinner renders before the synchronous PDF generation blocks the thread
        await new Promise(r => setTimeout(r, 50));
        try {
            generateOrderPDF(sharingData);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleWhatsApp = () => {
        shareOrderWhatsApp(sharingData);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Resumen de Visita">
            <div className="space-y-5 pb-4">
                {/* Client Info */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{client.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">NIT: {client.nit}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{client.address}</p>
                    </div>
                </div>

                {/* Date + Order ID */}
                <div className="bg-slate-50 dark:bg-dark-700 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fecha del Pedido</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(order.date)}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {order.id}</p>
                </div>

                {/* Items */}
                <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Productos</p>
                    {orderItems.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3 bg-white dark:bg-dark-700 rounded-xl border border-slate-100 dark:border-dark-600 p-3">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-dark-600 rounded-lg flex-shrink-0 overflow-hidden">
                                <ProductImage
                                    src={item.product?.image}
                                    alt={item.product?.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">{item.product?.name || "Producto"}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{item.product?.sku}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-500">x{item.quantity}</p>
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="p-4 bg-tenant-gradient rounded-xl text-white">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Total del Pedido</p>
                    <p className="text-2xl font-black">{formatCurrency(order.total)}</p>
                </div>

                {/* Action Buttons: PDF + WhatsApp */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="flex-1 py-3 rounded-xl bg-slate-800 dark:bg-dark-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isGeneratingPDF ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <FileDown size={18} />
                        )}
                        {isGeneratingPDF ? "Generando..." : "Descargar PDF"}
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20BD5A] active:scale-95 transition-all"
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}
