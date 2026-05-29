import { describe, it, expect, beforeEach } from 'vitest';
import { searchClientInAllSources, calculateTodaySales, getTodayOrdersForSeller, getClientInvoices } from '../../app/context/business-logic';
import { MOCK_CLIENTS, createMockVisits, createMockOrders, MOCK_INVOICES, INVOICES_BY_CLIENT, ALL_SYSTEM_CLIENTS } from '../../app/data/mock-data';
import type { Visit, Order, Client } from '../../app/types';

describe('Gestión de Visitas', () => {
    let visits: Visit[];
    let clients: Client[];

    beforeEach(() => {
        visits = createMockVisits();
        clients = JSON.parse(JSON.stringify(MOCK_CLIENTS));
    });

    // --- Visit State Transitions ---

    it('una visita PENDING existe para el vendedor s1 y cliente 900123456', () => {
        const pendingVisit = visits.find(
            v => v.clientNit === '900123456' && v.sellerId === 's1' && v.status === 'PENDING'
        );
        expect(pendingVisit).toBeDefined();
    });

    it('una visita IN_PROCESS existe para el vendedor s1 y cliente 1020304050', () => {
        const inProcessVisit = visits.find(
            v => v.clientNit === '1020304050' && v.sellerId === 's1' && v.status === 'IN_PROCESS'
        );
        expect(inProcessVisit).toBeDefined();
    });

    it('cancelar una visita cambia status a CANCELLED', () => {
        // Simular cancelación (lógica pura: mapear estado)
        const nit = '900123456';
        const sellerId = 's1';
        const updated = visits.map(v =>
            (v.clientNit === nit && v.sellerId === sellerId && (v.status === 'PENDING' || v.status === 'IN_PROCESS'))
                ? { ...v, status: 'CANCELLED' as const }
                : v
        );

        const cancelled = updated.find(v => v.clientNit === nit && v.sellerId === sellerId);
        expect(cancelled!.status).toBe('CANCELLED');
    });

    it('reactivar una visita CANCELLED la devuelve a PENDING', () => {
        const nit = '123123123'; // Cliente cancelado de s1
        const sellerId = 's1';

        // Verificar que está cancelada
        const before = visits.find(v => v.clientNit === nit && v.sellerId === sellerId);
        expect(before!.status).toBe('CANCELLED');

        // Reactivar
        const updated = visits.map(v =>
            (v.clientNit === nit && v.sellerId === sellerId && v.status === 'CANCELLED')
                ? { ...v, status: 'PENDING' as const }
                : v
        );

        const reactivated = updated.find(v => v.clientNit === nit && v.sellerId === sellerId);
        expect(reactivated!.status).toBe('PENDING');
    });

    it('completar una visita cambia status a COMPLETED', () => {
        const nit = '1020304050';
        const sellerId = 's1';

        const updated = visits.map(v =>
            (v.clientNit === nit && v.sellerId === sellerId && (v.status === 'PENDING' || v.status === 'IN_PROCESS'))
                ? { ...v, status: 'COMPLETED' as const }
                : v
        );

        const completed = updated.find(v => v.clientNit === nit && v.sellerId === sellerId);
        expect(completed!.status).toBe('COMPLETED');
    });

    it('reset de visita vuelve IN_PROCESS a PENDING', () => {
        const nit = '1020304050';
        const sellerId = 's1';

        const updated = visits.map(v =>
            (v.clientNit === nit && v.sellerId === sellerId && (v.status === 'PENDING' || v.status === 'IN_PROCESS'))
                ? { ...v, status: 'PENDING' as const }
                : v
        );

        const reset = updated.find(v => v.clientNit === nit && v.sellerId === sellerId);
        expect(reset!.status).toBe('PENDING');
    });

    // --- Client Search ---

    it('busca cliente asignado al vendedor', () => {
        const result = searchClientInAllSources('900123456', visits, clients, 's1', ALL_SYSTEM_CLIENTS);

        expect(result.foundIn).toBe('asignado');
        expect(result.client).toBeDefined();
        expect(result.client!.name).toBe('Tienda La Esquina');
        expect(result.visit).toBeDefined();
    });

    it('busca cliente no asignado (existe en sistema)', () => {
        const result = searchClientInAllSources('555666777', visits, clients, 's1', ALL_SYSTEM_CLIENTS);

        expect(result.foundIn).toBe('no_asignado');
        expect(result.client).toBeDefined();
        expect(result.client!.name).toBe('DISTRIBUIDORA CENTRAL');
    });

    it('devuelve null para cliente inexistente', () => {
        const result = searchClientInAllSources('000000000', visits, clients, 's1', ALL_SYSTEM_CLIENTS);

        expect(result.foundIn).toBeNull();
        expect(result.client).toBeUndefined();
    });

    it('prioriza visita activa sobre completada al buscar', () => {
        // Agregar una visita COMPLETED y una PENDING para el mismo cliente/vendedor
        const testVisits: Visit[] = [
            { clientNit: '900123456', sellerId: 's1', date: new Date().toISOString(), status: 'COMPLETED' },
            { clientNit: '900123456', sellerId: 's1', date: new Date().toISOString(), status: 'PENDING' },
        ];

        const result = searchClientInAllSources('900123456', testVisits, clients, 's1', ALL_SYSTEM_CLIENTS);

        expect(result.foundIn).toBe('asignado');
        expect(result.visit!.status).toBe('PENDING'); // Prioriza la activa
    });
});

describe('KPIs y Cálculos', () => {
    let orders: Order[];

    beforeEach(() => {
        orders = createMockOrders();
    });

    it('calcula ventas del día para vendedor s1', () => {
        const { salesTotal, ordersCount } = calculateTodaySales(orders, 's1');

        // s1 tiene 3 órdenes hoy: 93500 + 74400 + 57100 = 225000
        expect(ordersCount).toBe(3);
        expect(salesTotal).toBe(225000);
    });

    it('calcula ventas del día para vendedor s2', () => {
        const { salesTotal, ordersCount } = calculateTodaySales(orders, 's2');

        // s2 tiene 1 orden hoy: 128200
        expect(ordersCount).toBe(1);
        expect(salesTotal).toBe(128200);
    });

    it('devuelve 0 para vendedor sin órdenes', () => {
        const { salesTotal, ordersCount } = calculateTodaySales(orders, 'inexistente');

        expect(ordersCount).toBe(0);
        expect(salesTotal).toBe(0);
    });

    it('filtra solo órdenes COMPLETED de hoy', () => {
        const todayOrders = getTodayOrdersForSeller(orders, 's1');

        expect(todayOrders.length).toBe(3);
        todayOrders.forEach(o => {
            expect(o.status).toBe('COMPLETED');
            expect(o.sellerId).toBe('s1');
        });
    });

    it('consulta cartera de cliente con facturas', () => {
        const { invoices, walletTotal } = getClientInvoices('900123456', MOCK_INVOICES, INVOICES_BY_CLIENT);

        // Cliente 900123456 tiene inv-1 (balance 0) e inv-2 (balance 80000)
        expect(invoices.length).toBe(2);
        expect(walletTotal).toBe(80000);
    });

    it('devuelve cartera vacía para cliente sin facturas', () => {
        const { invoices, walletTotal } = getClientInvoices('000000000', MOCK_INVOICES, INVOICES_BY_CLIENT);

        expect(invoices.length).toBe(0);
        expect(walletTotal).toBe(0);
    });
});
