import { describe, it, expect } from 'vitest';
import { validateStock } from '../../app/context/business-logic';
import { MOCK_PRODUCTS } from '../../app/data/mock-data';
import type { Product, OrderItem } from '../../app/types';

describe('Validación de Stock', () => {
    // Use a fresh copy of products for each test
    const products: Product[] = JSON.parse(JSON.stringify(MOCK_PRODUCTS));

    it('rechaza venta de producto con stock 0', () => {
        // p3 (Aceite) tiene stock: 0
        const items: OrderItem[] = [{ productId: 'p3', quantity: 1, price: 15500 }];
        const error = validateStock(products, items);

        expect(error).not.toBeNull();
        expect(error!.detail.available).toBe(0);
        expect(error!.detail.requested).toBe(1);
        expect(error!.detail.productName).toBe('Aceite Gourmet Girasol 1L');
    });

    it('rechaza cuando cantidad > stock', () => {
        // p5 (Galletas) tiene stock: 5
        const items: OrderItem[] = [{ productId: 'p5', quantity: 10, price: 4500 }];
        const error = validateStock(products, items);

        expect(error).not.toBeNull();
        expect(error!.detail.available).toBe(5);
        expect(error!.detail.requested).toBe(10);
    });

    it('acepta cuando cantidad === stock', () => {
        // p5 (Galletas) tiene stock: 5
        const items: OrderItem[] = [{ productId: 'p5', quantity: 5, price: 4500 }];
        const error = validateStock(products, items);

        expect(error).toBeNull();
    });

    it('acepta cuando cantidad < stock', () => {
        // p1 (Leche) tiene stock: 50
        const items: OrderItem[] = [{ productId: 'p1', quantity: 3, price: 4200 }];
        const error = validateStock(products, items);

        expect(error).toBeNull();
    });

    it('valida múltiples items y falla en el primero sin stock', () => {
        const items: OrderItem[] = [
            { productId: 'p1', quantity: 2, price: 4200 },  // OK (stock: 50)
            { productId: 'p3', quantity: 1, price: 15500 },  // FALLA (stock: 0)
            { productId: 'p6', quantity: 5, price: 6800 },  // OK (stock: 45)
        ];
        const error = validateStock(products, items);

        expect(error).not.toBeNull();
        expect(error!.detail.productName).toBe('Aceite Gourmet Girasol 1L');
    });

    it('acepta lista vacía de items', () => {
        const error = validateStock(products, []);
        expect(error).toBeNull();
    });

    it('ignora productos que no existen en el catálogo', () => {
        const items: OrderItem[] = [{ productId: 'inexistente', quantity: 100, price: 999 }];
        const error = validateStock(products, items);

        // Si el producto no existe, no hay stock que validar; la validación pasa.
        expect(error).toBeNull();
    });
});
