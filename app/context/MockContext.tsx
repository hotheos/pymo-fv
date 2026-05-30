"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Seller, Client, Product, Visit, Order, OrderItem, Invoice } from "../types";
import { apiFetch, setAuthToken } from "@/config/api";

// Extracted modules
import {
    MOCK_SELLERS, MOCK_CLIENTS, MOCK_PRODUCTS,
    createMockVisits, createMockOrders, INITIAL_CARTS,
    MOCK_INVOICES, INVOICES_BY_CLIENT, ALL_SYSTEM_CLIENTS,
} from "../data/mock-data";
import {
    validateStock, createOrder as createOrderLogic,
    calculateTodaySales, getTodayOrdersForSeller,
    getClientInvoices, searchClientInAllSources,
    type CreateOrderResult,
} from "./business-logic";

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
    addOrder: (order: Omit<Order, "id" | "date">) => CreateOrderResult;
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
    const [visits, setVisits] = useState<Visit[]>(createMockVisits());
    const [orders, setOrders] = useState<Order[]>(createMockOrders());
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

            } catch (err) {
                // Sin conexión al backend: se mantienen los datos mock (estado inicial).
                console.warn("[MockContext] Backend no disponible, usando datos mock:", err instanceof Error ? err.message : err);
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
     *    back to mock users. A real 401 from the bridge returns false.
     */
    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ id_vendedor: username, password }),
            });

            if (res.ok) {
                // Contrato del puente: { token, perfil: { id_vendedor, nombre_vendedor } }
                const data = await res.json();
                const perfil = data.perfil ?? data.vendedor ?? {};
                const sellerData: Seller = {
                    id: String(perfil.id_vendedor ?? perfil.id ?? data.id ?? username),
                    name: String(perfil.nombre_vendedor ?? perfil.nombre ?? data.nombre ?? ""),
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
        // Check for active (non-COMPLETED) visit
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

    const addOrder = (orderData: Omit<Order, "id" | "date">): CreateOrderResult => {
        // Use extracted pure business logic
        const { result, newOrder, updatedProducts } = createOrderLogic(orderData, products);

        if (result.error || !newOrder || !updatedProducts) {
            return result;
        }

        setOrders((prev) => [...prev, newOrder]);
        setProducts(updatedProducts);

        // Clear the per-client cart
        if (activeClientNit) {
            setCartsByNit(prev => {
                const updated = { ...prev };
                delete updated[activeClientNit!];
                return updated;
            });
        }
        clearCart();

        return result;
    };

    // Begin visit: track active client and load saved cart
    const beginVisit = (nit: string) => {
        setActiveClientNit(nit);
        const savedCart = cartsByNit[nit];
        if (savedCart && savedCart.length > 0) {
            setCart(savedCart.map(item => ({ ...item })));
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
                    setCart(savedCart.map(item => ({ ...item })));
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

    // --- API-aligned helper functions (delegate to pure logic) ---

    const getTodaySales = () => calculateTodaySales(orders, seller?.id || "");

    const getInvoices = (nit: string) => getClientInvoices(nit, MOCK_INVOICES, INVOICES_BY_CLIENT);

    const searchClient = (nit: string): Promise<{ foundIn: "asignado" | "no_asignado" | null; client?: Client; visit?: Visit | null }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = searchClientInAllSources(nit, visits, clients, seller?.id || "", ALL_SYSTEM_CLIENTS);
                resolve(result);
            }, 800);
        });
    };

    const getOrderById = (orderId: string): Order | null => {
        return orders.find(o => o.id === orderId && o.sellerId === seller?.id) || null;
    };

    const getTodayOrders = (): Order[] => getTodayOrdersForSeller(orders, seller?.id || "");

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
