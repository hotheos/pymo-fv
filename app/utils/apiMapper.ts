/**
 * API Mapper — Translates between API (Spanish/snake_case) and Frontend (English/camelCase)
 *
 * The backend API uses Spanish field names with snake_case (e.g. cliente_nit, precio_unitario).
 * The frontend uses English field names with camelCase (e.g. clientNit, unitPrice).
 *
 * These functions handle the translation in both directions.
 */

import { Seller, Client, Product, Visit, Order, OrderItem, CartItem, Invoice, VisitWithClient } from "../types";

// Type for unified client search response: GET /clientes/buscar/:nit
export type ClientSearchFoundIn = "asignado" | "no_asignado" | null;

export interface ClientSearchResponse {
    foundIn: ClientSearchFoundIn;
    client?: Client;
    visit?: Visit | null;
}

// ═══════════════════════════════════════════
// API Response → Frontend (for GET requests)
// ═══════════════════════════════════════════

export function mapSeller(api: any): Seller {
    return {
        id: api.id,
        name: api.nombre,
        username: api.username,
    };
}

export function mapClient(api: any): Client {
    return {
        nit: api.nit,
        name: api.nombre,
        phone: api.telefono,
        address: api.direccion,
        email: api.email,
    };
}

export function mapProduct(api: any): Product {
    return {
        id: api.id,
        sku: api.sku,
        name: api.nombre,
        price: api.precio,
        stock: api.stock,
        description: api.descripcion,
        image: api.imagen_url,
        category: api.categoria,
    };
}

export function mapVisit(api: any): Visit {
    return {
        clientNit: api.cliente_nit,
        sellerId: api.vendedor_id,
        date: api.fecha,
        status: api.estado,
    };
}

export function mapVisitWithClient(api: any): VisitWithClient {
    return {
        ...mapVisit(api),
        client: mapClient(api.cliente),
    };
}

export function mapCartItem(api: any): CartItem {
    return {
        productId: api.producto_id,
        name: api.nombre,
        sku: api.sku,
        imageUrl: api.imagen_url,
        quantity: api.cantidad,
        unitPrice: api.precio_unitario,
        subtotal: api.subtotal,
    };
}

export function mapInvoice(api: any): Invoice {
    return {
        id: api.id,
        number: api.numero_factura,
        date: api.fecha,
        total: api.valor_total,
        totalPaid: api.total_abonado,
        balance: api.saldo,
    };
}

// ═══════════════════════════════════════════
// Frontend → API Request (for POST/PUT/PATCH)
// ═══════════════════════════════════════════

export function toApiCartItems(items: OrderItem[]): any[] {
    return items.map(item => ({
        producto_id: item.productId,
        cantidad: item.quantity,
        precio_unitario: item.price,
    }));
}

export function toApiOrderPayload(order: { clientNit: string; items: OrderItem[]; total: number }): any {
    return {
        nit: order.clientNit,
        items: toApiCartItems(order.items),
        total: order.total,
    };
}

export function toApiNewClient(client: Client): any {
    return {
        nit: client.nit,
        nombre: client.name,
        telefono: client.phone,
        direccion: client.address,
        email: client.email,
    };
}

/** Converts frontend data to PATCH /clientes/:nit payload */
export function toApiUpdateClient(data: Partial<Omit<Client, "nit">>): any {
    const payload: any = {};
    if (data.name !== undefined) payload.nombre = data.name;
    if (data.phone !== undefined) payload.telefono = data.phone;
    if (data.address !== undefined) payload.direccion = data.address;
    if (data.email !== undefined) payload.email = data.email;
    return payload;
}

// ═══════════════════════════════════════════
// Complex response mappers
// ═══════════════════════════════════════════

/** Maps the response from POST /pedidos (checkout) */
export function mapOrderResponse(api: any): {
    order: { id: string; date: string; total: number; status: string; itemsCount: number };
    visit: { nit: string; status: string };
} {
    return {
        order: {
            id: api.pedido.id,
            date: api.pedido.fecha,
            total: api.pedido.total,
            status: api.pedido.estado,
            itemsCount: api.pedido.items_count,
        },
        visit: {
            nit: api.visita.nit,
            status: api.visita.estado,
        },
    };
}

/** Maps the response from PATCH /clientes/:nit/estado */
export function mapVisitStatusResponse(api: any): {
    nit: string;
    status: string;
    updatedAt: string;
} {
    return {
        nit: api.nit,
        status: api.estado,
        updatedAt: api.actualizado_en,
    };
}

/** Maps the response from PUT /clientes/:nit/carrito */
export function mapSaveCartResponse(api: any): {
    nit: string;
    itemsCount: number;
    total: number;
    status: string;
} {
    return {
        nit: api.nit,
        itemsCount: api.items_count,
        total: api.total,
        status: api.estado,
    };
}

// ═══════════════════════════════════════════
// Unified client search mapper
// ═══════════════════════════════════════════

/** Maps the response from GET /clientes/buscar/:nit */
export function mapSearchClientResponse(api: any): ClientSearchResponse {
    if (!api.encontrado_en) {
        return { foundIn: null };
    }

    if (api.encontrado_en === "asignado") {
        return {
            foundIn: "asignado",
            client: mapClient(api.cliente),
            visit: api.visita ? mapVisit(api.visita) : null,
        };
    }

    // no_asignado — client exists but not assigned to this vendor
    return {
        foundIn: "no_asignado",
        client: mapClient(api.cliente),
    };
}
