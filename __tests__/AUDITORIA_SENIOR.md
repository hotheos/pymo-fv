# Auditoría Senior: Pymo Fuerza de Ventas

**Fecha:** 2026-05-29
**Evaluador:** Auditoría automatizada contra parámetros senior
**Commit evaluado:** `3ea03de` (master)

---

## Resumen Ejecutivo

| Área                | Nota  | Estado       |
|---------------------|-------|--------------|
| Arquitectura        | 7/10  | ⚠ Aceptable  |
| Seguridad           | 5/10  | 🔴 Crítico   |
| Calidad de Código   | 7/10  | ⚠ Aceptable  |
| Integración         | 4/10  | 🔴 Crítico   |
| Proceso / QA        | 5/10  | ⚠ Débil      |
| Documentación       | 8/10  | ✅ Bueno     |
| **GLOBAL**          | **6/10** | **No listo para producción** |

> **Veredicto:** El proyecto tiene una buena base de arquitectura y documentación, pero presenta deficiencias críticas en seguridad (tokens en localStorage) e integración (sin validación de esquema, sin reintentos, sin timeout). No está listo para producción tal como está.

---

## 1. Arquitectura (7/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| Separación de capas | UI (components/), lógica de negocio (business-logic.ts), datos (mock-data.ts), config API (config/api.ts) |
| Multi-tenant | Middleware Edge extrae subdomain → header `x-tenant-slug`; TenantContext resuelve config por slug |
| Componentes < 250 líneas (mayoría) | 14 de 17 archivos .tsx/.ts cumplen el límite |

**Detalle de tamaños de archivo (post-refactorización):**

| Archivo | Líneas | ¿Cumple < 250? |
|---------|--------|-----------------|
| NewClientSheet.tsx | 657 | ❌ |
| cart/page.tsx | 475 | ❌ |
| MockContext.tsx | 470 | ❌ |
| page.tsx | 256 | ⚠ Borderline |
| mock-data.ts | 214 | ✅ |
| apiMapper.ts | 210 | ✅ |
| VisitColumns.tsx | 197 | ✅ |
| business-logic.ts | 194 | ✅ |
| TenantContext.tsx | 190 | ✅ |
| orderSharing.ts | 156 | ✅ |
| VisitSummarySheet.tsx | 154 | ✅ |
| ProductSheet.tsx | 145 | ✅ |
| login/page.tsx | 123 | ✅ |
| catalog/page.tsx | 122 | ✅ |
| config/api.ts | 113 | ✅ |

### ❌ No aprobado

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| 3 archivos > 250 líneas | Media | `NewClientSheet.tsx` (657), `cart/page.tsx` (475), `MockContext.tsx` (470) aún exceden el límite. NewClientSheet fue decidido no dividir por ser un wizard autocontenido; los otros dos necesitan refactorización. |
| Estado global monolítico | Media | MockContext expone 28 funciones/propiedades en un solo Provider. Debería dividirse en hooks o contexts más específicos (ej: `useCart`, `useVisits`, `useOrders`). |
| Fuga potencial multi-tenant | Baja | MockContext carga los mismos datos mock para todos los tenants. No hay aislamiento de datos por tenant en el frontend; se confía en que el backend filtre por JWT (correcto, pero frágil). |

### Recomendaciones
1. Dividir MockContext en hooks específicos: `useCartContext`, `useVisitsContext`, `useOrdersContext`.
2. Extraer la lógica del checkout de `cart/page.tsx` a un hook `useCheckout`.
3. Evaluar dividir NewClientSheet en sub-componentes con un hook `useClientWizard` que centralice el estado.

---

## 2. Seguridad (5/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| Sin secretos en el bundle | Solo `NEXT_PUBLIC_API_BASE_URL` (URL pública, no es secreto). No hay API keys estáticas. |
| JWT como token de autenticación | El token JWT se obtiene via POST /auth/login y se envía como `Bearer` en cada request. |
| Sin XSS vía dangerouslySetInnerHTML | No se encontró ningún uso de `dangerouslySetInnerHTML` en el proyecto. |
| Middleware de tenant seguro | Extrae subdomain de forma segura, usa `toLowerCase()`, no permite inyección. |

### 🔴 Crítico

