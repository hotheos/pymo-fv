export interface Seller {
    id: string;
    name: string;
    username: string; // ID Vendedor for login
    token?: string;   // JWT from POST /auth/login — used as Bearer token
}

export interface Client {
    nit: string;       // Primary key — unique business identifier
    name: string;
    phone: string;
    address: string;
    email?: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    image: string;
    category: string;
}

export interface Visit {
    clientNit: string;   // PK — identifies the visit (1 vendor + 1 client + 1 day = 1 visit)
    sellerId: string;
    date: string;        // ISO String
    status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';
}

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number; // Snapshot of price at time of order (precio_unitario in API)
}

export interface Order {
    id: string;
    sellerId: string;
    clientNit: string;
    items: OrderItem[];
    total: number;
    date: string;
    status: 'COMPLETED';
}

export interface CartItem {
    productId: string;
    name: string;
    sku: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Invoice {
    id: string;
    number: string;       // numero_factura
    date: string;
    total: number;         // valor_total
    totalPaid: number;     // total_abonado
    balance: number;       // saldo (calculated by backend)
}

/** Visit with embedded client data, as returned by GET /visitas */
export interface VisitWithClient extends Visit {
    client: Client;
}
