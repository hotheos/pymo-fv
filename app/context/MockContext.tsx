"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Seller, Client, Product, Visit, Order, OrderItem, Invoice } from "../types";
import { apiFetch, setAuthToken } from "@/config/api";

// --- MOCK DATA ---

const MOCK_SELLERS: (Seller & { password: string })[] = [
    { id: "s1", name: "Carlos Mendoza", username: "1", password: "1" },
    { id: "s2", name: "Andrea Ríos", username: "2", password: "2" },
];

const MOCK_CLIENTS: Client[] = [
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

const MOCK_PRODUCTS: Product[] = [
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

// Helper: create past dates for mock data
const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

const MOCK_VISITS: Visit[] = [
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
    // Finalizadas (1) — solo 1 visita COMPLETED; los 3 pedidos están en MOCK_ORDERS
    { clientNit: "987987987", sellerId: "s1", date: new Date().toISOString(), status: "COMPLETED" },

    // --- DÍAS ANTERIORES (pendientes que nunca se completaron) ---
    // ⏰ Hace 2 días — Por visitar
    { clientNit: "654654654", sellerId: "s1", date: daysAgo(2), status: "PENDING" },
    { clientNit: "222555888", sellerId: "s1", date: daysAgo(2), status: "PENDING" },
    // ⏰ Hace 3 días — Visitando (carrito abandonado)
    { clientNit: "333666999", sellerId: "s1", date: daysAgo(3), status: "IN_PROCESS" },

    // ═══ VENDEDOR 2 (s2): Andrea Ríos — 2-1-1-1 ═══
    { clientNit: "1020304050", sellerId: "s2", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "444555666", sellerId: "s2", date: new Date().toISOString(), status: "PENDING" },
    { clientNit: "900123456", sellerId: "s2", date: new Date().toISOString(), status: "IN_PROCESS" },
    { clientNit: "123123123", sellerId: "s2", date: new Date().toISOString(), status: "CANCELLED" },
    { clientNit: "800987654", sellerId: "s2", date: new Date().toISOString(), status: "COMPLETED" },
    // ⏰ Hace 1 día — Pendiente
    { clientNit: "444777000", sellerId: "s2", date: daysAgo(1), status: "PENDING" },
];

// Órdenes iniciales para visitas finalizadas
const MOCK_ORDERS: Order[] = [
    // Vendedor 1 — Papelería Y Miscelánea — PEDIDO 1 (mañana)
    {
        id: "ord-init-1",
        sellerId: "s1",
        clientNit: "987987987",
        items: [
            { productId: "p1", quantity: 10, price: 4200 },
            { productId: "p2", quantity: 5, price: 2800 },
            { productId: "p4", quantity: 3, price: 12500 },
        ],
        total: 93500,
        date: new Date(new Date().setHours(8, 15, 0)).toISOString(),
        status: "COMPLETED",
    },
    // Vendedor 1 — Papelería Y Miscelánea — PEDIDO 2 (mediodía)
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
    // Vendedor 1 — Papelería Y Miscelánea — PEDIDO 3 (tarde)
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
    // Vendedor 2 — Supermercado El Ahorro
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

// Carritos pre-cargados para visitas IN_PROCESS (vendedor s1)
const INITIAL_CARTS: Record<string, OrderItem[]> = {
    // Variedades Doña Rita — Leche x5, Arroz x3, Pan x2
    "1020304050": [
        { productId: "p1", quantity: 5, price: 4200 },
        { productId: "p2", quantity: 3, price: 2800 },
        { productId: "p8", quantity: 2, price: 5600 },
    ],
    // Panadería Las Delicias — Jabón x10, Galletas x8
    "444555666": [
        { productId: "p4", quantity: 10, price: 12500 },
        { productId: "p5", quantity: 8, price: 4500 },
    ],
    // Droguería San Jorge — Atún x6, Jugo x12, Pasta x4, Chocolate x3
    "777888999": [
        { productId: "p6", quantity: 6, price: 6800 },
        { productId: "p9", quantity: 12, price: 4200 },
        { productId: "p11", quantity: 4, price: 3200 },
        { productId: "p12", quantity: 3, price: 8400 },
    ],
    // ⚠️ Autoservicio La 50 — Carrito ABANDONADO hace 3 días (stock desactualizado)
    // Aceite (stock: 0), Café (stock: 0), Galletas (stock: 5 pero pide 12)
    "333666999": [
        { productId: "p3", quantity: 5, price: 15500 },   // Aceite — SIN STOCK
        { productId: "p7", quantity: 3, price: 18900 },   // Café — SIN STOCK
        { productId: "p5", quantity: 12, price: 4500 },   // Galletas — stock solo 5
    ],
};

// --- MOCK INVOICES ---

const MOCK_INVOICES: Invoice[] = [
    { id: "inv-1", number: "FAC-001", date: "2025-01-10", total: 250000, totalPaid: 250000, balance: 0 },
    { id: "inv-2", number: "FAC-002", date: "2025-01-20", total: 180000, totalPaid: 100000, balance: 80000 },
    { id: "inv-3", number: "FAC-003", date: "2025-02-01", total: 320000, totalPaid: 0, balance: 320000 },
    { id: "inv-4", number: "FAC-004", date: "2025-02-05", total: 95000, totalPaid: 95000, balance: 0 },
    { id: "inv-5", number: "FAC-005", date: "2025-02-08", total: 150000, totalPaid: 50000, balance: 100000 },
];

// Invoices by client NIT (simulate GET /clientes/:nit/cartera)
const INVOICES_BY_CLIENT: Record<string, string[]> = {
    "900123456": ["inv-1", "inv-2"],
    "800987654": ["inv-3"],
    "111222333": ["inv-4", "inv-5"],
};

// Unassigned clients in the system (exist in Mekano but not assigned to any vendor with visits)
const ALL_SYSTEM_CLIENTS: Record<string, Client> = {
    "555666777": { nit: "555666777", name: "DISTRIBUIDORA CENTRAL", phone: "3201234567", address: "Av. Industrial # 100-20", email: "ventas@distcentral.com" },
    "999888777": { nit: "999888777", name: "FERRETERÍA EL MARTILLO", phone: "3219876543", address: "Calle 80 # 20-10", email: "info@elmartillo.co" },
};

// --- CONTEXT ---

interface MockContextType {
    seller: Seller | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    clients: Client[];
    products: Product[];
    visits: Visit[];
    addClient: (client: Client) => { nit: string; error?: string };
    updateClient: (nit: string, data: Partial<Omit<Client, "nit">>) => void;
    orders: Order[];
    addOrder: (order: Omit<Order, "id" | "date">) => { orderId?: string; error?: string; detail?: { productName: string; available: number; requested: number } };
    updateProductStock: (productId: string, quantity: number) => void;
    // Cart (per-client NIT)
    cart: OrderItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    saveCart: (nit: string) => void;
    getCart: (nit: string) => OrderItem[];
    // Visit management (by client NIT)
    activeClientNit: string | null;
    beginVisit: (nit: string) => void;
    completeVisit: () => Promise<void>;
    cancelVisit: (nit: string) => Promise<void>;
    reactivateVisit: (nit: string) => Promise<void>;
    resetVisit: (nit: string) => Promise<void>;
    // API-aligned helpers
    getTodaySales: () => { salesTotal: number; ordersCount: number };
    getInvoices: (nit: string) => { invoices: Invoice[]; walletTotal: number };
    // Unified client search (GET /clientes/buscar/:nit)
    searchClient: (nit: string) => Promise<{ foundIn: "asignado" | "no_asignado" | null; client?: Client; visit?: Visit | null }>;
    getOrderById: (orderId: string) => Order | null;
    getTodayOrders: () => Order[];
}

const MockContext = createContext<MockContextType | undefined>(undefined);

export function MockProvider({ children }: { children: React.ReactNode }) {
    const [seller, setSeller] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [visits, setVisits] = useState<Visit[]>(MOCK_VISITS);
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [cartsByNit, setCartsByNit] = useState<Record<string, OrderItem[]>>(INITIAL_CARTS);
    const [activeClientNit, setActiveClientNit] = useState<string | null>(null);

    // 1. Load session from LocalStorage on mount
    useEffect(() => {
        const savedSeller = localStorage.getItem("pymo_seller");
        if (savedSeller) {
            try {
                const parsed = JSON.parse(savedSeller);
                setSeller(parsed);
                // Restore Bearer token for API calls
                if (parsed.token) {
                    setAuthToken(parsed.token);
                }
            } catch (e) {
                console.error("Failed to parse seller session", e);
                localStorage.removeItem("pymo_seller");
            }
        }

        // Load visits from LocalStorage
        const savedVisits = localStorage.getItem("pymo_visits");
        if (savedVisits) {
            try {
                setVisits(JSON.parse(savedVisits));
            } catch (e) {
                console.error("Failed to parse saved visits", e);
                localStorage.removeItem("pymo_visits");
            }
        }

        setIsLoading(false);
    }, []);

    // 2. Try loading products from real API (falls back to mock if unavailable)
    useEffect(() => {
        if (!seller) return; // Wait until logged in

        const loadProductsFromAPI = async () => {
            try {
                const res = await apiFetch("/productos");

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const data = await res.json();
                const apiProducts = data.productos;

                if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
                    throw new Error("Respuesta vacía o formato inválido");
                }

                // Map API fields → frontend Product type
                const mapped: Product[] = apiProducts.map((p: Record<string, unknown>) => ({
                    id: String(p.id || p.id_producto),
                    sku: String(p.sku || ""),
                    name: String(p.nombre || p.name || ""),
                    price: Number(p.precio || p.price || 0),
                    stock: Number(p.stock || 0),
                    description: String(p.descripcion || p.description || ""),
                    image: String(p.imagen_url || p.image || ""),
                    category: String(p.categoria || p.category || ""),
                }));

                setProducts(mapped);

            } catch {
                // Sin conexión al backend: se mantienen los datos mock (estado inicial).
            }
        };

        loadProductsFromAPI();
    }, [seller]);

    // Persist visits on change
    useEffect(() => {
        localStorage.setItem("pymo_visits", JSON.stringify(visits));
    }, [visits]);

    // Cart-driven visit status: auto-transition based on cart contents
    useEffect(() => {
        if (!activeClientNit) return;
        const visit = visits.find(v => v.clientNit === activeClientNit && v.sellerId === seller?.id && (v.status === "PENDING" || v.status === "IN_PROCESS"));
        if (!visit) return;

        if (cart.length > 0 && visit.status === "PENDING") {
            setVisits(prev => prev.map(v =>
                (v.clientNit === activeClientNit && v.sellerId === seller?.id) ? { ...v, status: "IN_PROCESS" as const } : v
            ));
        } else if (cart.length === 0 && visit.status === "IN_PROCESS") {
            setVisits(prev => prev.map(v =>
                (v.clientNit === activeClientNit && v.sellerId === seller?.id) ? { ...v, status: "PENDING" as const } : v
            ));
        }
    }, [cart, activeClientNit]);

    // Persist a logged-in seller (shared by real and mock login paths)
    const persistSeller = (sellerData: Seller) => {
        setSeller(sellerData);
        setAuthToken(sellerData.token ?? null); // Register token for apiFetch() headers
        localStorage.setItem("pymo_seller", JSON.stringify(sellerData));
    };

    /**
     * Login (token-based).
     *
     * 1. Tries real authentication against the Pymo bridge (POST /auth/login).
     *    The bridge returns a signed JWT that carries the id_vendedor.
     * 2. Only if the bridge is UNREACHABLE (no server yet, dev mode) it falls
     *    back to mock users. A real 401 from the bridge returns false — we never
     *    fall back to mock when a real bridge actively rejects the credentials.
     *
     * When the bridge is in production, remove MOCK_SELLERS and the fallback.
     */
    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ id_vendedor: username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                const sellerData: Seller = {
                    id: String(data.vendedor?.id ?? data.id ?? username),
                    name: String(data.vendedor?.nombre ?? data.nombre ?? ""),
                    username,
                    token: String(data.token ?? data.access_token ?? ""),
                };
                persistSeller(sellerData);
                return true;
            }

            // Bridge responded but rejected the credentials (e.g. 401): do NOT fall back.
            return false;
        } catch {
            // Bridge unreachable (no server connected yet) → mock fallback for dev.
            const found = MOCK_SELLERS.find((s) => s.username === username && s.password === password);
            if (found) {
                const { password: _pw, ...sellerData } = found;
                const mockToken = `mock_jwt_${sellerData.id}_${Date.now()}`;
                persistSeller({ ...sellerData, token: mockToken });
                return true;
            }
            return false;
        }
    };

    const logout = () => {
        setSeller(null);
        setAuthToken(null); // Clear Bearer token
        setCart([]);
        setCartsByNit({});
        setActiveClientNit(null);
        localStorage.removeItem("pymo_seller");
    };

    const addClient = (newClientData: Client): { nit: string; error?: string } => {
        // Check for active (non-COMPLETED) visit — allow new visit if only COMPLETED exists
        const activeVisit = visits.find(v => v.clientNit === newClientData.nit && v.sellerId === seller?.id && v.status !== "COMPLETED");
        if (activeVisit) {
            return { nit: "", error: `Ya tienes una visita activa con el cliente NIT ${newClientData.nit}` };
        }

        // Add client if not already in list
        const existingClient = clients.find(c => c.nit === newClientData.nit);
        if (!existingClient) {
            setClients((prev) => [...prev, newClientData]);
        } else {
            // Update existing client data
            setClients(prev => prev.map(c => c.nit === newClientData.nit ? { ...c, ...newClientData } : c));
        }

        // Auto-create a visit for the client
        const newVisit: Visit = {
            clientNit: newClientData.nit,
            sellerId: seller?.id || "unknown",
            date: new Date().toISOString(),
            status: "PENDING"
        }
        setVisits(prev => [newVisit, ...prev]);

        // Set as active so cart-driven status works
        setActiveClientNit(newClientData.nit);

        return { nit: newClientData.nit };
    };

    const updateClient = (nit: string, data: Partial<Omit<Client, "nit">>) => {
        setClients(prev => prev.map(c => c.nit === nit ? { ...c, ...data } : c));
    };

    const updateProductStock = (productId: string, quantity: number) => {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
    }

    const addToCart = (product: Product, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prev, { productId: product.id, quantity, price: product.price }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
    };

    const clearCart = () => setCart([]);

    // Save current cart (simulates PUT /clientes/:nit/carrito)
    const saveCart = (nit: string) => {
        const currentCart = [...cart];
        setCartsByNit(prev => ({ ...prev, [nit]: currentCart }));

        // Auto-transition visit status based on cart contents
        setVisits(prev => prev.map(v => {
            if (v.clientNit !== nit || v.sellerId !== seller?.id) return v;
            if (currentCart.length > 0 && v.status === "PENDING") {
                return { ...v, status: "IN_PROCESS" as const };
            }
            if (currentCart.length === 0 && v.status === "IN_PROCESS") {
                return { ...v, status: "PENDING" as const };
            }
            return v;
        }));
    };

    // Load a client's cart (simulates GET /clientes/:nit/carrito)
    const getCart = (nit: string): OrderItem[] => {
        return cartsByNit[nit] || [];
    };

    const addOrder = (orderData: Omit<Order, "id" | "date">): { orderId?: string; error?: string; detail?: { productName: string; available: number; requested: number } } => {
        // Validate stock for each item
        for (const item of orderData.items) {
            const product = products.find(p => p.id === item.productId);
            if (product && product.stock < item.quantity) {
                return {
                    error: `Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
                    detail: { productName: product.name, available: product.stock, requested: item.quantity }
                };
            }
        }

        const orderId = `ord-${Date.now()}`;
        const newOrder: Order = {
            ...orderData,
            id: orderId,
            date: new Date().toISOString(),
            status: "COMPLETED"
        };
        setOrders((prev) => [...prev, newOrder]);

        // Update stock
        orderData.items.forEach(item => {
            updateProductStock(item.productId, item.quantity);
        });

        // Clear the per-client cart
        if (activeClientNit) {
            setCartsByNit(prev => {
                const updated = { ...prev };
                delete updated[activeClientNit!];
                return updated;
            });
        }
        clearCart();

        return { orderId };
    };

    // Begin visit: track active client and load saved cart
    const beginVisit = (nit: string) => {
        setActiveClientNit(nit);
        const savedCart = cartsByNit[nit];
        if (savedCart && savedCart.length > 0) {
            setCart(savedCart);
        } else {
            setCart([]);
        }
    };

    // Complete the active visit
    const completeVisit = (): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (activeClientNit) {
                    setVisits(prev => prev.map(v =>
                        (v.clientNit === activeClientNit && v.sellerId === seller?.id && (v.status === "PENDING" || v.status === "IN_PROCESS"))
                            ? { ...v, status: "COMPLETED" as const }
                            : v
                    ));
                    setActiveClientNit(null);
                }
                resolve();
            }, 50);
        });
    };

    const cancelVisit = (nit: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setVisits(prev => prev.map(v =>
                    (v.clientNit === nit && v.sellerId === seller?.id && (v.status === "PENDING" || v.status === "IN_PROCESS"))
                        ? { ...v, status: "CANCELLED" as const }
                        : v
                ));
                // Clean cart if exists
                if (cartsByNit[nit]) {
                    setCartsByNit(prev => {
                        const updated = { ...prev };
                        delete updated[nit];
                        return updated;
                    });
                }
                resolve();
            }, 50);
        });
    };

    const reactivateVisit = (nit: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setVisits(prev => prev.map(v =>
                    (v.clientNit === nit && v.sellerId === seller?.id && v.status === "CANCELLED")
                        ? { ...v, status: "PENDING" as const }
                        : v
                ));
                setActiveClientNit(nit);
                const savedCart = cartsByNit[nit];
                if (savedCart && savedCart.length > 0) {
                    setCart(savedCart);
                } else {
                    setCart([]);
                }
                resolve();
            }, 50);
        });
    };

    const resetVisit = (nit: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                clearCart();
                setCartsByNit(prev => {
                    const updated = { ...prev };
                    delete updated[nit];
                    return updated;
                });
                setVisits(prev => prev.map(v =>
                    (v.clientNit === nit && v.sellerId === seller?.id && (v.status === "PENDING" || v.status === "IN_PROCESS"))
                        ? { ...v, status: "PENDING" as const }
                        : v
                ));
                setActiveClientNit(null);
                resolve();
            }, 50);
        });
    };

    // --- API-aligned helper functions ---

    // Simulates GET /pedidos/hoy
    const getTodaySales = (): { salesTotal: number; ordersCount: number } => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
        const myOrders = orders.filter(o => o.sellerId === seller?.id && new Date(o.date).toLocaleDateString('en-CA') === today);
        return {
            salesTotal: myOrders.reduce((sum, o) => sum + o.total, 0),
            ordersCount: myOrders.length,
        };
    };

    // Simulates GET /clientes/:nit/cartera
    const getInvoices = (nit: string): { invoices: Invoice[]; walletTotal: number } => {
        const invoiceIds = INVOICES_BY_CLIENT[nit] || [];
        const clientInvoices = MOCK_INVOICES.filter(inv => invoiceIds.includes(inv.id));
        const walletTotal = clientInvoices.reduce((sum, inv) => sum + inv.balance, 0);
        return { invoices: clientInvoices, walletTotal };
    };

    // Simulates GET /clientes/buscar/:nit (unified search)
    const searchClient = (nit: string): Promise<{ foundIn: "asignado" | "no_asignado" | null; client?: Client; visit?: Visit | null }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 1. Search assigned clients — prioritize active visits over COMPLETED
                const myActiveVisit = visits.find(v => v.clientNit === nit && v.sellerId === seller?.id && v.status !== "COMPLETED");
                const myCompletedVisit = visits.find(v => v.clientNit === nit && v.sellerId === seller?.id && v.status === "COMPLETED");
                const myVisit = myActiveVisit || myCompletedVisit;
                if (myVisit) {
                    const client = clients.find(c => c.nit === nit);
                    if (client) {
                        resolve({ foundIn: "asignado", client: { ...client }, visit: { ...myVisit } });
                        return;
                    }
                }

                // 2. Check if client exists in our local list (assigned to other vendors)
                const existingClient = clients.find(c => c.nit === nit);
                if (existingClient) {
                    resolve({ foundIn: "no_asignado", client: { ...existingClient } });
                    return;
                }

                // 3. Search all system clients (not assigned to any vendor)
                const systemClient = ALL_SYSTEM_CLIENTS[nit];
                if (systemClient) {
                    resolve({ foundIn: "no_asignado", client: { ...systemClient } });
                    return;
                }

                // 4. Not found anywhere
                resolve({ foundIn: null });
            }, 800);
        });
    };

    // Get a specific order by its ID (for VER RESUMEN)
    const getOrderById = (orderId: string): Order | null => {
        return orders.find(o => o.id === orderId && o.sellerId === seller?.id) || null;
    };

    const getTodayOrders = (): Order[] => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
        return orders.filter(o => o.sellerId === seller?.id && new Date(o.date).toLocaleDateString('en-CA') === today && o.status === "COMPLETED");
    };

    return (
        <MockContext.Provider value={{
            seller, isLoading, login, logout,
            clients, addClient, updateClient,
            products, updateProductStock,
            visits,
            orders, addOrder,
            cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
            saveCart, getCart,
            activeClientNit, beginVisit, completeVisit, cancelVisit, reactivateVisit, resetVisit,
            getTodaySales, getInvoices,
            searchClient, getOrderById, getTodayOrders
        }}>
            {children}
        </MockContext.Provider>
    );
}

export function useMock() {
    const context = useContext(MockContext);
    if (context === undefined) {
        throw new Error("useMock must be used within a MockProvider");
    }
    return context;
}