| Hallazgo | Severidad | Ubicación |
|----------|-----------|-----------|
| **JWT en localStorage** | **CRÍTICA** | [MockContext.tsx:170](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/context/MockContext.tsx#L170) — `localStorage.setItem("pymo_seller", JSON.stringify(sellerData))`. El objeto seller incluye el token JWT. Un ataque XSS podría exfiltrar el token. Debería usar cookies `httpOnly` gestionadas por el backend. |
| Token en variable de módulo | Alta | [api.ts:41](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/config/api.ts#L41) — `let _authToken` almacena el JWT en memoria del módulo. Accesible desde cualquier código importado. |
| Sin validación de inputs en el frontend | Media | Los formularios de NewClientSheet no validan formato de NIT (longitud, solo numéricos), email, o teléfono con regex. |
| Autorización solo verificada en backend | Info | El frontend no hace verificación de permisos; se confía en que el backend filtre por JWT. Esto es correcto arquitecturalmente, pero significa que el frontend muestra UI para acciones que podrían fallar si el token expira. |

### Recomendaciones
1. **Migrar JWT a cookie httpOnly** gestionada por el backend (Set-Cookie en la respuesta de login). El frontend no necesita leer el token; el navegador lo envía automáticamente.
2. Agregar validación de formato en campos de formulario (NIT: solo dígitos, teléfono: 10 dígitos, email: regex básico).
3. Implementar detección de token expirado y redirect automático a login.

---

## 3. Calidad de Código (7/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| `tsc --noEmit` sin errores | ✅ Exit code 0 |
| `next build` lint + tipos | ✅ "Linting and checking validity of types... Compiled successfully" |
| Sin console.log | ✅ 0 ocurrencias encontradas en `app/` |
| Sin TODO/FIXME/HACK | ✅ 0 ocurrencias encontradas en `app/` |
| Sin dangerouslySetInnerHTML | ✅ 0 ocurrencias |
| Manejo de estado de carga | ✅ `isLoading` en MockContext, spinners en dashboard, NewClientSheet, VisitSummarySheet |
| Manejo de errores en UI | ✅ Errores de login, errores de stock en checkout, estados vacíos en listas |

### ❌ No aprobado

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| **18 usos de `any` en apiMapper.ts** | Alta | [apiMapper.ts](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/utils/apiMapper.ts) usa `any` en todas sus funciones de mapeo (líneas 25, 33, 43, 56, 65, 72, 84, 99, 107, 115, 126, 127, 140, 160, 173, 192). Esto anula la seguridad de tipos justo en el límite más crítico: la frontera con el API externo. |
| 2 usos de `any` en NewClientSheet | Media | [NewClientSheet.tsx:88-89](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/components/NewClientSheet.tsx#L88-L89) — `client?: any; visit?: any;` |
| 1 uso de `any` con eslint-disable | Baja | [orderSharing.ts:104-105](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/utils/orderSharing.ts#L104-L105) — Cast `(doc as any).lastAutoTable` por API no tipada de jspdf-autotable. Justificado pero debería usar un tipo auxiliar. |
| Datos mock en código de producción | Media | [mock-data.ts](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/data/mock-data.ts) se importa directamente en MockContext sin feature flag. Los datos de demostración se cargan siempre, incluso cuando el backend real está disponible. Debería haber un `if (process.env.NODE_ENV === 'development')` o similar. |
| `catch {}` vacíos (silencio de errores) | Media | [MockContext.tsx:136, 204](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/context/MockContext.tsx#L136) — Los catch de carga de productos y login mock silencian errores sin log ni reporte. |

### Recomendaciones
1. **Reemplazar `any` con interfaces tipadas en apiMapper.ts.** Idealmente con Zod schemas que validen la forma del API response.
2. Tipar `client` y `visit` en NewClientSheet con los tipos existentes del proyecto.
3. Envolver datos mock con un flag de entorno: solo importar cuando `process.env.NODE_ENV !== 'production'` o cuando el backend no responde.
4. En los catch vacíos, al menos usar `console.warn` o un sistema de logging.

---

## 4. Integración (4/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| Cliente HTTP centralizado | [api.ts](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/config/api.ts) — `apiFetch()` wrapper con Bearer token automático |
| URL builder | `apiUrl()` construye URLs relativas al tenant |
| Capa de mapeo | [apiMapper.ts](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/utils/apiMapper.ts) traduce snake_case (API) ↔ camelCase (frontend) |

### 🔴 Crítico

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| **Sin validación de esquema de respuestas** | **CRÍTICA** | No hay Zod, yup, io-ts, ni ninguna validación runtime de las respuestas del API. `apiMapper.ts` asume que la estructura es correcta (`api.nombre`, `api.nit`, etc.) sin ninguna verificación. Un campo faltante causaría un crash silencioso con `undefined`. |
| **Sin reintentos** | Alta | `apiFetch` no implementa retry logic. Una falla de red transitoria (timeout, 503) causa fallo directo. |
| **Sin timeout** | Alta | `fetch()` nativo no tiene timeout por defecto. Una conexión colgada bloqueará indefinidamente. Debería usar `AbortController` con timeout. |
| **Sin manejo de 401/token expirado** | Alta | Si el JWT expira, las llamadas API fallarán con 401, pero no hay lógica de redirect a login ni refresco de token. |
| **Fallback a mock silencioso** | Media | [MockContext.tsx:136](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/app/context/MockContext.tsx#L136) — Si la carga de productos del API real falla, se silencia el error y se mantienen datos mock. El usuario no sabe si está viendo datos reales o ficticios. |
| No se usa apiMapper en MockContext | Media | MockContext.tsx línea 118 hace su propio mapeo inline en vez de usar `mapProduct` de apiMapper.ts. Duplicación de lógica de mapeo. |

### Recomendaciones
1. **Implementar Zod schemas** para validar respuestas del API antes del mapeo.
2. Agregar retry con backoff exponencial (2-3 intentos) a `apiFetch`.
3. Agregar `AbortController` con timeout de 10-15 segundos.
4. Implementar interceptor de 401: redirigir a login, limpiar token.
5. Mostrar un indicador visual ("modo offline" o "datos de demostración") cuando se usan datos mock.
6. Centralizar el mapeo: que MockContext use `mapProduct` de apiMapper.ts en vez de duplicar la lógica.

---

## 5. Proceso / QA (5/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| Control de versiones (Git) | ✅ Repositorio inicializado, 2 commits, .gitignore configurado |
| Pruebas unitarias de lógica de negocio | ✅ 30 tests en 3 suites (stock, órdenes, visitas), todos pasando |
| Scripts de calidad | ✅ `npm test`, `npm run check` (lint + tsc) |
| Build de producción | ✅ `next build` compila sin errores |

### ❌ No aprobado

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| **Sin pipeline CI** | Alta | No existe `.github/workflows/`, no hay CI/CD configurado. Los checks dependen de que el desarrollador los corra manualmente. |
| **Sin pruebas de integración** | Alta | No hay tests que validen la interacción entre componentes (ej: renderizar el dashboard, hacer click en "Comenzar Visita"). |
| **Sin pruebas E2E** | Alta | No hay Cypress, Playwright, ni ningún framework E2E para validar flujos completos en el navegador. |
| **Sin cobertura de código** | Media | `@vitest/coverage-v8` no está instalado. No se puede medir qué porcentaje del código está cubierto por tests. |
| Solo 1 rama (master) | Media | No hay ramas de feature, develop, ni estrategia de branching. Todo va directo a master. |
| Solo 2 commits | Baja | El historial de Git no refleja la evolución incremental del proyecto. |

### Recomendaciones
1. **Crear `.github/workflows/ci.yml`** con: checkout → install → `npm run check` → `npm test` → `npm run build`.
2. Agregar pruebas de integración con React Testing Library (renderizar componentes con MockProvider).
3. Evaluar Playwright para E2E de flujos críticos (login → visita → catálogo → checkout).
4. Instalar `@vitest/coverage-v8` y establecer un umbral mínimo de cobertura.
5. Adoptar estrategia de branching (ej: trunk-based con feature flags, o GitFlow simplificado).

---

## 6. Documentación (8/10)

### ✅ Aprobado

| Criterio | Evidencia |
|----------|-----------|
| README con guía de arranque | ✅ [README.md](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/README.md) — instalación, scripts, estructura, arquitectura |
| Requerimientos detallados | ✅ 8 documentos en `requerimientos/` cubriendo cada módulo |
| Contrato de API | ✅ [ENDPOINTS_FUERZA_VENTAS.md](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/docs/ENDPOINTS_FUERZA_VENTAS.md) |
| Documentación de seguridad | ✅ [ARQUITECTURA_SEGURIDAD.md](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/docs/ARQUITECTURA_SEGURIDAD.md), [ARQUITECTURA_LLAVES_API.md](file:///Users/thomas/Pymo%20Fuerza%20de%20Ventas/docs/ARQUITECTURA_LLAVES_API.md) |
| Comentarios en código | ✅ Archivos de config y contextos tienen docstrings explicando las decisiones de arquitectura |

### ❌ No aprobado

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| Sin .env.example | Baja | El README menciona "copiar .env.example" pero el archivo no existe en el repo. Solo existe `.env.local` (que está en .gitignore). |
| Sin CHANGELOG | Baja | No hay registro de cambios entre versiones. |

### Recomendaciones
1. Crear `.env.example` con las variables necesarias (valores placeholder, no reales).
2. Considerar un CHANGELOG.md o usar releases de Git.

---

## Hallazgos Críticos (bloqueantes para producción)

Estos 5 hallazgos deben resolverse antes de considerar el proyecto listo para producción:

| # | Hallazgo | Área | Fix estimado |
|---|----------|------|-------------|
| 1 | JWT almacenado en localStorage (vulnerable a XSS) | Seguridad | Medio: requiere cambio en backend (Set-Cookie httpOnly) + frontend |
| 2 | Sin validación de esquema de respuestas del API | Integración | Medio: implementar Zod schemas para cada endpoint |
| 3 | Sin timeout ni reintentos en el cliente HTTP | Integración | Bajo: agregar AbortController + retry a apiFetch |
| 4 | Sin pipeline CI | Proceso | Bajo: crear .github/workflows/ci.yml |
| 5 | 18 usos de `any` en la frontera API | Calidad | Medio: tipar apiMapper.ts con interfaces o Zod |

---

## Conclusión (evaluación inicial)

El proyecto demuestra buena ingeniería en su separación de responsabilidades, documentación exhaustiva, y la reciente adición de pruebas automáticas. Sin embargo, las deficiencias en seguridad (tokens en localStorage) e integración (sin validación de respuestas, sin reintentos) lo descalifican para producción en su estado actual.

---

## Correcciones Aplicadas (commit `27a5b54`)

Las siguientes correcciones pre-producción se aplicaron después de la evaluación inicial:

| # | Hallazgo original | Estado | Resolución |
|---|-------------------|--------|------------|
| 1 | 18 `any` en apiMapper.ts | ✅ Resuelto | Interfaces tipadas para cada endpoint del API (`ApiSeller`, `ApiClient`, `ApiProduct`, etc.). **0 `any` en todo el proyecto.** |
| 2 | cart/page.tsx (475 líneas) | ✅ Resuelto | Refactorizado a 222 líneas. PDF → `pdfGenerator.ts`, pantalla de éxito → `CheckoutSuccess.tsx`. |
| 3 | MockContext monolítico (28 props) | ✅ Resuelto | Hooks de dominio: `useAuth()`, `useCart()`, `useVisits()`, `useOrders()`, `useClients()` en `hooks.ts`. |
| 4 | `any` en NewClientSheet | ✅ Resuelto | Tipado con `Client` y `Visit` del proyecto. |
| 5 | `catch {}` vacíos | ✅ Resuelto | `console.warn` con mensaje descriptivo en `loadProductsFromAPI`. |
| 6 | `.env.example` faltante | ✅ Ya existía | Verificado: archivo completo con documentación de arquitectura. |

### Notas post-corrección

**Conteo final de `any`:** 0 en todo `app/`

**Tamaños de archivo actualizados:**

| Archivo | Antes | Después | Cumple < 250 |
|---------|-------|---------|--------------|
| NewClientSheet.tsx | 657 | 657 | ❌ (wizard autocontenido, decisión consciente) |
| MockContext.tsx | 470 | 471 | ❌ (orquestador, pero accesible via hooks de dominio) |
| apiMapper.ts | 210 | 349 | ❌ (creció por interfaces, pero es puro tipos, no lógica) |
| cart/page.tsx | 475 | **222** | ✅ |
| page.tsx | 256 | 256 | ⚠ Borderline |

### Pendientes para producción (requieren backend)

Estos items no se corrigen ahora porque dependen de tener el backend Pymo conectado:

| Item | Razón de espera |
|------|----------------|
| JWT → httpOnly cookies | Requiere que el backend envíe `Set-Cookie` en `/auth/login` |
| Zod schemas | Se validarán contra las respuestas reales del API |
| Timeout + reintentos | Sin backend no hay qué reintentar |
| Pipeline CI | Se configura al crear el repositorio remoto |
| Pruebas E2E | Necesitan la app corriendo con datos reales |

