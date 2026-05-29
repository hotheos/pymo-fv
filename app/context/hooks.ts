/**
 * Domain-specific hooks that provide focused subsets of MockContext.
 *
 * Instead of destructuring 15+ properties from `useMock()`, components
 * can import the hook for their specific domain:
 *
 *   useAuth()   → seller, login, logout, isLoading
 *   useCart()   → cart, addToCart, removeFromCart, updateCartQuantity, ...
 *   useVisits() → visits, beginVisit, completeVisit, cancelVisit, ...
 *   useOrders() → orders, addOrder, getTodaySales, getTodayOrders, ...
 *
 * These are thin wrappers over the existing MockContext. They add no state
 * of their own; they just narrow the interface for better readability and
 * autocomplete.
 */

import { useMock } from "./MockContext";

/** Authentication: seller session, login/logout */
export function useAuth() {
    const { seller, isLoading, login, logout } = useMock();
    return { seller, isLoading, login, logout };
}

/** Shopping cart operations (per-client NIT) */
export function useCart() {
    const {
        cart, addToCart, removeFromCart, updateCartQuantity,
        clearCart, saveCart, getCart, activeClientNit,
    } = useMock();
    return {
        cart, addToCart, removeFromCart, updateCartQuantity,
        clearCart, saveCart, getCart, activeClientNit,
    };
}

/** Visit lifecycle: begin, complete, cancel, reactivate, reset */
export function useVisits() {
    const {
        visits, activeClientNit, beginVisit, completeVisit,
        cancelVisit, reactivateVisit, resetVisit,
    } = useMock();
    return {
        visits, activeClientNit, beginVisit, completeVisit,
        cancelVisit, reactivateVisit, resetVisit,
    };
}

/** Orders, KPIs, and wallet/invoices */
export function useOrders() {
    const {
        orders, addOrder, getTodaySales, getTodayOrders,
        getOrderById, getInvoices,
    } = useMock();
    return {
        orders, addOrder, getTodaySales, getTodayOrders,
        getOrderById, getInvoices,
    };
}

/** Client management and search */
export function useClients() {
    const {
        clients, products, addClient, updateClient,
        updateProductStock, searchClient,
    } = useMock();
    return {
        clients, products, addClient, updateClient,
        updateProductStock, searchClient,
    };
}
