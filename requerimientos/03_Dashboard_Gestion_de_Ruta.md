# 3. Dashboard: Gestión de Ruta (Vista Principal)

**Archivo:** `app/page.tsx` (~680 líneas)

El Dashboard es el centro de control operativo del vendedor. Presenta KPIs, monitor de ventas, acción de identificación de cliente, y la gestión completa de visitas del día organizadas por pestañas (móvil) o columnas simultáneas (escritorio).

---

## 3.1 Layout General

- **Fondo:** `bg-white dark:bg-dark-900` (con transición)
- **Layout:** `h-screen flex flex-col overflow-hidden` (viewport completo, sin scroll del body)
- **Contenido Scrollable:** Componente `PullToRefresh` que envuelve todo el contenido debajo del header
- **Scrollbar:** Invisible (definido en `globals.css` para todos los elementos)

---

## 3.2 Cabecera (Header Fijo)

El header se adapta según el viewport:

### Móvil

```
┌──────────────────────────────────────┐
│ [Logo] [🔄] [🌙] [🎨]    Carlos M.  │
└──────────────────────────────────────┘
```

### Escritorio

```
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo] │ [🔄] [🌙] [🎨] │ [🔍 Identificar Cliente] │ 💼 Ventas Hoy │ Carlos M. │
└───────────────────────────────────────────────────────────────────────┘
```

| Elemento | Posición | Detalle |
|---|---|---|
| **Logo Pymo** | Izquierda | `/logo.png` (light) o `/logo-white.png` (dark), `h-[32px]`, object-contain |
| **Botón Refresh** | Junto al logo | Icono `RotateCw` (18px), `animate-spin` mientras refresca |
| **Botón Dark Mode** | Junto al refresh | `Sun` (18px) en dark / `Moon` (18px) en light |
| **Color Picker** | Junto al dark mode | Botón circular con gradiente del tenant, abre paleta de 16 colores (temporal) |
| **Identificar Cliente** | Solo desktop | Botón con gradiente, icono `Fingerprint`, texto "Identificar Cliente" |
| **Ventas de Hoy** | Solo desktop | Widget inline con icono `Wallet` + monto formateado |
| **Nombre Vendedor** | Derecha | `text-sm font-bold text-slate-600 dark:text-slate-300` |

### Estilos del Header
- `bg-white dark:bg-dark-900 sticky top-0 z-50`
- Padding: `px-[15px] lg:px-8 pt-[20px] lg:pt-4 pb-[10px] lg:pb-4`
- Borde inferior: `border-b border-slate-200 dark:border-transparent` con `shadow-sm`

### Pull-to-Refresh
- Componente `react-simple-pull-to-refresh`
- Al tirar hacia abajo, se simula un re-fetch (1500ms de delay)
- CSS custom en `globals.css` para colapsar el spacing interno del componente PTR

### Color Picker (Temporal)
- 16 colores predefinidos en grid 4x4
- Al seleccionar, actualiza las variables CSS del tenant en tiempo real
- Incluye regeneración automática de la paleta dark mode
- Marcado como `TEMP` en el código, pensado para remoción futura

### Restricciones de UI
- **Sin menú hamburguesa** (eliminado intencionalmente)
- **Sin campana de notificaciones** (eliminado intencionalmente)
- **Auto-focus agresivo:** Se fuerza el focus al scroll container para asegurar que el pull-to-refresh funcione al regresar

---

## 3.3 Panel de Indicadores (KPIs)

### Móvil: Grid 2x2

```
┌─────────────┐ ┌─────────────┐
│   📅 8      │ │   🔄 1      │
│ Por visitar │ │  Visitando  │
└─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│   🚫 3      │ │   ✅ 2      │
│ Canceladas  │ │ Finalizadas │
└─────────────┘ └─────────────┘
```

### Escritorio: Integrado en cabeceras de columnas

En desktop, los KPIs se muestran como cabeceras de las 4 columnas de visitas (ver sección 3.6).

| KPI | Icono | Color | Fuente de datos |
|---|---|---|---|
| **Por visitar** | `CalendarClock` | Amber-500 | Visitas de hoy con status `PENDING` |
| **Visitando** | `Loader2` (animated) | Blue-500 | Visitas de hoy con status `IN_PROCESS` |
| **Canceladas** | `Ban` | Red-500 | Visitas de hoy con status `CANCELLED` |
| **Finalizadas** | `CheckCircle2` | Emerald-500 | **Pedidos** del día (`getTodayOrders().length`) |

> **Importante:** Los KPIs solo cuentan visitas/pedidos de **hoy**. Las visitas de días anteriores aparecen en la lista pero no inflan los contadores.

> **Nota:** El KPI "Finalizadas" se basa en el conteo de **pedidos** del día (no visitas COMPLETED), permitiendo múltiples pedidos por cliente.

