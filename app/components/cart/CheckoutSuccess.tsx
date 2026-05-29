"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Share2, Home as HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateOrderPdf } from "../../utils/pdfGenerator";
import type { Seller, Product } from "../../types";

interface CartItemWithProduct {
    productId: string;
    quantity: number;
    price: number;
    product?: Product;
}

interface FinalOrder {
    items: CartItemWithProduct[];
    total: number;
    clientName: string;
    clientNit: string;
    clientAddress: string;
    clientPhone: string;
}

interface CheckoutSuccessProps {
    finalOrder: FinalOrder;
    seller: Seller | null;
}

export default function CheckoutSuccess({ finalOrder, seller }: CheckoutSuccessProps) {
    const router = useRouter();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleGeneratePDF = async () => {
        setIsGeneratingPdf(true);
        await generateOrderPdf(finalOrder, seller);
        setIsGeneratingPdf(false);
    };

    const handleShareWhatsApp = () => {
        const itemLines = finalOrder.items.map(item =>
            `• ${item.product?.name || "Producto"} x${item.quantity} — $${(item.price * item.quantity).toLocaleString()}`
        ).join("\n");

        const message = [
            `📋 *PEDIDO DE VENTA — PYMO*`,
            ``,
            `👤 *Vendedor:* ${seller?.name || "N/A"}`,
            `🏪 *Cliente:* ${finalOrder.clientName}`,
            `🆔 *NIT:* ${finalOrder.clientNit}`,
            `📍 *Dirección:* ${finalOrder.clientAddress}`,
            ``,
            `📦 *Productos:*`,
            itemLines,
            ``,
            `💰 *TOTAL: $${finalOrder.total.toLocaleString()}*`,
            ``,
            `✅ _Generado por Pymo - Fuerza de Ventas_`
        ].join("\n");

        const encodedMessage = encodeURIComponent(message);
        const phone = finalOrder.clientPhone?.replace(/\D/g, "");
        const waUrl = phone && phone.length === 10
            ? `https://wa.me/57${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(waUrl, "_blank");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
            <div className="bg-emerald-100 p-6 rounded-full mb-6 animate-bounce">
                <CheckCircle2 size={64} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">¡Pedido Generado!</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">La transacción ha sido registrada y sincronizada correctamente.</p>

            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-card w-full mb-8">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Monto Total</p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">${finalOrder.total.toLocaleString()}</p>
            </div>

            <div className="w-full space-y-3">
                <button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPdf}
                    className="w-full py-4 bg-tenant-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-high disabled:opacity-70 disabled:cursor-wait">
                    {isGeneratingPdf ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                        <FileText size={20} />
                    )}
                    <span>{isGeneratingPdf ? "GENERANDO..." : "VER PDF"}</span>
                </button>
                <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-4 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <Share2 size={20} className="text-green-500" />
                    <span>WHATSAPP</span>
                </button>

                <div className="h-8"></div>

                <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 flex items-center justify-center gap-2"
                >
                    <HomeIcon size={18} />
                    <span>VOLVER AL DASHBOARD</span>
                </button>
            </div>
        </div>
    );
}
