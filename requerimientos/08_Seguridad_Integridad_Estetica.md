# 8. Reglas de Seguridad, Integridad y Estética

---

## 8.1 Seguridad de Acceso (API)

El sistema es **implacablemente privado**. La seguridad opera en múltiples capas.

### Autenticación Dual

| Nivel | Mecanismo | Descripción |
|---|---|---|
| **Tenant** | `X-API-Key` header | Master API key que identifica a Pymo como consumidor autorizado |
| **Vendedor** | `Authorization: Bearer <JWT>` | Token JWT con `id_vendedor` embebido |

### Filtro Maestro del Token
El `id_vendedor` dentro del JWT es el **filtro maestro**. Todas las consultas del backend deben extraer el `id_vendedor` del token. **Nunca confiar en un `id_vendedor` enviado en el body.**

### Políticas de Seguridad (Backend)

| Tabla | Filtro | Descripción |
|---|---|---|
| `py_clientes` | `vendedor_id = id_del_token` | Solo ver clientes asignados al vendedor |
| `py_visitas` | `vendedor_id = id_del_token` | Solo ver/modificar visitas propias |
| `py_pedidos` | `vendedor_id = id_del_token` | Solo ver/crear pedidos propios |
| `py_detalles_pedido` | Via JOIN con pedidos | Acceso indirecto a través del pedido |
| `py_carrito` | `vendedor_id = id_del_token` | Solo ver/modificar su propio carrito |

### Filtro en Frontend (Complementario)
```typescript
const myVisits = visits.filter(v => v.sellerId === seller?.id);
const myOrders = orders.filter(o => o.sellerId === seller?.id);
```

### Resultado
Un vendedor **jamás** podrá listar, leer, editar o eliminar información de un cliente o pedido que no tenga su `vendedor_id` asociado.

---

## 8.2 Validación Estricta de Datos (Formularios)

El formulario de identificación/registro de cliente es la puerta de entrada de datos al ERP Mekano.

### Validaciones Implementadas

| Campo | Regla | Validación |
|---|---|---|
| **NIT / Cédula** | Solo numérico, 5-15 dígitos | `regex: /^[0-9]{5,15}$/` |
| **Razón Social** | Mín. 3 caracteres, solo caracteres permitidos | `regex: /^[a-záéíóúñ0-9\s.,&\-'#]+$/i` |
| **Teléfono** | Exactamente 10 dígitos numéricos | `regex: /^[0-9]{10}$/` |
| **Dirección** | Mínimo 5 caracteres | Longitud verificada |
| **Email** | Formato email válido (solo si se proporciona) | Regex de email estándar |

### Bloqueo de Envío
- El botón "GUARDAR Y EMPEZAR PEDIDO" permanece **deshabilitado** si:
  - Los campos obligatorios (*) están vacíos
  - Hay errores de validación en cualquier campo

### Feedback Visual de Validación

| Estado | Borde | Indicador |
|---|---|---|
| Sin interacción | `border-slate-200` | Ninguno |
| Válido | `border-emerald-400` | ✅ Checkmark verde |
| Inválido | `border-red-400` | ❌ Mensaje de error rojo |

### Sanitización
- `trim()` en todos los campos antes de inserción
- El NIT se limpia de caracteres no numéricos

### Prevención de Duplicados
```typescript
const existingVisit = visits.find(v => v.clientNit === nit && v.sellerId === seller?.id);
if (existingVisit) {
    return { error: `Ya tienes una visita con el cliente NIT ${nit}` };
}
```

---

## 8.3 Blindaje de Inventario (Manejo de Stock)

Para evitar la venta de productos sin stock real, se implementan **4 capas de validación más nivelación automática**.

### Capa 1: Catálogo (UI)

| Regla | Implementación |
|---|---|
| Producto agotado no se puede abrir | `if (product.stock > 0) setSelectedProduct(product)` |
| Badge visual de agotado | `bg-red-100 text-red-700 "AGOTADO"` |
| Opacidad reducida | `opacity-70` en productos sin stock |

