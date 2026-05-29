# 6. Módulo de Carrito: Revisión y Check-out

**Archivo:** `app/cart/page.tsx` (~476 líneas)

A diferencia de una aplicación de consumo masivo, este carrito está diseñado para la **agilidad operativa** y la **edición masiva** en tiempo real.

---

## 6.1 Layout General

- **Fondo:** `bg-slate-50 dark:bg-dark-900 min-h-screen` (con transición)
- **Header:** Sticky `top-0`, fondo `bg-white dark:bg-dark-900` con sombra
- **Contenido:** Scroll libre con `pb-32` (espacio para el footer fijo)
- **Footer:** Fijo en la base (`fixed bottom-0`) con sombra superior
- **Responsivo:** `lg:grid lg:grid-cols-2 lg:gap-4` para listado en desktop

---

## 6.2 Cabecera Funcional

```
┌─────────────────────────────────┐
│ [←]  Resumen del Pedido         │
└─────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Flecha de retroceso** | `ArrowLeft` (24px), `router.back()` |
| **Título** | "Resumen del Pedido", `text-lg font-bold text-slate-800 dark:text-slate-100` |

### Regla de Oro — Persistencia del Carrito
Al volver al catálogo, el estado del carrito **no se limpia**. Los productos seleccionados persisten en memoria (`cartsByNit[nit]`) y en el state del contexto.

---

## 6.3 Listado de Ítems

```
┌────────────────────────────────────┐
│ ┌──────┐                     [🗑️] │
│ │ IMG  │ Leche Entera Alquería     │
│ │64x64 │ LECHE-1L                  │
│ └──────┘                           │
│          [-] 5 [+] ⚠ Disp: 8  $21k│
└────────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Miniatura** | `ProductImage`, `w-16 h-16 bg-slate-100 dark:bg-dark-700 rounded-lg` |
| **Nombre** | `font-bold text-slate-800 dark:text-slate-100 text-sm` |
| **SKU** | `text-xs text-slate-500 font-mono` |
| **Icono de eliminar** | `Trash2` (18px), `text-slate-300 hover:text-red-500` |
| **Botones ±** | `w-8 h-8 bg-white dark:bg-dark-600 shadow rounded`, dentro de `bg-slate-50 dark:bg-dark-700 rounded-lg p-1` |
| **Cantidad** | `font-bold text-slate-800 dark:text-slate-100 w-4 text-center` |
| **Subtotal de línea** | `font-bold text-slate-800 dark:text-slate-100`, `$X.XXX` |

### Badge de Stock Inline
Si la cantidad en carrito excede el stock actual, se muestra un badge de advertencia **junto a los botones ±**:

```
[-] 15 [+] ⚠ Disp: 8
```

| Condición | Badge |
|---|---|
| `item.quantity > product.stock` y stock > 0 | `⚠ Disp: X` en `bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400` |
| `item.quantity > product.stock` y stock = 0 | `⚠ Sin stock` |

### Estilo de Tarjeta
- `bg-white dark:bg-dark-800 p-4 rounded-xl shadow-card flex items-start gap-4`

---

## 6.4 Estado Vacío

```
Tu carrito está vacío.
```
- `text-center py-20 text-slate-400`

---

## 6.5 Footer Fijo con Cálculos y Alertas

El footer tiene 3 posibles estados de alerta, más el total y el botón:

### Alerta 1: Stock Insuficiente (Rojo)

Si hay items cuyo stock actual es menor que la cantidad en carrito:

```
┌────────────────────────────────────┐
│ 🔴  2 productos sin stock          │
│     suficiente                     │
│                        [NIVELAR]   │
└────────────────────────────────────┘
```

- Muestra el conteo de products con problemas de stock
- Botón **"NIVELAR"** con gradiente rojo → ajusta automáticamente todas las cantidades al stock disponible, elimina items con stock 0

### Alerta 2: Carrito No Guardado (Ámbar)

Si el carrito tiene items y no hay problemas de stock:

