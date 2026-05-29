"use client";

import { useMock } from "../context/MockContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import ProductImage from "../components/ui/ProductImage";
import CheckoutSuccess from "../components/cart/CheckoutSuccess";

export default function CartPage() {
    const { cart, products, updateCartQuantity, removeFromCart, addOrder, completeVisit, seller, activeClientNit, visits, clients, saveCart } = useMock();
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);
    const [finalOrder, setFinalOrder] = useState<{
        items: typeof cartItems;
        total: number;
        clientName: string;
        clientNit: string;
        clientAddress: string;
        clientPhone: string;
    } | null>(null);
    const [stockError, setStockError] = useState<{
        message: string;
        productName: string;
        available: number;
        requested: number;
    } | null>(null);

    // Get active client from visit
    const activeClient = activeClientNit ? clients.find(c => c.nit === activeClientNit) : null;

    const cartItems = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
    }).filter(item => item.product);

    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Stock validation: detect items where saved quantity exceeds current stock
    const stockIssues = cartItems.filter(item => item.product && item.quantity > item.product.stock);
    const hasStockIssues = stockIssues.length > 0;

    // Auto-adjust all quantities to available stock, remove items with 0 stock
    const handleNivelar = () => {
        stockIssues.forEach(item => {
            if (item.product!.stock === 0) {
                removeFromCart(item.productId);
            } else {
                updateCartQuantity(item.productId, item.product!.stock);
            }
        });
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setStockError(null);

        const clientNit = activeClientNit || "";

        // Save cart before checkout (simulates PUT /clientes/:nit/carrito backup)
        if (activeClientNit) {
            saveCart(activeClientNit);
        }

        const result = addOrder({
            sellerId: seller?.id || "unknown",
            clientNit,
            items: cart,
            total,
            status: "COMPLETED" as const,
        });

        // Handle stock error
        if (result.error) {
            setStockError({
                message: result.error,
                productName: result.detail?.productName || "",
                available: result.detail?.available || 0,
                requested: result.detail?.requested || 0,
            });
            return;
        }

        completeVisit();
        setFinalOrder({
            items: [...cartItems],
            total,
            clientName: activeClient?.name || "N/A",
            clientNit: activeClient?.nit || "N/A",
            clientAddress: activeClient?.address || "N/A",
            clientPhone: activeClient?.phone || "",
        });
        setIsSuccess(true);
    };

    // --- Success screen ---
    if (isSuccess && finalOrder) {
        return <CheckoutSuccess finalOrder={finalOrder} seller={seller} />;
    }

    // --- Cart screen ---
    return (
        <div className="pb-32 bg-slate-50 dark:bg-dark-900 min-h-screen transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-dark-900 shadow-sm px-4 py-4 flex items-center gap-3 sticky top-0 z-10 transition-colors">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Resumen del Pedido</h1>
            </header>

            {/* Items List */}
            <div className="px-4 lg:px-8 py-6 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
                {cartItems.map((item) => (
                    <div key={item.productId} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-card flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-dark-700 rounded-lg flex-shrink-0 overflow-hidden relative">
                            <ProductImage
                                src={item.product?.image}
                                alt={item.product?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.product?.name}</h3>
                                <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mb-3">{item.product?.sku}</p>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-dark-700 rounded-lg p-1">
                                    <button
                                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-dark-600 shadow rounded text-slate-600 dark:text-slate-200 font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-dark-600 shadow rounded text-slate-600 dark:text-slate-200 font-bold"
                                    >
                                        +
                                    </button>
                                    {item.product && item.quantity > item.product.stock && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-[10px] font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                                            {item.product.stock === 0 ? '⚠ Sin stock' : `⚠ Disp: ${item.product.stock}`}
                                        </span>
                                    )}
                                </div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">${(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {cartItems.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        Tu carrito está vacío.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-dark-800 border-t border-slate-100 dark:border-dark-600 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors">
                {hasStockIssues && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/20 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={16} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400">{stockIssues.length} producto{stockIssues.length > 1 ? 's' : ''} sin stock suficiente</p>
                            <p className="text-[10px] text-red-500/70 dark:text-red-400/60 mt-0.5">Ajusta cantidades al stock disponible</p>
                        </div>
                        <button
                            onClick={handleNivelar}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 active:scale-95 transition-all flex-shrink-0 shadow-sm"
                        >
                            NIVELAR
                        </button>
                    </div>
                )}
                {cartItems.length > 0 && !hasStockIssues && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/15">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={14} className="text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Carrito no guardado</p>
                            <p className="text-[10px] text-amber-500/70 dark:text-amber-400/60 mt-0.5">Finaliza el pedido o vuelve al dashboard para guardar.</p>
                        </div>
                    </div>
                )}
                {stockError && (
                    <div
                        onClick={() => setStockError(null)}
                        className="mb-3 flex items-start gap-2 px-3 py-3 rounded-xl bg-red-50 border border-red-200 cursor-pointer"
                    >
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-red-700">{stockError.message}</p>
                            <p className="text-[10px] text-red-500 mt-0.5">Toca para cerrar</p>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-400 font-bold text-sm uppercase">Total a Pagar</span>
                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100">${total.toLocaleString()}</span>
                </div>
                <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-tenant-gradient text-white py-4 rounded-xl font-bold text-lg shadow-high disabled:bg-none disabled:bg-slate-300 disabled:shadow-none"
                >
                    FINALIZAR PEDIDO
                </button>
            </div>
        </div>
    );
}