### Capa 2: Detalle de Producto (Selector)

| Regla | Implementación |
|---|---|
| Botón + deshabilitado al alcanzar stock | `disabled={safeQuantity >= product.stock}` |
| Input manual limitado | `if (num > product.stock) setQuantity(product.stock)` |
| Corrección automática | Si se ingresa valor > stock, se resetea al máximo disponible |
| Botón "Agregar" deshabilitado sin stock | `disabled={!isStockAvailable}` |

### Capa 3: Carrito (Detección y Nivelación)

| Regla | Implementación |
|---|---|
| Detección proactiva de problemas | Se compara `item.quantity` vs `product.stock` actual para cada item |
| Badge inline de advertencia | "⚠ Disp: X" o "⚠ Sin stock" junto a los botones ± |
| Botón NIVELAR | Ajusta automáticamente todas las cantidades al stock disponible |
| Eliminación de agotados | Items con stock = 0 se eliminan al nivelar |
| Alerta visual | Banner rojo en footer con conteo de items con problemas |

### Capa 4: Checkout (Validación Final)

| Regla | Implementación |
|---|---|
| Validación item por item | Se compara `item.quantity` vs `product.stock` actual |
| Error descriptivo | "Stock insuficiente para 'X'. Disponible: Y, solicitado: Z" |
| Bloqueo de checkout | Si cualquier item falla, **no se procesa el pedido** |
| Descuento de stock post-checkout | `stock = stock - quantity` para cada item vendido |

### Capa 5: Backend (Producción)
El backend debe realizar una **validación final** del stock antes de crear la orden, incluso si el frontend ya validó, para prevenir condiciones de carrera.

---

## 8.4 Directrices de Diseño y Estética

### Sistema de Colores — Dinámico por Tenant

Los colores principales se definen como **variables CSS** inyectadas por `TenantContext`:

| Variable CSS | Default | Uso |
|---|---|---|
| `--tenant-primary` | `#4B91E2` | Color primario de la marca |
| `--tenant-gradient-from` | `#49B1F5` | Inicio del gradiente de acción |
| `--tenant-gradient-to` | `#7477D8` | Fin del gradiente de acción |

### Clase CSS Global

```css
.bg-tenant-gradient {
    background: linear-gradient(135deg, var(--tenant-gradient-from), var(--tenant-gradient-to));
}
```

Todos los botones de acción principales usan `bg-tenant-gradient` en vez de colores hardcodeados.

### Colores Fijos (No Temáticos)

| Token | Valor Hex | Uso |
|---|---|---|
| **Background** | `#F8FAFC` | Fondo del catálogo (light mode) |
| **Surface** | `#FFFFFF` | Fondo de tarjetas (light mode) |

### Dark Mode

| Variable CSS | Lightness | Uso |
|---|---|---|
| `--dark-950` | 4% | Body background (tintado por hue del tenant) |
| `--dark-900` | 7% | Main container bg |
| `--dark-800` | 12% | Cards, surfaces |
| `--dark-700` | 18% | Elevated surfaces, inputs |
| `--dark-600` | 25% | Borders, dividers |

> **Nota:** Los fondos dark mode están **tintados** por el hue del color primario del tenant. Esto crea una armonía visual — un tenant verde tendrá fondos ligeramente verdosos en dark mode.

### Sistema de Sombras (Definición Tailwind)

| Nombre | Uso |
|---|---|
| `shadow-high` | Tarjetas de visita, KPIs (efecto 3D) |
| `shadow-card` | Tarjetas del carrito, monto de éxito |

### Regla de Bordes Redondeados

| Elemento | Valor |
|---|---|
| Tarjetas de visita | `rounded-[20px]` |
| Banners y botones principales | `rounded-2xl` (16px) |
| Inputs y tarjetas menores | `rounded-xl` (12px) |
| Badges | `rounded-full` |

