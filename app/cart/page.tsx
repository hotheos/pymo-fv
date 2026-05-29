"use client";

import { useMock } from "../context/MockContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, CheckCircle2, FileText, Share2, Home as HomeIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ProductImage from "../components/ui/ProductImage";

export default function CartPage() {
    const { cart, products, updateCartQuantity, removeFromCart, addOrder, completeVisit, seller, activeClientNit, visits, clients, saveCart } = useMock();
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [finalOrder, setFinalOrder] = useState<{ items: typeof cartItems, total: number, clientName: string, clientNit: string, clientAddress: string, clientPhone: string } | null>(null);
    const [stockError, setStockError] = useState<{ message: string; productName: string; available: number; requested: number } | null>(null);

    // Get active client from visit
    const activeVisit = activeClientNit ? visits.find(v => v.clientNit === activeClientNit && v.sellerId === seller?.id) : null;
    const activeClient = activeClientNit ? clients.find(c => c.nit === activeClientNit) : null;

    const cartItems = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
    }).filter(item => item.product); // Filter out if product not found

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

        const orderPayload = {
            sellerId: seller?.id || "unknown",
            clientNit: clientNit,
            items: cart,
            total: total,
            status: "COMPLETED" as const
        };

        const result = addOrder(orderPayload);

        // Handle stock error
        if (result.error) {
            setStockError({
                message: result.error,
                productName: result.detail?.productName || "",
                available: result.detail?.available || 0,
                requested: result.detail?.requested || 0
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
            clientPhone: activeClient?.phone || ""
        });
        setIsSuccess(true);
    };

    const handleReset = () => {
        router.push("/");
    };

    const handleShareWhatsApp = () => {
        if (!finalOrder) return;

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

        // If client has a 10-digit phone, direct to their WhatsApp with Colombia code
        const phone = finalOrder.clientPhone?.replace(/\D/g, "");
        const waUrl = phone && phone.length === 10
            ? `https://wa.me/57${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(waUrl, "_blank");
    };

    const handleGeneratePDF = async () => {
        setIsGeneratingPdf(true);
        const doc = new jsPDF();

        // Helper to load image using fetch blob for robustness
        // Helper to load image using fetch blob for robustness and get dimensions
        const loadImage = async (url: string): Promise<{ data: string; width: number; height: number } | null> => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Failed to fetch image: ${response.statusText}`);
                    return null;
                }
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                // Get dimensions
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ data: base64, width: img.width, height: img.height });
                    };
                    img.onerror = () => resolve(null); // Should not happen given blob is valid
                    img.src = base64;
                });

            } catch (error) {
                console.error("Error loading image via fetch:", error);
                return null;
            }
        };

        const logoImage = await loadImage("/logo.png");

        // --- Header ---
        // Logo
        if (logoImage) {
            try {
                const logoWidth = 40;
                const aspect = logoImage.width / logoImage.height;
                const logoHeight = logoWidth / aspect;
                doc.addImage(logoImage.data, "PNG", 15, 15, logoWidth, logoHeight);
            } catch (e) {
                console.error("Error adding logo to PDF", e);
            }
        }

        // Title & Order Info
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text("PEDIDO DE VENTA", 195, 25, { align: "right" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Fecha: ${dateStr}`, 195, 33, { align: "right" });
        doc.text(`Orden #: ${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`, 195, 38, { align: "right" });

        // --- Info Section ---
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.5);
        doc.line(15, 60, 195, 60);

        // Seller Info
        doc.setFontSize(9);
        doc.setTextColor(100); // Slate 500
        doc.setFont("helvetica", "bold");
        doc.text("VENDEDOR", 15, 68);
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFont("helvetica", "normal");
        doc.text(seller?.name || "N/A", 15, 74);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(seller?.username || "", 15, 79);

        // Client Info
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("CLIENTE", 100, 68);
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.text(finalOrder?.clientName || "N/A", 100, 74);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(`NIT: ${finalOrder?.clientNit || "N/A"}`, 100, 79);
        doc.text(finalOrder?.clientAddress || "N/A", 100, 84);

        const currentTotal = finalOrder?.total || 0;
        const currentItems = finalOrder?.items || [];

        // --- Table ---
        const tableColumn = ["PRODUCTO", "CANT.", "PRECIO UNIT.", "SUBTOTAL"];
        const tableRows = currentItems.map(item => [
            item.product?.name || "Producto",
            item.quantity,
            `$${item.price.toLocaleString()}`,
            `$${(item.price * item.quantity).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 95,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [71, 85, 105],
                fontStyle: 'bold',
                halign: 'left' // Default left for title 'PRODUCTO'
            },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Body: Left (default)
                1: { cellWidth: 20, halign: 'center' }, // Body: Center
                2: { cellWidth: 35, halign: 'right' }, // Body: Right
                3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } // Body: Right
            },
            // Explicitly override alignment ONLY for headers
            didParseCell: function (data) {
                if (data.section === 'head') {
                    // Cantidad (1), Precio (2), Subtotal (3) -> Drive to Right
                    if (data.column.index === 1 || data.column.index === 2 || data.column.index === 3) {
                        data.cell.styles.halign = 'right';
                    }
                }
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            margin: { top: 95, left: 15, right: 15 },
        });

        // --- Footer & Totals ---
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 15;

        // Line above total
        doc.setDrawColor(226, 232, 240);
        doc.line(120, finalY - 5, 195, finalY - 5);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("TOTAL A PAGAR", 140, finalY);

        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(`$${currentTotal.toLocaleString()}`, 195, finalY, { align: "right" });

        // Branding Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, pageHeight - 20, 195, pageHeight - 20);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Generado por Pymo - Fuerza de Ventas", 15, pageHeight - 12);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(203, 213, 225);
        doc.text("Desarrollado por Apolosoft", 195, pageHeight - 12, { align: "right" });

        // Open in new tab using Blob and URL.createObjectURL for better compatibility
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

        // Cleanup after a delay to allow the tab to load
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);

        setIsGeneratingPdf(false);
    };
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
                <div className="bg-emerald-100 p-6 rounded-full mb-6 animate-bounce">
                    <CheckCircle2 size={64} className="text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">¡Pedido Generado!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">La transacción ha sido registrada y sincronizada correctamente.</p>

                <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-card w-full mb-8">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Monto Total</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100">${(finalOrder?.total || 0).toLocaleString()}</p>
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
                        onClick={handleReset}
                        className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 flex items-center justify-center gap-2"
                    >
                        <HomeIcon size={18} />
                        <span>VOLVER AL DASHBOARD</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-32 bg-slate-50 dark:bg-dark-900 min-h-screen transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-dark-900 shadow-sm px-4 py-4 flex items-center gap-3 sticky top-0 z-10 transition-colors">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Resumen del Pedido</h1>
            </header>

            {/* List */}
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
