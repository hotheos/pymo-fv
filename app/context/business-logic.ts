/**
 * Pure business logic functions, extracted from MockContext.
 *
 * These functions have NO dependency on React. They receive data as arguments
 * and return results, making them easy to test and reuse.
 */

import type { Product, Order, OrderItem, Invoice, Client, Visit } from "../types";

// ─── Stock Validation ───────────────────────────────────────────

export interface StockError {
    error: string;
    detail: { productName: string; available: number; requested: number };
}

/**
 * Validates that all items in the order have sufficient stock.
 * Returns null if valid, or a StockError describing the first issue found.
 */
export function validateStock(
    products: Product[],
    items: OrderItem[]
): StockError | null {
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.stock < item.quantity) {
            return {
                error: `Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
                detail: {
                    productName: product.name,
                    available: product.stock,
                    requested: item.quantity,
                },
            };
        }
    }
    return null;
}

// ─── Order Creation ─────────────────────────────────────────────

export interface CreateOrderResult {
    orderId?: string;
    error?: string;
    detail?: { productName: string; available: number; requested: number };
}

/**
 * Creates an order after validating stock.
 * Returns the new order and updated products (with decremented stock),
 * or a validation error.
 */
export function createOrder(
    orderData: Omit<Order, "id" | "date">,
    products: Product[]
): { result: CreateOrderResult; newOrder?: Order; updatedProducts?: Product[] } {
    // Validate stock
    const stockError = validateStock(products, orderData.items);
    if (stockError) {
        return { result: stockError };
    }

    const orderId = `ord-${Date.now()}`;
    const newOrder: Order = {
        ...orderData,
        id: orderId,
        date: new Date().toISOString(),
        status: "COMPLETED",
    };

    // Calculate updated products with decremented stock
    const updatedProducts = products.map(p => {
        const item = orderData.items.find(i => i.productId === p.id);
        if (item) {
            return { ...p, stock: p.stock - item.quantity };
        }
        return p;
    });

    return { result: { orderId }, newOrder, updatedProducts };
}

// ─── KPI Calculations ──────────────────────────────────────────

/**
 * Calculates today's sales total and order count for a given seller.
 * Simulates GET /pedidos/hoy
 */
export function calculateTodaySales(
    orders: Order[],
    sellerId: string
): { salesTotal: number; ordersCount: number } {
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const myOrders = orders.filter(
        o => o.sellerId === sellerId && new Date(o.date).toLocaleDateString("en-CA") === today
    );
    return {
        salesTotal: myOrders.reduce((sum, o) => sum + o.total, 0),
        ordersCount: myOrders.length,
    };
}

/**
 * Gets today's completed orders for a given seller.
 */
export function getTodayOrdersForSeller(orders: Order[], sellerId: string): Order[] {
    const today = new Date().toLocaleDateString("en-CA");
    return orders.filter(
        o => o.sellerId === sellerId &&
            new Date(o.date).toLocaleDateString("en-CA") === today &&
            o.status === "COMPLETED"
    );
}

// ─── Invoice / Wallet ───────────────────────────────────────────

/**
 * Gets invoices and wallet total for a client.
 * Simulates GET /clientes/:nit/cartera
 */
export function getClientInvoices(
    nit: string,
    invoices: Invoice[],
    invoicesByClient: Record<string, string[]>
): { invoices: Invoice[]; walletTotal: number } {
    const invoiceIds = invoicesByClient[nit] || [];
    const clientInvoices = invoices.filter(inv => invoiceIds.includes(inv.id));
    const walletTotal = clientInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    return { invoices: clientInvoices, walletTotal };
}

// ─── Client Search ──────────────────────────────────────────────

export interface ClientSearchResult {
    foundIn: "asignado" | "no_asignado" | null;
    client?: Client;
    visit?: Visit | null;
}

/**
 * Unified client search across all sources.
 * Simulates GET /clientes/buscar/:nit
 */
export function searchClientInAllSources(
    nit: string,
    visits: Visit[],
    clients: Client[],
    sellerId: string,
    systemClients: Record<string, Client>
): ClientSearchResult {
    // 1. Search assigned clients (prioritize active visits over COMPLETED)
    const myActiveVisit = visits.find(
        v => v.clientNit === nit && v.sellerId === sellerId && v.status !== "COMPLETED"
    );
    const myCompletedVisit = visits.find(
        v => v.clientNit === nit && v.sellerId === sellerId && v.status === "COMPLETED"
    );
    const myVisit = myActiveVisit || myCompletedVisit;

    if (myVisit) {
        const client = clients.find(c => c.nit === nit);
        if (client) {
            return { foundIn: "asignado", client: { ...client }, visit: { ...myVisit } };
        }
    }

    // 2. Check local client list (assigned to other vendors)
    const existingClient = clients.find(c => c.nit === nit);
    if (existingClient) {
        return { foundIn: "no_asignado", client: { ...existingClient } };
    }

    // 3. Search all system clients (not assigned to any vendor)
    const systemClient = systemClients[nit];
    if (systemClient) {
        return { foundIn: "no_asignado", client: { ...systemClient } };
    }

    // 4. Not found anywhere
    return { foundIn: null };
}

// ─── Currency Formatting ────────────────────────────────────────

/** Format a number as COP currency */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
