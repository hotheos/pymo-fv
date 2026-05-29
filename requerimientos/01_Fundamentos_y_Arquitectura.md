# 1. Fundamentos y Arquitectura del Proyecto

## 1.1 Identidad del Proyecto

- **Nombre:** Pymo — Fuerza de Ventas
- **Tipo:** Aplicación web responsiva (Mobile-First + Desktop)
- **Extensión oficial del ERP Mekano** (sistema contable colombiano)
- **Desarrollado por:** Apolosoft

---

## 1.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Framework** | Next.js (App Router) | 14.1.0 |
| **Lenguaje** | TypeScript | ^5 |
| **UI Framework** | React | ^18 |
| **Estilos** | Tailwind CSS | ^3.3.0 |
| **Iconografía** | Lucide React | ^0.344.0 |
| **Generación PDF** | jsPDF + jspdf-autotable | ^4.1.0 / ^5.0.7 |
| **Utilidades CSS** | clsx, tailwind-merge | ^2.1.0, ^2.2.1 |
| **Pull-to-Refresh** | react-simple-pull-to-refresh | ^1.3.4 |
| **Tipografía** | Inter (Google Fonts) | — |

---

## 1.3 Arquitectura Multi-Tenant

Pymo opera como una **aplicación web única** desplegada en un servidor central, que sirve a **múltiples clientes/tenants** mediante subdominios.

### Modelo de Operación

```
                   ┌─── fruggy.pymo.com ──→ ERP Mekano (Fruggy local)
Pymo (servidor) ───┼─── distri.pymo.com  ──→ ERP Mekano (Distribuidora local)
                   └─── demo.pymo.com    ──→ ERP Mekano (Demo local)
```

| Concepto | Implementación |
|---|---|
| **Routing** | Subdomain-based via Next.js `middleware.ts` |
| **Resolución** | `TenantContext.tsx` resuelve el slug del subdomain |
| **Desarrollo** | Query param `?tenant=xxx` para simular subdominios en localhost |
| **Autenticación** | Token (JWT) emitido por el puente Pymo en login. Sin API key en el cliente (ver [docs/ARQUITECTURA_SEGURIDAD.md](../docs/ARQUITECTURA_SEGURIDAD.md)) |
| **API Base URL** | Cada tenant tiene su propia URL al puente Pymo (que fronta al ERP Mekano local) |

### Middleware (Edge)

**Archivo:** `middleware.ts` (55 líneas)

Extrae el slug del subdomain del request y lo inyecta como header `x-tenant-slug` para uso downstream.

### TenantContext

**Archivo:** `app/context/TenantContext.tsx` (193 líneas)

Cada tenant en el registro incluye:

| Campo | Descripción |
|---|---|
| `slug` | Identificador único del tenant |
| `name` | Nombre de la empresa |
| `tagline` | Subtítulo (ej. "Fuerza de Ventas") |
| `logo` | Ruta de logo |
| `primaryColor` | Color primario para theming |
| `gradientFrom` / `gradientTo` | Colores del gradiente de acción |
| `apiBaseUrl` | URL del ERP Mekano local del tenant |
| `supportPhone` | Teléfono de soporte |

Al resolverse el tenant, el contexto:
1. Configura la URL base de la API (`setTenantApiConfig`)
2. Inyecta variables CSS para theming dinámico (`--tenant-primary`, `--tenant-gradient-from`, `--tenant-gradient-to`)
3. Genera una paleta dark mode tintada por el color primario del tenant (HSL derivado)

---

## 1.4 Infraestructura de Datos

- **Backend de Datos:** ERP Mekano (cada tenant tiene su instancia local)
- **Autenticación:** JWT via API del backend. El frontend guarda token en memoria.
- **API Backend:** RESTful, documentada en `docs/API_BACKEND.md` (~1700 líneas)
  - **Base URL:** Configurable por tenant (ver sección 1.3)
  - **Formato:** JSON (request y response)
  - **Autenticación:** Bearer Token (`Authorization: Bearer <JWT>`) emitido por el puente Pymo. Sin API key en el cliente.
  - **Idioma API:** Nombres en español con snake_case (`cliente_nit`, `precio_unitario`)
  - **Idioma Frontend:** Nombres en inglés con camelCase (`clientNit`, `unitPrice`)

