# 5. Catálogo de Productos y Detalle de Producto

---

## Parte A: Interfaz de Catálogo (Búsqueda y Listado)

**Archivo:** `app/catalog/page.tsx`

La prioridad de esta interfaz es la **velocidad de identificación** y una navegación fluida sin fricción, optimizada para entornos de movilidad.

---

### 5A.1 Layout General

- **Fondo:** `bg-[#F8FAFC] dark:bg-dark-900`
- **Layout:** `h-screen flex flex-col overflow-hidden`
- **Header:** Fijo (`flex-none z-20`)
- **Listado:** Scrollable (`flex-1 overflow-y-auto`)

---

### 5A.2 Cabecera Fija (Sticky Header)

```
┌─────────────────────────────────┐
│ [←]  Catálogo            [🛒 3] │
│                                 │
│ 🔍 Buscar por Nombre, SKU...   │
└─────────────────────────────────┘
```

| Elemento | Detalle |
|---|---|
| **Flecha de retorno** | `ArrowLeft` (24px), navega hacia atrás **y guarda el carrito** con `saveCart(nit)` |
| **Título** | "Catálogo", `text-lg font-bold text-slate-800 dark:text-slate-100` |
| **Carrito** | `ShoppingCart` (24px) con badge rojo del conteo de items |
| **Badge** | `absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full` |
| **Buscador** | Input con icono `Search` (20px), `bg-slate-100 dark:bg-dark-700 rounded-xl`, placeholder "Buscar por Nombre, SKU..." |

### Filtrado Reactivo
```typescript
const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
);
```
- Filtro **en tiempo real** por Nombre o SKU
- Sin debounce (búsqueda instantánea en el cliente)

### Persistencia del Carrito al Salir
Al presionar el botón de retorno, se ejecuta `saveCart(activeClientNit)` antes de navegar. Esto guarda el carrito actual en `cartsByNit[nit]` para que persista al regresar.

---

### 5A.3 Listado de Productos

```
┌─────────────────────────────────┐
│ ┌──────┐                        │
│ │ IMG  │ Leche Entera Alquería  │
│ │ 96x96│ LECHE-1L               │
│ └──────┘ $4.200    🟢DISPONIBLE │
└─────────────────────────────────┘
```

Cada producto se muestra como una tarjeta horizontal con:

| Elemento | Detalle |
|---|---|
| **Imagen** | `ProductImage` con fallback, `w-24 h-24 rounded-lg`, `object-cover` |
| **Nombre** | `font-bold text-slate-800 dark:text-slate-100 leading-tight` |
| **SKU** | `text-[10px] text-slate-400 font-mono` |
| **Precio** | `font-bold text-slate-900 dark:text-slate-100 text-lg`, formato `$X.XXX` con `toLocaleString()` |
| **Badge de stock** | Ver semáforo de stock abajo |

### Comportamiento de Click
- **Producto con stock > 0:** Abre `ProductSheet` (Bottom Sheet de detalle)
- **Producto agotado (stock = 0):** No hace nada / `opacity-70` visual

### Estilo de Tarjeta
- `flex items-start gap-4 p-3 rounded-xl border border-slate-100 dark:border-dark-600 shadow-sm bg-white dark:bg-dark-800`
- Efecto de toque: `active:scale-[0.98] transition-all`
- Agotados: `opacity-70` adicional

---

### 5A.4 Semáforo de Stock (Lógica de Negocio)

| Color | Condición | Badge | Comportamiento |
|---|---|---|---|
| 🟢 Verde | `stock >= 10` | `bg-emerald-100 text-emerald-700` "DISPONIBLE" | Permite agregar al carrito sin restricciones |
| 🟡 Amarillo | `stock > 0 && stock < 10` | `bg-amber-100 text-amber-700` "ÚLTIMAS UNIDADES" | Alerta visual, permite agregar con límite de stock |
| 🔴 Rojo | `stock === 0` | `bg-red-100 text-red-700` "AGOTADO" | **Bloqueo:** No se puede abrir el detalle ni agregar |

---

### 5A.5 Estado Vacío

Cuando el filtro no devuelve resultados:
- `text-center py-10 text-slate-400`: "No se encontraron productos."

---

### 5A.6 Componente ProductImage (Fallback)