### Estilo de las Tarjetas KPI (Móvil)
- `bg-white dark:bg-dark-800 p-4 rounded-xl shadow-high`
- Aspecto: `aspect-[4/3]`
- Centrado: `flex flex-col items-center justify-center`
- Cifra: `text-3xl font-extrabold text-slate-800 dark:text-slate-100`
- Etiqueta: `text-[10px] font-bold text-slate-400 uppercase tracking-wider`

---

## 3.4 Monitor de Ventas (Banner — Solo Móvil)

```
┌─────────────────────────────────┐
│ 💼  VENTAS DE HOY               │
│  $210.900                       │
└─────────────────────────────────┘
```

- **Estilo:** Tarjeta `bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-high` con layout horizontal
- **Icono:** `Wallet` (22px) en circulo `bg-primary/10`
- **Texto:** Etiqueta en `text-[10px] font-bold opacity-80 uppercase tracking-wider`, cifra en `text-2xl font-black`
- **Formato:** Moneda colombiana `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`
- **Fuente de datos:** Función `getTodaySales()` del contexto

> En desktop, la venta del día se muestra inline en el header (no como banner separado).

### Endpoint de Producción
```
GET /finalizadas
Authorization: Bearer <token>

Response: { "pedidos": [...] }
```

El frontend calcula `ventas_total = SUM(pedido.total)` localmente.

---

## 3.5 Acción Prioritaria: Identificar Cliente

### Móvil
```
┌─────────────────────────────────┐
│  🔍  Identificar Cliente        │
└─────────────────────────────────┘
```

- **Estilo:** `bg-tenant-gradient` ancho completo, `rounded-2xl`, `shadow-lg shadow-primary/20`, `active:scale-95`
- **Acción:** Abre `NewClientSheet` como Bottom Sheet

### Escritorio
- Botón compacto en el header, con gradiente + icono `Fingerprint` + texto "Identificar Cliente"
- Separado visualmente con divisores verticales

---

## 3.6 Gestión de Visitas

### Separación Hoy / Anteriores

Las visitas se dividen temporalmente:
- **Hoy:** Visitas con la fecha de hoy
- **Anteriores:** Visitas `PENDING` o `IN_PROCESS` de **días anteriores** que nunca se completaron ni cancelaron

Cada grupo se muestra con un separador visual:
```
[Tarjetas de hoy]
────── ⏰ Anteriores (2) ──────
[Tarjetas de días anteriores con badge de fecha "Mar 7"]
```

### Móvil: Sistema de 4 Pestañas

```
  Por visitar  |  Visitando  |  Canceladas  |  Finalizadas
  ─────────────────────────────────────────────────────────
```

- **Estilo activo:** `text-black dark:text-white font-bold border-b-2 border-black dark:border-white`
- **Estilo inactivo:** `text-slate-400 font-medium`
- **Estado vacío:** Mensaje personalizado por pestaña

### Escritorio: 4 Columnas Simultáneas

En pantallas `lg` y superiores, las pestañas se reemplazan por 4 columnas visibles simultáneamente:

```
┌──────────┬───────────┬───────────┬───────────┐
│📅 Por    │🔄 Visitando│🚫 Cancela-│✅ Finaliza-│
│  visitar │           │  das      │  das       │
├──────────┼───────────┼───────────┼───────────┤
│ [cards]  │ [cards]   │ [cards]   │ [cards]   │
└──────────┴───────────┴───────────┴───────────┘
```

Cada columna tiene:
- Cabecera con icono en circulo coloreado + KPI numérico + etiqueta
- Borde inferior coloreado (amber, blue, red, emerald)
- Separador vertical entre columnas (`border-l`)
- Sección "Anteriores" con separador y badges de fecha

---

## 3.7 Tarjetas de Visita (por estado)

### Estructura de la Tarjeta

