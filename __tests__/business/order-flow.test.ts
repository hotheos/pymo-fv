import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder } from '../../app/context/business-logic';
import { MOCK_PRODUCTS } from '../../app/data/mock-data';
import type { Product, OrderItem } from '../../app/types';

describe('Flujo de Creación de Orden', () => {
    let products: Product[];

    beforeEach(() => {
        // Fresh copy for each test (stock mutations don't leak)
        products = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
    });

    it('crea una orden exitosamente con items válidos', () => {
        const items: OrderItem[] = [
            { productId: 'p1', quantity: 2, price: 4200 },
            { productId: 'p6', quantity: 3, price: 6800 },
        ];

        const { result, newOrder } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 28800, status: 'COMPLETED' },
            products
        );

        expect(result.error).toBeUndefined();
        expect(result.orderId).toBeDefined();
        expect(result.orderId).toMatch(/^ord-/);
        expect(newOrder).toBeDefined();
    });

    it('genera orderId único con prefijo "ord-"', async () => {
        const items: OrderItem[] = [{ productId: 'p1', quantity: 1, price: 4200 }];

        const { result: r1 } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 4200, status: 'COMPLETED' },
            products
        );

        // Small delay to ensure different Date.now() timestamps
        await new Promise(resolve => setTimeout(resolve, 2));

        const { result: r2 } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 4200, status: 'COMPLETED' },
            products
        );

        expect(r1.orderId).toMatch(/^ord-\d+$/);
        expect(r2.orderId).toMatch(/^ord-\d+$/);
        // IDs deberían ser distintos (basados en timestamp)
        expect(r1.orderId).not.toBe(r2.orderId);
    });

    it('marca la orden como COMPLETED', () => {
        const items: OrderItem[] = [{ productId: 'p1', quantity: 1, price: 4200 }];

        const { newOrder } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 4200, status: 'COMPLETED' },
            products
        );

        expect(newOrder!.status).toBe('COMPLETED');
    });

    it('descuenta stock correctamente después de crear la orden', () => {
        const items: OrderItem[] = [
            { productId: 'p1', quantity: 5, price: 4200 },  // stock: 50 → 45
            { productId: 'p2', quantity: 3, price: 2800 },  // stock: 8 → 5
        ];

        const { updatedProducts } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 29400, status: 'COMPLETED' },
            products
        );

        const p1 = updatedProducts!.find(p => p.id === 'p1')!;
        const p2 = updatedProducts!.find(p => p.id === 'p2')!;

        expect(p1.stock).toBe(45);
        expect(p2.stock).toBe(5);
    });

    it('no modifica stock de productos que no están en la orden', () => {
        const items: OrderItem[] = [{ productId: 'p1', quantity: 1, price: 4200 }];

        const { updatedProducts } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 4200, status: 'COMPLETED' },
            products
        );

        // p6 (Atún) debería mantener su stock original: 45
        const p6 = updatedProducts!.find(p => p.id === 'p6')!;
        expect(p6.stock).toBe(45);
    });

    it('rechaza orden cuando stock es insuficiente', () => {
        const items: OrderItem[] = [
            { productId: 'p3', quantity: 1, price: 15500 },  // stock: 0
        ];

        const { result, newOrder, updatedProducts } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 15500, status: 'COMPLETED' },
            products
        );

        expect(result.error).toBeDefined();
        expect(result.detail).toBeDefined();
        expect(result.detail!.available).toBe(0);
        expect(newOrder).toBeUndefined();
        expect(updatedProducts).toBeUndefined();
    });

    it('incluye fecha ISO en la orden creada', () => {
        const items: OrderItem[] = [{ productId: 'p1', quantity: 1, price: 4200 }];

        const { newOrder } = createOrder(
            { sellerId: 's1', clientNit: '900123456', items, total: 4200, status: 'COMPLETED' },
            products
        );

        expect(newOrder!.date).toBeDefined();
        // Verifica que sea una fecha ISO válida
        expect(new Date(newOrder!.date).toISOString()).toBe(newOrder!.date);
    });
});
