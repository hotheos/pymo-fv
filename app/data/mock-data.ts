/**
 * Mock data constants for development mode.
 *
 * When the Pymo bridge is not available, MockContext falls back to this data.
 * Extracted here so that:
 *   1. MockContext stays focused on React state orchestration.
 *   2. Tests can import data directly without spinning up React.
 */

import type { Seller, Client, Product, Visit, Order, OrderItem, Invoice } from "../types";

// ─── Sellers ────────────────────────────────────────────────────

export const MOCK_SELLERS: (Seller & { password: string })[] = [
    { id: "s1", name: "Carlos Mendoza", username: "1", password: "1" },
    { id: "s2", name: "Andrea Ríos", username: "2", password: "2" },
];

// ─── Clients ────────────────────────────────────────────────────

export const MOCK_CLIENTS: Client[] = [
    { nit: "900123456", name: "Tienda La Esquina", phone: "3001234567", address: "Calle 123 # 45-67", email: "contacto@laesquina.com" },
    { nit: "800987654", name: "Supermercado El Ahorro", phone: "3109876543", address: "Carrera 80 # 12-34" },
    { nit: "1020304050", name: "Variedades Doña Rita", phone: "3205556677", address: "Av. Siempre Viva 742" },
    { nit: "111222333", name: "Mini Market El Progreso", phone: "3112223344", address: "Calle 10 # 5-20" },
    { nit: "444555666", name: "Panadería Las Delicias", phone: "3155556677", address: "Carrera 15 # 8-90" },
    { nit: "777888999", name: "Droguería San Jorge", phone: "3101112233", address: "Av. Bolivar # 32-15" },
    { nit: "123123123", name: "Tienda Don Luis", phone: "3123334455", address: "Calle 50 # 14-22" },
    { nit: "321321321", name: "Viveres La 40", phone: "3134445566", address: "Carrera 40 # 25-10" },
    { nit: "987987987", name: "Papelería Y Miscelánea", phone: "3145556677", address: "Calle 72 # 5-05" },
    { nit: "654654654", name: "Estanquillo La Amistad", phone: "3156667788", address: "Av. Santander # 45-80" },
    { nit: "111444777", name: "Cigarrería El Portal", phone: "3167778899", address: "Calle 30 # 18-55" },
    { nit: "222555888", name: "Granero Campesino", phone: "3178889900", address: "Carrera 22 # 9-30" },
    { nit: "333666999", name: "Autoservicio La 50", phone: "3189990011", address: "Av. 50 # 33-40" },
    { nit: "444777000", name: "Distribuidora JM", phone: "3190001122", address: "Calle 8 # 12-15" },
];