```
┌────────────────────────────────────┐
│ Tienda La Esquina                  │
│ Calle 123 # 45-67                  │
│                                    │
│ [💼] [📞] [🧹] [🗑️]  ──────────── │
│                                    │
│ ┌────────────────────────────────┐ │
│ │       COMENZAR VISITA          │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Nombre del cliente** | `font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight` |
| **Dirección** | `text-xs text-slate-500 dark:text-slate-400 font-medium` |

### Botones de Acción Rápida (Iconos Circulares)

| Icono | Acción | Visibilidad |
|---|---|---|
| `Wallet` (💼) | Abre modal de cartera con facturas del cliente | Siempre visible |
| `Phone` (📞) | Dispara llamada telefónica | Siempre visible |
| `Eraser` (🧹) | Vacía el carrito y resetea la visita a PENDING | Solo en IN_PROCESS |
| `Trash2` (🗑️) | Cancela la visita | PENDING e IN_PROCESS |

### Botones de Acción Principal (por estado)

| Estado | Botón(es) | Acción |
|---|---|---|
| **PENDING** | "COMENZAR VISITA" | `beginVisit(nit)` → navegar a `/catalog` |
| **IN_PROCESS** | "CONTINUAR VISITA" | `beginVisit(nit)` → navegar a `/catalog` con carrito guardado |
| **CANCELLED** | "REACTIVAR VISITA" | `reactivateVisit(nit)` → navegar a `/catalog` |

### Responsividad de Iconos
Los iconos tienen tamaños adaptativos:
- Móvil: `w-10 h-10`, iconos de 18px
- Desktop: `lg:w-8 lg:h-8`, iconos de 14px (ocultos/visibles con `lg:hidden` / `hidden lg:block`)

---

## 3.8 Tarjetas de Pedidos Finalizados

La pestaña/columna "Finalizadas" muestra **pedidos del día**, no visitas. Cada tarjeta tiene estructura diferente:

```
┌────────────────────────────────────┐
│ Tienda La Esquina        10:30 AM  │
│ Calle 123 # 45-67                  │
│                                    │
│ [💼] [📞]          Total $93.500   │
│                                    │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ VER RESUMEN  │ │ NUEVA VISITA │ │
│ └──────────────┘ └──────────────┘ │
└────────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Hora** | `toLocaleTimeString('es-CO', { hour, minute })` |
| **Total** | Formato COP, alineado a la derecha junto a etiqueta "Total" |
| **VER RESUMEN** | Abre `VisitSummarySheet` con el orderId |
| **NUEVA VISITA** | Crea una nueva visita con el mismo cliente y navega al catálogo |

---

## 3.9 Transiciones de Estado de Visitas

```
              beginVisit + cart items
 ┌─────────┐ ─────────────────────────> ┌────────────┐ checkout ┌───────────┐
 │ PENDING │                            │ IN_PROCESS │ ──────>  │ COMPLETED │
 └─────────┘ <───────────────────────── └────────────┘          └───────────┘
              cart vacío (auto)
                    │                        │
                    │    cancelVisit          │  cancelVisit
                    v                        v
              ┌────────────┐
              │ CANCELLED  │
              └────────────┘
                    │
                    │  reactivateVisit
                    v
              ┌─────────┐
              │ PENDING  │
              └─────────┘
```

### Reglas de Transición
1. **Cart-Driven:** Si el carrito tiene items y la visita está `PENDING` → auto-transición a `IN_PROCESS`; carrito vacío → regresa a `PENDING`
2. **Reset de Visita:** Botón `Eraser` ejecuta `resetVisit(nit)` → limpia carrito + regresa a PENDING
3. `saveCart(nit)` también ejecuta transiciones automáticas

### Persistencia
- Las visitas se persisten en `localStorage` (`pymo_visits`) para sobrevivir recargas
- Los carritos por NIT se mantienen en memoria (`cartsByNit`) durante la sesión

---

## 3.10 Modal de Cartera (WalletModal)

**Archivo:** `app/components/WalletModal.tsx` (~76 líneas)

Se activa al presionar el icono 💼 en cualquier tarjeta de visita o pedido.

### Endpoint de Producción
```
GET /clientes/:nit/cartera
Authorization: Bearer <token>
```

### Contenido
- Lista de facturas con: número, fecha, total, abonado, saldo
- Código de colores: Rojo = pendiente, Verde = pagada
- Banner inferior con **Cartera Total** (gradiente del tenant)
- Estado vacío: "Sin facturas pendientes"

### Modelo de Datos
```typescript
interface Invoice {
    id: string;
    number: string;       // numero_factura
    date: string;
    total: number;         // valor_total
    totalPaid: number;     // total_abonado
    balance: number;       // saldo
}
```

---

## 3.11 Componente VisitSummarySheet

**Archivo:** `app/components/VisitSummarySheet.tsx` (155 líneas)

Bottom Sheet que muestra el resumen completo de una visita finalizada. Se abre desde el botón "VER RESUMEN" en las tarjetas de pedidos finalizados.

### Contenido
- **Info del cliente:** Nombre, NIT, dirección, con icono `CheckCircle2` verde
- **Fecha del pedido:** Formateada en español, con ID del pedido
- **Lista de productos:** Miniatura, nombre, SKU, cantidad, subtotal
- **Total del pedido:** En tarjeta con gradiente del tenant
- **Botones de acción:**
  - "Descargar PDF" → Genera PDF con `generateOrderPDF()` de `orderSharing.ts`
  - "WhatsApp" → Envía resumen por WhatsApp con `shareOrderWhatsApp()` de `orderSharing.ts`

---

## 3.12 Pie de Página

- Logo de Apolosoft (`/apolosoft.png` en light, `/apolosoft-white.png` en dark), 140px, centrado, `opacity-50`