**Archivo:** `app/components/ui/ProductImage.tsx`

Componente inteligente de imagen que maneja:
- URLs externas (Unsplash, etc.)
- URLs locales (`/products/...`)
- URLs rotas o nulas → Muestra placeholder con icono genérico
- Carga con skeleton loader

---

## Parte B: Detalle de Producto (Bottom Sheet)

**Archivo:** `app/components/ProductSheet.tsx` (146 líneas)

Bottom Sheet que emerge sobre el catálogo para la configuración rápida del producto antes de agregarlo al carrito.

---

### 5B.1 Entorno Visual

- **Overlay:** El catálogo de fondo tiene velo oscuro (`bg-black/50`) manejado por `BottomSheet.tsx`
- **Fondo del sheet:** `bg-white dark:bg-dark-900`
- **Cierre:** Clic en overlay o botón "X" circular
- **Animación:** Slide-up desde la base

---

### 5B.2 Estructura del Detalle

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │      IMAGEN HERO          │  │
│  │      (aspect-video)       │  │
│  └───────────────────────────┘  │
│                                 │
│  Leche Entera Alquería   $4.200│
│  [LECHE-1L] [🟢 Disponible: 50]│
│                                 │
│  ┌─ Descripción ────────────┐  │
│  │ Leche ultrapasteurizada, │  │
│  │ enriquecida con...       │  │
│  └──────────────────────────┘  │
│                                 │
│  [-]  5  [+]          $21.000  │
│                                 │
│  ┌────────────────────────────┐ │
│  │ 🛒  AGREGAR AL PEDIDO      │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

---

### 5B.3 Elementos del Detalle

| Elemento | Detalle |
|---|---|
| **Imagen Hero** | `aspect-video bg-slate-100 dark:bg-dark-700 rounded-xl`, `ProductImage` con `object-cover` |
| **Nombre** | `text-xl font-bold text-slate-800 dark:text-slate-100` (izquierda) |
| **Precio Unitario** | `font-bold text-slate-900 dark:text-slate-100 text-xl` (derecha) |
| **SKU** | `bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded` |
| **Status de Stock** | Verde: "Disponible: X" / Rojo: "Agotado" |
| **Descripción** | Bloque con `bg-slate-50 dark:bg-dark-700 rounded-xl p-4`, `text-slate-600 dark:text-slate-300` |

---

### 5B.4 Selector de Cantidad y Calculadora

```
  [-]   5   [+]                $21.000
```

| Lado | Elemento | Detalle |
|---|---|---|
| **Izquierda** | Botón `-` | `w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700`, `active:scale-95` |
| **Centro** | Input numérico | `w-16 text-center text-xl font-bold bg-transparent`, editable manualmente |
| **Izquierda** | Botón `+` | Mismo estilo, **deshabilitado** cuando `quantity >= stock` |
| **Derecha** | Total de línea | `text-2xl font-black text-slate-900 dark:text-slate-100` |

### Lógica del Selector
- **Incremento:** Limitado al stock disponible
- **Input manual:** Corrección automática si excede stock (resetea al máximo)
- **On blur:** Si queda vacío o 0, resetea a 1
- **Cálculo en tiempo real:** `total = product.price * safeQuantity`

---

### 5B.5 Botón de Acción: Agregar al Pedido

- **Estilo:** `bg-tenant-gradient` (gradiente dinámico del tenant), `shadow-high`, `rounded-xl py-4`
- **Icono:** `ShoppingCart` (20px) a la izquierda del texto
- **Texto:** "AGREGAR AL PEDIDO" (uppercase, font-bold, text-lg)
- **Deshabilitado:** Si `stock === 0` → `bg-slate-300`, sin sombra
- **Efecto:** `active:scale-95 transition-transform`

### Lógica de Agregado
- Si el producto ya está en el carrito, **suma** la nueva cantidad a la existente
- Tras agregar, cierra el sheet y retorna al catálogo

---

### 5B.6 Modelo de Datos del Producto

```typescript
interface Product {
    id: string;          // ID único
    sku: string;         // Código SKU
    name: string;        // Nombre del producto
    price: number;       // Precio unitario (COP)
    stock: number;       // Unidades disponibles
    description: string; // Descripción técnica
    image: string;       // URL de imagen
    category: string;    // Categoría
}
```
