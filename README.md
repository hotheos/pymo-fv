# Pymo - Fuerza de Ventas

Aplicación de fuerza de ventas para vendedores en campo. Permite gestionar visitas a clientes, crear pedidos desde un catálogo de productos, generar PDFs de pedidos y compartir resúmenes por WhatsApp.

## Requisitos Previos

- **Node.js** 18+ (se incluye una instalación local en `.node/`)
- **npm** 9+

## Instalación

```bash
# Si tienes Node.js instalado globalmente:
npm install

# Si usas la instalación local incluida:
export PATH="$PWD/.node/bin:$PATH"
npm install
```

## Variables de Entorno

Copiar el archivo de ejemplo y ajustar los valores:

```bash
cp .env.example .env.local
```

Variables principales:
- `NEXT_PUBLIC_API_BASE_URL`: URL base del puente Pymo (default: `http://localhost:8000/api`)

> **Nota:** Sin un backend conectado, la app funciona en modo mock con datos de demostración.

## Desarrollo Local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

**Credenciales de prueba (modo mock):**
- Usuario: `1`, Contraseña: `1` (Carlos Mendoza)
- Usuario: `2`, Contraseña: `2` (Andrea Ríos)

## Scripts Disponibles

| Comando           | Descripción                                     |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Servidor de desarrollo con hot reload           |
| `npm run build`   | Build de producción                             |
| `npm run start`   | Servidor de producción (requiere build previo)  |
| `npm run lint`    | Linter ESLint                                   |
| `npm run check`   | Lint + verificación de tipos TypeScript          |
| `npm test`        | Pruebas automáticas (Vitest)                    |
| `npm run test:watch` | Pruebas en modo watch (re-ejecuta al cambiar)  |

## Estructura del Proyecto

```
app/
├── page.tsx                    # Dashboard principal (visitas, KPIs)
├── layout.tsx                  # Layout raíz con providers
├── globals.css                 # Estilos globales + Tailwind
├── login/page.tsx              # Página de login
├── catalog/page.tsx            # Catálogo de productos
├── cart/page.tsx                # Carrito y checkout
├── components/
│   ├── dashboard/              # Componentes del dashboard
│   │   ├── KpiGrid.tsx         # Grilla de indicadores (mobile)
│   │   ├── VisitCard.tsx       # Tarjeta de visita
│   │   ├── OrderCard.tsx       # Tarjeta de pedido finalizado
│   │   └── VisitColumns.tsx    # Layout tabs/columnas
│   ├── ui/
│   │   ├── BottomSheet.tsx     # Bottom sheet reutilizable
│   │   └── ProductImage.tsx    # Imagen con next/image + fallback
│   ├── NewClientSheet.tsx      # Wizard de identificación de cliente
│   ├── ProductSheet.tsx        # Detalle de producto
│   ├── VisitSummarySheet.tsx   # Resumen de visita
│   └── WalletModal.tsx         # Modal de cartera
├── context/
│   ├── MockContext.tsx          # Estado global (mock + API real)
│   ├── business-logic.ts       # Lógica de negocio pura (testable)
│   ├── TenantContext.tsx        # Configuración multi-tenant
│   └── ThemeContext.tsx         # Dark mode
├── config/api.ts               # Cliente HTTP con JWT
├── data/mock-data.ts           # Datos de demostración
├── types/index.ts              # Tipos TypeScript
└── utils/
    ├── apiMapper.ts            # Mapeo de campos API
    └── orderSharing.ts         # Compartir pedidos (WhatsApp, PDF)

__tests__/
└── business/
    ├── stock-validation.test.ts  # Pruebas de validación de stock
    ├── order-flow.test.ts        # Pruebas del flujo de pedidos
    └── visit-management.test.ts  # Pruebas de gestión de visitas
```

## Arquitectura

- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS
- **Backend:** Puente Pymo (Node.js) → Mekano ERP (consultar `docs/` para endpoints)
- **Auth:** JWT via POST `/auth/login`; el token se envía como `Bearer` en cada request
- **Multi-tenant:** Resolución por subdominio via middleware
- **Modo Mock:** Datos locales para desarrollo sin backend

## Pruebas

Las pruebas cubren la lógica de negocio crítica:

1. **Validación de stock:** No vender sin stock, rechazar cantidades excesivas
2. **Flujo de pedidos:** Creación, descuento de stock, IDs únicos
3. **Gestión de visitas:** Transiciones de estado, búsqueda de clientes, KPIs

```bash
npm test
```