### Tipografía

| Uso | Clases |
|---|---|
| KPIs (cifras) | `text-3xl font-extrabold` |
| Total de ventas | `text-4xl font-black` (mobile) / `text-lg font-black` (desktop) |
| Nombre de cliente | `text-lg font-bold` (mobile) / `text-base` (desktop) |
| Etiquetas | `text-[10px] font-bold uppercase tracking-wider` |
| SKU | `text-[10px] font-mono` |

### Navegación

| Regla | Detalle |
|---|---|
| **Sin Bottom Navigation Bar** | El flujo es un túnel lineal |
| **Sin menú hamburguesa** | Eliminado intencionalmente |
| **Sin campana de notificaciones** | Eliminado intencionalmente |
| **Sin barra de estado de red** | No se muestra indicador de conectividad |

### Scrollbar Invisible
```css
* {
    scrollbar-width: none;
    -ms-overflow-style: none;
}
*::-webkit-scrollbar {
    display: none;
}
```

### Interacciones Táctiles

| Efecto | Clase |
|---|---|
| Toque en botones | `active:scale-95 transition-transform` |
| Toque en tarjetas del catálogo | `active:scale-[0.98] transition-all` |
| Hover en iconos | `hover:bg-primary/20 transition-colors` |

### Logos Dinámicos por Tema

| Asset | Light Mode | Dark Mode |
|---|---|---|
| Logo Pymo | `/logo.png` | `/logo-white.png` |
| Logo Apolosoft | `/apolosoft.png` | `/apolosoft-white.png` |

---

## 8.5 Layout Responsivo

La aplicación tiene dos modos de presentación, controlados por breakpoints de Tailwind:

### Móvil (< lg)
- Header compacto con iconos
- KPIs en grid 2x2
- Banner de ventas como tarjeta independiente
- Botón "Identificar Cliente" como tarjeta de ancho completo
- Visitas en pestañas (una a la vez)
- Carrito en lista vertical

### Escritorio (lg+)
- Header expandido con "Identificar Cliente" inline, ventas inline, separadores verticales
- KPIs integrados en cabeceras de columnas
- 4 columnas simultáneas para visitas (Por visitar | Visitando | Canceladas | Finalizadas)
- Carrito en grid de 2 columnas
- Iconos de acción más pequeños (`lg:w-8 lg:h-8`)

### Contenedor Principal

```html
<div class="max-w-md lg:max-w-7xl mx-auto min-h-screen bg-white dark:bg-dark-900 shadow-2xl lg:shadow-none">
```

- Móvil: Contenido limita a `max-w-md` (448px) con sombra lateral
- Desktop: Se expande a `max-w-7xl` (1280px) sin sombra

---

## 8.6 Flujo de Navegación Completo

```
                                    ┌── Búsqueda NIT
                                    │   ├── Asignado → Catálogo (visita existente)
Login → Dashboard ──┬── Identificar │   ├── No asignado → Formulario pre-llenado → Catálogo
                    │   Cliente     │   └── No encontrado → Formulario vacío → Catálogo
                    │               │
                    ├── Tab "Por visitar" → Comenzar visita → Catálogo
                    ├── Tab "Visitando" → Continuar visita → Catálogo
                    ├── Tab "Canceladas" → Reactivar → Catálogo
                    └── Tab "Finalizadas" → VER RESUMEN (Bottom Sheet) / NUEVA VISITA → Catálogo

Catálogo → Producto (Bottom Sheet) → Agregar al carrito → Catálogo
       └── Carrito → Checkout → Éxito → PDF + WhatsApp → Dashboard
```

### Flujo Lineal (Túnel de Venta)
```
Dashboard ──→ Catálogo ──→ Carrito ──→ Éxito ──→ Dashboard
    ↑             ↑  ↓                              │
    │             └──┘ (ida y vuelta preservando     │
    │                    estado del carrito)          │
    └────────────────── Hard Reset ──────────────────┘
```