// ─── Products ───────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
    { id: "p1", sku: "LECHE-1L", name: "Leche Entera Alquería 1L", price: 4200, stock: 50, description: "Leche ultrapasteurizada, enriquecida con vitaminas A y D. Ideal para el desayuno familiar.", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=1000", category: "Lácteos" },
    { id: "p2", sku: "ARROZ-500", name: "Arroz Diana Premium 500g", price: 2800, stock: 8, description: "Arroz blanco seleccionado de grano entero. Cocción perfecta y sabor inigualable.", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1000", category: "Granos" },
    { id: "p3", sku: "ACEITE-1L", name: "Aceite Gourmet Girasol 1L", price: 15500, stock: 0, description: "Aceite 100% puro de girasol, libre de colesterol y grasas trans. Cuida tu corazón.", image: "/products/aceite.png", category: "Despensa" },
    { id: "p4", sku: "JABON-BA", name: "Jabón Dove Original x3 Und", price: 12500, stock: 120, description: "Jabón de tocador con 1/4 de crema humectante. Deja tu piel suave y radiante.", image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=1000", category: "Aseo Personal" },
    { id: "p5", sku: "GALLETAS-S", name: "Galletas Saltin Noel Taco", price: 4500, stock: 5, description: "Las tradicionales galletas saladas, crujientes y deliciosas. Perfectas para acompañar cualquier comida.", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=1000", category: "Pasabocas" },
    { id: "p6", sku: "ATUN-LOM", name: "Atún Van Camp's en Agua", price: 6800, stock: 45, description: "Lomos de atún en agua, altos en proteína y omega 3. Ideal para ensaladas.", image: "/products/atun.png", category: "Despensa" },
    { id: "p7", sku: "CAFE-500", name: "Café Sello Rojo 500g", price: 18900, stock: 0, description: "Café tostado y molido de alta calidad. El sabor de Colombia en tu taza.", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=1000", category: "Despensa" },
    { id: "p8", sku: "PAN-TAJ", name: "Pan Tajado Bimbo Blanco", price: 5600, stock: 15, description: "Pan blanco suave y esponjoso, fortificado con hierro y vitaminas. El favorito de todos.", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000", category: "Panadería" },
    { id: "p9", sku: "JUGO-HIT", name: "Jugo Hit Mora 1L", price: 4200, stock: 60, description: "Bebida de fruta refrescante con sabor a mora. Delicioso y natural.", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=1000", category: "Bebidas" },
    { id: "p10", sku: "CLOROX-1L", name: "Blanqueador Clorox 1L", price: 3800, stock: 3, description: "Desinfectante y blanqueador multiusos. Elimina el 99.9% de las bacterias.", image: "/products/clorox.png", category: "Aseo Hogar" },
    { id: "p11", sku: "PASTA-DORIA", name: "Espagueti Doria 500g", price: 3200, stock: 80, description: "Pasta de sémola de trigo duro. No se pega y queda siempre al dente.", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=1000", category: "Despensa" },
    { id: "p12", sku: "CHOCO-JET", name: "Chocolatina Jet x12", price: 8400, stock: 9, description: "La chocolatina tradicional de Colombia. Pack por 12 unidades surtidas.", image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=1000", category: "Dulces" },
    { id: "p13", sku: "GASEOSA-1.5", name: "Coca-Cola 1.5L", price: 5500, stock: 25, description: "Refresco gaseoso sabor cola. La chispa de la vida en tamaño familiar.", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=1000", category: "Bebidas" },
    { id: "p14", sku: "AREPAS-X5", name: "Arepas de Maíz x5", price: 3000, stock: 0, description: "Arepas blancas de maíz peto, listas para asar. Sin conservantes.", image: "/products/arepas.png", category: "Refrigerados" },
    { id: "p15", sku: "PAPEL-H", name: "Papel Higiénico Familia x4", price: 6500, stock: 40, description: "Papel higiénico doble hoja, suave y resistente. Mayor rendimiento.", image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&q=80&w=1000", category: "Aseo Personal" },
];

// ─── Date Helpers ───────────────────────────────────────────────

/** Create a date N days in the past (for mock visit history) */
export const daysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

// ─── Visits ─────────────────────────────────────────────────────

export const createMockVisits = (): Visit[] => [
    // ═══ VENDEDOR 1 (s1): Carlos Mendoza ═══
    // --- HOY ---
    // Por visitar (3)
    { clientNit: "900123456", sellerId: "s1", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "800987654", sellerId: "s1", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "111222333", sellerId: "s1", date: new Date().toISOString(), status: "PENDING" },
    // Visitando (3)
    { clientNit: "1020304050", sellerId: "s1", date: new Date().toISOString(), status: "IN_PROCESS" },
    { clientNit: "444555666", sellerId: "s1", date: new Date().toISOString(), status: "IN_PROCESS" },
    { clientNit: "777888999", sellerId: "s1", date: new Date().toISOString(), status: "IN_PROCESS" },
    // Canceladas (3)
    { clientNit: "123123123", sellerId: "s1", date: new Date().toISOString(), status: "CANCELLED" },
    { clientNit: "321321321", sellerId: "s1", date: new Date().toISOString(), status: "CANCELLED" },
    { clientNit: "111444777", sellerId: "s1", date: new Date().toISOString(), status: "CANCELLED" },
    // Finalizadas (1)
    { clientNit: "987987987", sellerId: "s1", date: new Date().toISOString(), status: "COMPLETED" },

    // --- DÍAS ANTERIORES (pendientes que nunca se completaron) ---
    // ⏰ Hace 2 días
    { clientNit: "654654654", sellerId: "s1", date: daysAgo(2), status: "PENDING" },
    { clientNit: "222555888", sellerId: "s1", date: daysAgo(2), status: "PENDING" },
    // ⏰ Hace 3 días (carrito abandonado)
    { clientNit: "333666999", sellerId: "s1", date: daysAgo(3), status: "IN_PROCESS" },

    // ═══ VENDEDOR 2 (s2): Andrea Ríos ═══
    { clientNit: "1020304050", sellerId: "s2", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "444555666", sellerId: "s2", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "900123456", sellerId: "s2", date: new Date().toISOString(), status: "IN_PROCESS" },
    { clientNit: "123123123", sellerId: "s2", date: new Date().toISOString(), status: "CANCELLED" },
    { clientNit: "800987654", sellerId: "s2", date: new Date().toISOString(), status: "COMPLETED" },
    // ⏰ Hace 1 día
    { clientNit: "444777000", sellerId: "s2", date: daysAgo(1), status: "PENDING" },
];

// ─── Orders ─────────────────────────────────────────────────────

export const createMockOrders = (): Order[] => [
    // Vendedor 1, Papelería Y Miscelánea, PEDIDO 1 (mañana)
    {
        id: "ord-init-1",
        sellerId: "s1",
        clientNit: "987987987",
        items: [
            { productId: "p1", quantity: 10, price: 4200 },
            { productId: "p2", quantity: 5, price: 2800 },
            { productId: "p4", quantity: 3, price: 12500 },
        ],
        total: 15320500,
        date: new Date(new Date().setHours(8, 15, 0)).toISOString(),
        status: "COMPLETED",
    },
    // Vendedor 1, Papelería Y Miscelánea, PEDIDO 2 (mediodía)
    {
        id: "ord-init-2",
        sellerId: "s1",
        clientNit: "987987987",
        items: [
            { productId: "p6", quantity: 6, price: 6800 },
            { productId: "p9", quantity: 8, price: 4200 },
        ],
        total: 74400,
        date: new Date(new Date().setHours(12, 30, 0)).toISOString(),
        status: "COMPLETED",
    },
    // Vendedor 1, Papelería Y Miscelánea, PEDIDO 3 (tarde)
    {
        id: "ord-init-3",
        sellerId: "s1",
        clientNit: "987987987",
        items: [
            { productId: "p11", quantity: 4, price: 3200 },
            { productId: "p12", quantity: 2, price: 8400 },
            { productId: "p13", quantity: 5, price: 5500 },
        ],
        total: 57100,
        date: new Date(new Date().setHours(16, 45, 0)).toISOString(),
        status: "COMPLETED",
    },
    // Vendedor 2, Supermercado El Ahorro
    {
        id: "ord-init-4",
        sellerId: "s2",
        clientNit: "800987654",
        items: [
            { productId: "p5", quantity: 6, price: 4500 },
            { productId: "p6", quantity: 10, price: 6800 },
            { productId: "p12", quantity: 4, price: 8400 },
        ],
        total: 128200,
        date: new Date(new Date().setHours(10, 0, 0)).toISOString(),
        status: "COMPLETED",
    },
];

// ─── Pre-loaded Carts ───────────────────────────────────────────

export const INITIAL_CARTS: Record<string, OrderItem[]> = {
    // Variedades Doña Rita
    "1020304050": [
        { productId: "p1", quantity: 5, price: 4200 },
        { productId: "p2", quantity: 3, price: 2800 },
        { productId: "p8", quantity: 2, price: 5600 },
    ],
    // Panadería Las Delicias
    "444555666": [
        { productId: "p4", quantity: 10, price: 12500 },
        { productId: "p5", quantity: 8, price: 4500 },
    ],
    // Droguería San Jorge
    "777888999": [
        { productId: "p6", quantity: 6, price: 6800 },
        { productId: "p9", quantity: 12, price: 4200 },
        { productId: "p11", quantity: 4, price: 3200 },
        { productId: "p12", quantity: 3, price: 8400 },
    ],
    // ⚠ Autoservicio La 50 (carrito ABANDONADO, stock desactualizado)
    "333666999": [
        { productId: "p3", quantity: 5, price: 15500 },   // Aceite, SIN STOCK
        { productId: "p7", quantity: 3, price: 18900 },   // Café, SIN STOCK
        { productId: "p5", quantity: 12, price: 4500 },   // Galletas, stock solo 5
    ],
};

// ─── Invoices ───────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
    { id: "inv-1", number: "FAC-001", date: "2025-01-10", total: 250000, totalPaid: 250000, balance: 0 },
    { id: "inv-2", number: "FAC-002", date: "2025-01-20", total: 180000, totalPaid: 100000, balance: 80000 },
    { id: "inv-3", number: "FAC-003", date: "2025-02-01", total: 320000, totalPaid: 0, balance: 320000 },
    { id: "inv-4", number: "FAC-004", date: "2025-02-05", total: 95000, totalPaid: 95000, balance: 0 },
    { id: "inv-5", number: "FAC-005", date: "2025-02-08", total: 150000, totalPaid: 50000, balance: 100000 },
];

// Invoices by client NIT (simulate GET /clientes/:nit/cartera)
export const INVOICES_BY_CLIENT: Record<string, string[]> = {
    "900123456": ["inv-1", "inv-2"],
    "800987654": ["inv-3"],
    "111222333": ["inv-4", "inv-5"],
};

// Unassigned clients in the system (exist in Mekano but not assigned to any vendor)
export const ALL_SYSTEM_CLIENTS: Record<string, Client> = {
    "555666777": { nit: "555666777", name: "DISTRIBUIDORA CENTRAL", phone: "3201234567", address: "Av. Industrial # 100-20", email: "ventas@distcentral.com" },
    "999888777": { nit: "999888777", name: "FERRETERÍA EL MARTILLO", phone: "3219876543", address: "Calle 80 # 20-10", email: "info@elmartillo.co" },
};
