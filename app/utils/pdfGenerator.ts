/**
 * PDF generation for order receipts.
 * Extracted from cart/page.tsx to reduce its size.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Seller } from "../types";

interface PdfOrderData {
    items: { productId: string; quantity: number; price: number; product?: { name?: string; sku?: string } }[];
    total: number;
    clientName: string;
    clientNit: string;
    clientAddress: string;
}

/** Load an image as base64 with dimensions (for logo embedding) */
async function loadImage(url: string): Promise<{ data: string; width: number; height: number } | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ data: base64, width: img.width, height: img.height });
            img.onerror = () => resolve(null);
            img.src = base64;
        });
    } catch {
        return null;
    }
}

/**
 * Generates and opens a PDF receipt for a completed order.
 */
export async function generateOrderPdf(order: PdfOrderData, seller: Seller | null): Promise<void> {
    const doc = new jsPDF();

    const logoImage = await loadImage("/logo.png");

    // --- Header ---
    if (logoImage) {
        try {
            const logoWidth = 40;
            const aspect = logoImage.width / logoImage.height;
            const logoHeight = logoWidth / aspect;
            doc.addImage(logoImage.data, "PNG", 15, 15, logoWidth, logoHeight);
        } catch {
            // Logo load failed; continue without it
        }
    }

    // Title & Order Info
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("PEDIDO DE VENTA", 195, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Fecha: ${dateStr}`, 195, 33, { align: "right" });
    doc.text(`Orden #: ${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`, 195, 38, { align: "right" });

    // --- Info Section ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 60, 195, 60);

    // Seller Info
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("VENDEDOR", 15, 68);
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(seller?.name || "N/A", 15, 74);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(seller?.username || "", 15, 79);

    // Client Info
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE", 100, 68);
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(order.clientName, 100, 74);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`NIT: ${order.clientNit}`, 100, 79);
    doc.text(order.clientAddress, 100, 84);

    // --- Table ---
    const tableColumn = ["PRODUCTO", "CANT.", "PRECIO UNIT.", "SUBTOTAL"];
    const tableRows = order.items.map(item => [
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
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
            if (data.section === 'head') {
                if (data.column.index === 1 || data.column.index === 2 || data.column.index === 3) {
                    data.cell.styles.halign = 'right';
                }
            }
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        margin: { top: 95, left: 15, right: 15 },
    });

    // --- Footer & Totals ---
    // @ts-expect-error jspdf-autotable adds lastAutoTable to doc but the type is not exported
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setDrawColor(226, 232, 240);
    doc.line(120, finalY - 5, 195, finalY - 5);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL A PAGAR", 140, finalY);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${order.total.toLocaleString()}`, 195, finalY, { align: "right" });

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

    // Open in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    // Cleanup after a delay to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
}