---

## 1.5 Cliente API Centralizado

**Archivo:** `app/config/api.ts` (120 líneas)

Módulo singleton que centraliza toda la configuración y comunicación con el backend:

| Función | Descripción |
|---|---|
| `setTenantApiConfig(url)` | Configura la URL base del tenant actual |
| `getBaseUrl()` | Retorna la URL efectiva (tenant → env → default) |
| `setAuthToken(token)` | Almacena el JWT post-login |
| `getAuthToken()` | Obtiene el JWT actual |
| `apiUrl(path)` | Construye URL completa del endpoint |
| `apiHeaders(extra)` | Genera headers estándar (Content-Type, Authorization: Bearer) |
| `apiFetch(path, options)` | Wrapper de `fetch` con configuración automática |

---

## 1.6 Estrategia de Sincronización

| Dirección | Descripción |
|---|---|
| **Inbound (Mekano → Pymo)** | Pymo consume datos del ERP local del tenant vía API REST. Productos, precios, stock, clientes y visitas se leen del backend. |
| **Outbound (Pymo → Mekano)** | Pymo escribe datos (nuevos clientes, pedidos, carritos) directamente al backend del tenant. |

---

## 1.7 Capa de Mapeo API (`apiMapper.ts`)

**Archivo:** `app/utils/apiMapper.ts` (160 líneas)

Traducción bidireccional entre la API (español/snake_case) y el frontend (inglés/camelCase):

### Mappers de Lectura (API → Frontend)

| Función | Descripción |
|---|---|
| `mapSeller(api)` | Convierte perfil de vendedor |
| `mapClient(api)` | Convierte datos de cliente |
| `mapProduct(api)` | Convierte producto con stock, imagen, categoría |
| `mapVisit(api)` | Convierte visita con estado |
| `mapVisitWithClient(api)` | Visita con datos de cliente embebidos |
| `mapCartItem(api)` | Convierte item de carrito |
| `mapInvoice(api)` | Convierte factura/cartera |
| `mapSearchClientResponse(api)` | Búsqueda unificada de cliente (3 escenarios) |
| `mapOrderResponse(api)` | Respuesta del checkout (pedido + visita) |
| `mapVisitStatusResponse(api)` | Respuesta de cambio de estado de visita |
| `mapSaveCartResponse(api)` | Respuesta de guardado de carrito |

### Mappers de Escritura (Frontend → API)

| Función | Descripción |
|---|---|
| `toApiCartItems(items)` | Prepara items para POST/PUT |
| `toApiOrderPayload(order)` | Payload de checkout |
| `toApiNewClient(client)` | Payload de nuevo cliente |
| `toApiUpdateClient(data)` | Payload de actualización parcial |

---

## 1.8 Sistema de Temas (Dark Mode)

**Archivo:** `app/context/ThemeContext.tsx` (49 líneas)

| Característica | Detalle |
|---|---|
| **Temas** | `light` y `dark` |
| **Persistencia** | `localStorage` (`pymo-theme`) |
| **Detección inicial** | Usa `prefers-color-scheme` del sistema si no hay preferencia guardada |
| **Clase CSS** | Toggle de clase `dark` en `<html>` |
| **Toggle** | Botón Sun/Moon en el header del Dashboard |
| **Fondos dark** | Tintados por el hue del color primario del tenant (generados por `TenantContext`) |

### Variables CSS de Dark Mode

Generadas dinámicamente por `TenantContext.generateDarkPalette()`:

| Variable | Lightness | Uso |
|---|---|---|
| `--dark-950` | 4% | Body background |
| `--dark-900` | 7% | Main container bg |
| `--dark-800` | 12% | Cards, surfaces |
| `--dark-700` | 18% | Elevated surfaces, inputs |
| `--dark-600` | 25% | Borders, dividers |

---

## 1.9 Arquitectura de Estado (MockContext — Actual)

**Archivo:** `app/context/MockContext.tsx` (~690 líneas)

Actualmente, la aplicación opera con un **MockContext** que simula todas las llamadas API con datos locales. Este contexto provee:

