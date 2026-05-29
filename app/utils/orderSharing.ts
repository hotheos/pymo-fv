import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Client, Order, Product } from "@/types";

interface OrderWithProducts {
    order: Order;
    client: Client;
    sellerName: string;
    items: { product: Product | undefined; quantity: number; price: number }[];
}

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

/**
 * Generates a PDF for an order and triggers download.
 */
export function generateOrderPDF({ order, client, sellerName, items }: OrderWithProducts): void {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // --- Header ---
    doc.setFillColor(73, 177, 245);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PYMO", 15, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Comprobante de Pedido", 15, 27);

    doc.setFontSize(9);
    doc.text(`Pedido: ${order.id}`, 195, 15, { align: "right" });
    doc.text(formatDate(order.date), 195, 22, { align: "right" });
    doc.text(`Vendedor: ${sellerName}`, 195, 29, { align: "right" });

    // --- Client Info ---
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 15, 48);

    doc.setDrawColor(73, 177, 245);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${client.name}`, 15, 57);
    doc.text(`NIT / Cédula: ${client.nit}`, 15, 63);
    doc.text(`Dirección: ${client.address}`, 15, 69);
    doc.text(`Teléfono: ${client.phone}`, 15, 75);

    // --- Items Table ---
    const tableBody = items.map((item, i) => [
        (i + 1).toString(),
        item.product?.sku || "—",
        item.product?.name || "Producto",
        item.quantity.toString(),
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity),
    ]);

    autoTable(doc, {
        startY: 82,
        head: [["#", "SKU", "Producto", "Cant.", "Precio Ud.", "Subtotal"]],
        body: tableBody,
        theme: "striped",
        headStyles: {
            fillColor: [73, 177, 245],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 22 },
            2: { cellWidth: "auto" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 28, halign: "right" },
            5: { cellWidth: 28, halign: "right" },
        },
        margin: { left: 15, right: 15 },
    });

    // --- Total ---
    // @ts-expect-error jspdf-autotable adds lastAutoTable to the doc instance but does not export types for it
    const finalY: number = doc.lastAutoTable?.finalY || 140;

    doc.setFillColor(73, 177, 245);
    doc.roundedRect(120, finalY + 8, 75, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 127, finalY + 18);
    doc.setFontSize(14);
    doc.text(formatCurrency(order.total), 190, finalY + 18, { align: "right" });

    // --- Footer ---
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Generado por Pymo · Fuerza de Ventas — Apolosoft S.A.S.", 105, 285, { align: "center" });

    // Download
    const fileName = `Pedido_${client.nit}_${order.id}.pdf`;
    doc.save(fileName);
}

/**
 * Composes a WhatsApp message and opens it in a new tab.
 */
export function shareOrderWhatsApp({ order, client, sellerName, items }: OrderWithProducts): void {
    const itemLines = items.map((item, i) =>
        `  ${i + 1}. ${item.product?.name || "Producto"}\n      ↳ x${item.quantity}  ·  ${formatCurrency(item.price * item.quantity)}`
    ).join("\n");

    const message = [
        `╔══════════════════════╗`,
        `   📋  *PEDIDO DE VENTA*`,
        `╚══════════════════════╝`,
        ``,
        `📅 ${formatDate(order.date)}`,
        `🧾 ID: ${order.id}`,
        ``,
        `┌─ *Vendedor*`,
        `│  👤 ${sellerName}`,
        `│`,
        `├─ *Cliente*`,
        `│  🏪 ${client.name}`,
        `│  🆔 NIT: ${client.nit}`,
        `│  📍 ${client.address}`,
        `│  📞 ${client.phone}`,
        `└──────────────`,
        ``,
        `📦 *Productos:*`,
        itemLines,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 *TOTAL:  ${formatCurrency(order.total)}*`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `_Generado por *Pymo* · Fuerza de Ventas_`,
        `🔗 pymo-fv.vercel.app`,
    ].join("\n");

    const encoded = encodeURIComponent(message);
    const phoneClean = client.phone.replace(/\D/g, "");
    // If phone starts with "3" (Colombia mobile), prefix with country code
    const fullPhone = phoneClean.startsWith("3") ? `57${phoneClean}` : phoneClean;

    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, "_blank");
}