```
┌────────────────────────────────────┐
│ ⚠  Carrito no guardado            │
│    Finaliza el pedido o vuelve     │
│    al dashboard para guardar.      │
└────────────────────────────────────┘
```

### Alerta 3: Error de Checkout (Rojo)

Si al hacer checkout un producto no tiene suficiente stock (validación del backend):

```
┌────────────────────────────────────┐
│ 🔴  Stock insuficiente para       │
│     'Arroz Diana'. Disponible: 8,  │
│     solicitado: 15                 │
│     Toca para cerrar               │
└────────────────────────────────────┘
```

### Total y Botón

```
┌────────────────────────────────────┐
│ Total a Pagar         $210.900     │
│                                    │
│ ┌────────────────────────────────┐ │
│ │       FINALIZAR PEDIDO         │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Etiqueta** | "Total a Pagar", `text-slate-400 font-bold text-sm uppercase` |
| **Total** | `text-3xl font-black text-slate-800 dark:text-slate-100`, formato `$X.XXX` |
| **Botón** | "FINALIZAR PEDIDO", `bg-tenant-gradient`, `py-4 rounded-xl font-bold text-lg shadow-high` |
| **Footer bg** | `bg-white dark:bg-dark-800 border-t border-slate-100 dark:border-dark-600` |
| **Footer sombra** | `shadow-[0_-10px_40px_rgba(0,0,0,0.1)]` |

### Botón deshabilitado
Cuando el carrito está vacío: `disabled:bg-none disabled:bg-slate-300 disabled:shadow-none`

---

## 6.6 Lógica de Nivelación de Stock

```typescript
const handleNivelar = () => {
    stockIssues.forEach(item => {
        if (item.product!.stock === 0) {
            removeFromCart(item.productId);      // Eliminar items sin stock
        } else {
            updateCartQuantity(item.productId, item.product!.stock);  // Ajustar al máximo
        }
    });
};
```

Esta función se ejecuta al presionar "NIVELAR" y:
1. **Elimina** del carrito cualquier producto con stock = 0
2. **Reduce** la cantidad de cada producto al máximo stock disponible
3. La interfaz se actualiza automáticamente reflejando los nuevos valores

---

## 6.7 Lógica de Checkout

```typescript
const handleCheckout = () => {
    // 1. Verificar carrito no vacío
    if (cart.length === 0) return;

    // 2. Guardar backup del carrito
    saveCart(activeClientNit);

    // 3. Crear orden con validación de stock
    const result = addOrder({
        sellerId: seller.id,
        clientNit: activeClientNit,
        items: cart,
        total: total,
        status: "COMPLETED"
    });

    // 4. Si stock error → mostrar alerta, NO proceder
    if (result.error) {
        setStockError({ message, productName, available, requested });
        return;
    }

    // 5. Completar visita → COMPLETED
    completeVisit();

    // 6. Guardar snapshot para pantalla de éxito
    setFinalOrder({ items, total, clientName, clientNit, clientAddress, clientPhone });

    // 7. Mostrar pantalla de éxito
    setIsSuccess(true);
};
```

### Side Effects del Checkout Exitoso
1. **Stock decrementado:** Cada producto reduce su `stock` por la cantidad vendida
2. **Carrito limpiado:** Se elimina el carrito activo y el carrito persistido por NIT
3. **Visita completada:** El estado de la visita pasa a `COMPLETED`
4. **Orden creada:** Se agrega a la lista de órdenes con timestamp

### Endpoint de Producción
```
POST /pedidos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nit": "900123456",
  "items": [
    { "producto_id": "p1", "cantidad": 5, "precio_unitario": 4200 }
  ],
  "total": 21000
}
```

---

## 6.8 Modelo de Datos

```typescript
interface OrderItem {
    productId: string;
    quantity: number;
    price: number;     // Snapshot del precio al momento del pedido
}

interface Order {
    id: string;
    sellerId: string;
    clientNit: string;
    items: OrderItem[];
    total: number;
    date: string;       // ISO String
    status: 'COMPLETED';
}

interface CartItem {
    productId: string;
    name: string;
    sku: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}
```