- **Autenticación:** Login/logout con persistencia en `localStorage`
- **Datos Mock:** Vendedores, clientes, productos (17 items), visitas, órdenes, facturas
- **Gestión de Carrito:** Por cliente (NIT), con persistencia entre navegaciones
- **Gestión de Visitas:** Estados PENDING → IN_PROCESS → COMPLETED / CANCELLED
- **Transiciones Automáticas:** El carrito controla el estado de la visita
- **Ventas del Día:** Cálculo en tiempo real de totales
- **Carga de Productos API:** Función `loadProductsFromAPI()` conecta con el backend real para cargar productos

> **Nota de Migración:** Al conectar completamente con la API real, el MockContext debe reemplazarse por un servicio de API que use los mappers de `apiMapper.ts` y el `apiFetch` de `api.ts`.

---

## 1.10 Estructura de Archivos del Proyecto

```
Pymo/
├── app/
│   ├── page.tsx                        # Dashboard (Vista Principal, ~680 líneas)
│   ├── layout.tsx                      # Layout con ThemeProvider > TenantProvider > MockProvider
│   ├── globals.css                     # Estilos globales + variables CSS tenant + scrollbar invisible
│   ├── login/page.tsx                  # Pantalla de Login
│   ├── catalog/page.tsx                # Catálogo de Productos
│   ├── cart/page.tsx                   # Carrito + Éxito + PDF (~476 líneas)
│   ├── components/
│   │   ├── NewClientSheet.tsx          # Bottom Sheet: Identificación/Registro de Cliente (~576 líneas)
│   │   ├── ProductSheet.tsx            # Bottom Sheet: Detalle de Producto (146 líneas)
│   │   ├── VisitSummarySheet.tsx       # Bottom Sheet: Resumen de visita finalizada (155 líneas)
│   │   ├── WalletModal.tsx             # Modal: Cartera del Cliente (~76 líneas)
│   │   └── ui/
│   │       ├── BottomSheet.tsx         # Componente reutilizable Bottom Sheet
│   │       └── ProductImage.tsx        # Imagen con fallback
│   ├── config/
│   │   └── api.ts                      # Cliente API centralizado multi-tenant (120 líneas)
│   ├── context/
│   │   ├── MockContext.tsx             # Contexto Mock: estado global (~690 líneas)
│   │   ├── TenantContext.tsx           # Contexto Multi-Tenant (193 líneas)
│   │   └── ThemeContext.tsx            # Contexto Dark/Light Mode (49 líneas)
│   ├── types/
│   │   └── index.ts                    # Interfaces TypeScript
│   └── utils/
│       ├── apiMapper.ts               # Mapeo API ↔ Frontend (~160 líneas)
│       └── orderSharing.ts            # Generación PDF + compartir WhatsApp (~157 líneas)
├── docs/
│   └── API_BACKEND.md                 # Especificación completa de API (~1700 líneas)
├── middleware.ts                       # Edge Middleware: subdomain routing (55 líneas)
├── public/
│   ├── logo.png                       # Logo de Pymo (light mode)
│   ├── logo-white.png                 # Logo de Pymo (dark mode)
│   ├── login.png                      # Logo para pantalla de login
│   ├── apolosoft.png                  # Logo de Apolosoft (light mode)
│   ├── apolosoft-white.png            # Logo de Apolosoft (dark mode)
│   └── fav.ico                        # Favicon
├── requerimientos/                    # Documentación de requerimientos (este directorio)
├── tailwind.config.ts                 # Config Tailwind con colores, sombras y dark mode custom
├── .env.example                       # Plantilla de variables de entorno
├── .env.local                         # Variables de entorno del tenant actual (no se sube a git)
├── package.json                       # Dependencias del proyecto
└── Requerimientos_ Pymo.md            # Requerimientos originales (documento histórico)
```

---

## 1.11 Propósito Técnico

Maximizar el rendimiento operativo (*performance*) y garantizar la continuidad del flujo de venta (acceso a clientes, productos y precios) en escenarios de conectividad limitada o alta latencia, proporcionando al vendedor en calle una herramienta ágil, profesional y completa para gestionar su ruta diaria.

La arquitectura multi-tenant permite desplegar una sola instancia para múltiples empresas clientes, donde cada una accede a su propio ERP Mekano local a través de subdominios dedicados, con theming y configuración independiente.
