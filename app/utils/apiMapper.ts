/**
 * API Mapper — Translates between API (Spanish/snake_case) and Frontend (English/camelCase)
 *
 * The backend API uses Spanish field names with snake_case (e.g. cliente_nit, precio_unitario).
 * The frontend uses English field names with camelCase (e.g. clientNit, unitPrice).
 *
 * These functions handle the translation in both directions.
 * Every API-facing boundary is typed with explicit interfaces (no `any`).
 */

import { Seller, Client, Product, Visit, Order, OrderItem, CartItem, Invoice, VisitWithClient } from "../types";

// ═══════════════════════════════════════════
// API Response Types (snake_case, Spanish)
// These mirror the exact shapes returned by the Pymo bridge.
// ═══════════════════════════════════════════

/** GET /auth/login → perfil */
interface ApiSeller {
    id: string;
    nombre: string;
    username: string;
}

/** GET /clientes/:nit */
interface ApiClient {
    nit: string;
    nombre: string;
    telefono: string;
    direccion: string;
    email?: string;
}

/** GET /productos */
interface ApiProduct {
    id: string;
    sku: string;
    nombre: string;
    precio: number;
    stock: number;
    descripcion: string;
    imagen_url: string;
    categoria: string;
}

/** GET /visitas */
interface ApiVisit {
    cliente_nit: string;
    vendedor_id: string;
    fecha: string;
    estado: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';
}

/** GET /visitas (with embedded client) */
interface ApiVisitWithClient extends ApiVisit {
    cliente: ApiClient;
}

/** GET /clientes/:nit/carrito items */
interface ApiCartItem {
    producto_id: string;
    nombre: string;
    sku: string;
    imagen_url: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

/** GET /clientes/:nit/cartera */
interface ApiInvoice {
    id: string;
    numero_factura: string;
    fecha: string;
    valor_total: number;
    total_abonado: number;
    saldo: number;
}

/** POST /pedidos response */
interface ApiOrderResponse {
    pedido: {
        id: string;
        fecha: string;
        total: number;
        estado: string;
        items_count: number;
    };
    visita: {
        nit: string;
        estado: string;
    };
}

/** PATCH /clientes/:nit/estado response */
interface ApiVisitStatusResponse {
    nit: string;
    estado: string;
    actualizado_en: string;
}

/** PUT /clientes/:nit/carrito response */
interface ApiSaveCartResponse {
    nit: string;
    items_count: number;
    total: number;
    estado: string;
}

/** GET /clientes/buscar/:nit response */
interface ApiSearchClientResponse {
    encontrado_en: "asignado" | "no_asignado" | null;
    cliente?: ApiClient;
    visita?: ApiVisit | null;
}

// ═══════════════════════════════════════════
// API Request Types (what we send TO the API)
// ═══════════════════════════════════════════

interface ApiCartItemPayload {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
}

interface ApiOrderPayload {
    nit: string;
    items: ApiCartItemPayload[];
    total: number;
}

interface ApiNewClientPayload {
    nit: string;
    nombre: string;
    telefono: string;
    direccion: string;
    email?: string;
}

interface ApiUpdateClientPayload {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    email?: string;
}

// ═══════════════════════════════════════════
// Public Types
// ═══════════════════════════════════════════

export type ClientSearchFoundIn = "asignado" | "no_asignado" | null;

export interface ClientSearchResponse {
    foundIn: ClientSearchFoundIn;
    client?: Client;
    visit?: Visit | null;
}

// ═══════════════════════════════════════════
// API Response → Frontend (for GET requests)
// ═══════════════════════════════════════════

export function mapSeller(api: ApiSeller): Seller {
    return {
        id: api.id,
        name: api.nombre,
        username: api.username,
    };
}

export function mapClient(api: ApiClient): Client {
    return {
        nit: api.nit,
        name: api.nombre,
        phone: api.telefono,
        address: api.direccion,
        email: api.email,
    };
}

export function mapProduct(api: ApiProduct): Product {
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

export function mapVisit(api: ApiVisit): Visit {
    return {
        clientNit: api.cliente_nit,
        sellerId: api.vendedor_id,
        date: api.fecha,
        status: api.estado,
    };
}

export function mapVisitWithClient(api: ApiVisitWithClient): VisitWithClient {
    return {
        ...mapVisit(api),
        client: mapClient(api.cliente),
    };
}

export function mapCartItem(api: ApiCartItem): CartItem {
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

export function mapInvoice(api: ApiInvoice): Invoice {
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

export function toApiCartItems(items: OrderItem[]): ApiCartItemPayload[] {
    return items.map(item => ({
        producto_id: item.productId,
        cantidad: item.quantity,
        precio_unitario: item.price,
    }));
}

export function toApiOrderPayload(order: { clientNit: string; items: OrderItem[]; total: number }): ApiOrderPayload {
    return {
        nit: order.clientNit,
        items: toApiCartItems(order.items),
        total: order.total,
    };
}

export function toApiNewClient(client: Client): ApiNewClientPayload {
    return {
        nit: client.nit,
        nombre: client.name,
        telefono: client.phone,
        direccion: client.address,
        email: client.email,
    };
}

/** Converts frontend data to PATCH /clientes/:nit payload */
export function toApiUpdateClient(data: Partial<Omit<Client, "nit">>): ApiUpdateClientPayload {
    const payload: ApiUpdateClientPayload = {};
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
export function mapOrderResponse(api: ApiOrderResponse): {
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
export function mapVisitStatusResponse(api: ApiVisitStatusResponse): {
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
export function mapSaveCartResponse(api: ApiSaveCartResponse): {
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
export function mapSearchClientResponse(api: ApiSearchClientResponse): ClientSearchResponse {
    if (!api.encontrado_en) {
        return { foundIn: null };
    }

    if (api.encontrado_en === "asignado") {
        return {
            foundIn: "asignado",
            client: api.cliente ? mapClient(api.cliente) : undefined,
            visit: api.visita ? mapVisit(api.visita) : null,
        };
    }

    // no_asignado: client exists but not assigned to this vendor
    return {
        foundIn: "no_asignado",
        client: api.cliente ? mapClient(api.cliente) : undefined,
    };
}
