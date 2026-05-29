# Evaluación Técnica — Pymo Fuerza de Ventas

**Fecha:** 2026-05-29
**Evaluador:** Revisión técnica con criterios de programador senior
**Alcance revisado:** `app/` (código fuente), `middleware.ts`, configuración (`tsconfig`, `next.config`, `tailwind`, `.env`), documentación (`requerimientos/`, `docs/`).

---

## Resumen ejecutivo

Pymo es una aplicación web Next.js 14 (App Router) + TypeScript + Tailwind para una fuerza de ventas que se conecta al ERP Mekano por subdominio (multi-tenant). El proyecto está **muy bien documentado** y la base de frontend es **limpia, moderna y compila sin errores en modo estricto**. Sin embargo, **hoy es un prototipo/demo funcional, no una aplicación lista para producción**: toda la lógica de datos y autenticación es simulada (mock en el navegador), y existe un **fallo de seguridad crítico** en el manejo de la API key.

**Veredicto global: 5.5 / 10** — Excelente prototipo y excelente documentación, pero con brechas serias en seguridad, integración real, pruebas y control de versiones que deben cerrarse antes de hablar de producción.

| Categoría | Peso | Nota (0-10) |
|---|---|---|
| Arquitectura y diseño | 20% | 7.0 |
| Seguridad | 20% | 3.0 |
| Calidad de código | 15% | 6.5 |
| Integración / backend | 15% | 3.5 |
| Pruebas y QA | 10% | 0.5 |
| Proceso y DevOps (git, CI) | 10% | 2.0 |
| Documentación | 10% | 9.5 |
| **Ponderado** | **100%** | **≈ 5.5** |

---

## Parámetros de evaluación (los que fijaría un senior)

Estos son los criterios mínimos contra los que se midió el proyecto. Sirven también como definición de "listo para producción".

**Arquitectura**

1. Separación de capas: UI / lógica de negocio / acceso a datos desacoplados.
2. Componentes con responsabilidad acotada (idealmente < 250 líneas).
3. Estado global justificado y no monolítico.
4. Estrategia clara de multi-tenant sin fugas entre tenants.

**Seguridad**

5. Secretos (API keys, tokens) **nunca** en el bundle del cliente.
6. Autorización aplicada en el servidor, no en el frontend.
7. Tokens en almacenamiento seguro (cookie `httpOnly`), no `localStorage`.
8. Validación y sanitización de entradas en cliente **y** servidor.

**Calidad de código**

9. Tipado fuerte, sin `any` en límites internos; `tsc` y `lint` sin errores.
10. Sin código muerto, `TODO/TEMP`, `console.log` ni datos de prueba en `main`.
11. Manejo explícito de estados de carga y error en la UI.

**Integración**

12. Cliente HTTP real con manejo de errores, reintentos y timeouts.
13. Capa de mapeo/validación de la respuesta del API (idealmente con esquema, p. ej. Zod).

**Proceso / QA**

14. Control de versiones (git) con historial y ramas.
15. Pruebas unitarias, de integración y E2E con cobertura mínima de flujos críticos.
16. Pipeline CI (typecheck + lint + test + build) antes de fusionar.

**Documentación**

17. Requerimientos, contrato de API y guía de arranque (README/setup).

---

## Lo que está bien hecho

- **Stack moderno y correcto:** Next.js 14 App Router, React 18, TypeScript en modo `strict`, Tailwind. `tsc --noEmit` **pasa sin errores**.
- **Documentación sobresaliente:** ~3.900 líneas entre `requerimientos/` (8 módulos) y `docs/ENDPOINTS_FUERZA_VENTAS.md` (contrato de API de 1.705 líneas). Esto es poco común y muy valioso.
- **Capa de mapeo API↔frontend** (`apiMapper.ts`) bien pensada: traduce snake_case/español ↔ camelCase/inglés, anticipando el backend real. Facilita el reemplazo del mock.
- **Multi-tenant elegante:** resolución por subdominio en `middleware.ts` + `TenantContext`, con theming dinámico derivando una paleta dark en HSL desde el color primario del tenant.
- **Detalles de UX cuidados:** componente `ProductImage` con fallback robusto, `BottomSheet` con portal y animación, diseño mobile-first responsivo, generación de PDF y compartir por WhatsApp.

---

## Hallazgos por severidad

### 🔴 Críticos (bloquean producción)

**C1 — La master API key se expone en el cliente.**
En `app/config/api.ts` la llave se lee de `NEXT_PUBLIC_API_KEY`. Todo lo que tenga prefijo `NEXT_PUBLIC_` queda **incrustado en el JavaScript que se envía al navegador**. Como además es **una sola master key compartida por todos los tenants** (según `.env.example` y la doc), cualquier persona puede extraerla desde el bundle y golpear el ERP local de **cualquier** cliente. Es la falla más grave del proyecto.
*Corrección:* mover toda llamada al ERP a un proxy del lado servidor (Route Handlers / BFF de Next), donde la key vive como variable de entorno **sin** `NEXT_PUBLIC_`. El navegador nunca debe ver la key. Idealmente, una key por tenant en vez de una master compartida.

**C2 — La seguridad documentada no es real porque no hay backend.**
El módulo 08 describe un modelo sólido ("filtro maestro" por `id_vendedor` en el JWT, políticas por tabla). Pero hoy todo vive en `MockContext` en el navegador: los datos de **todos** los vendedores (`MOCK_VISITS`, `MOCK_ORDERS`, etc.) se cargan en el cliente y el "filtro de seguridad" es solo `visits.filter(v => v.sellerId === seller?.id)`. Filtrar en el frontend **no es seguridad**: el dato ya está en el dispositivo. El modelo solo será real cuando exista el backend que filtre por el token.

**C3 — Autenticación simulada.**
El login acepta `1/1` y `2/2` y genera un "JWT" falso (`mock_jwt_...`). No hay verificación de credenciales ni emisión real de token. Es esperable en un prototipo, pero es un bloqueante absoluto para producción.

### 🟠 Altos

**A1 — Token en `localStorage`.** `pymo_seller` (con el token) se guarda en `localStorage`, vulnerable a robo por XSS. En producción el token debe ir en cookie `httpOnly`/`Secure`.

**A2 — Sin control de versiones.** El directorio **no es un repositorio git** (`no git repo`). Sin historial, sin ramas, sin posibilidad de revisar cambios ni revertir. Es la primera cosa que un senior exigiría.

**A3 — Cero pruebas.** No hay archivos de test, ni runner (Jest/Vitest), ni E2E (Playwright/Cypress) en `package.json`. Flujos críticos (checkout, validación de stock, transiciones de visita) no tienen red de seguridad.

**A4 — Sin manejo de error en la UI.** La carga de productos desde API solo hace `console.warn` y cae a mock silenciosamente. No hay estados de error/carga visibles, ni error boundaries.

### 🟡 Medios

**M1 — Artefactos de prueba/depuración en el código.**
- Productos de prueba `TEST-NULL` y `TEST-404` dentro de `MOCK_PRODUCTS`.
- Selector de color "TEMP — remove later" (`isColorPickerOpen`) en `app/page.tsx`.
- 10 `console.log/warn/info` repartidos en el código.
Un senior los eliminaría (o los pondría detrás de un flag de entorno) antes de cualquier release.

**M2 — Bug de CSS real:** se usa la clase inexistente `point-events-none` (2 veces en `login/page.tsx`). La correcta en Tailwind es `pointer-events-none`. Hoy no rompe nada visible pero es un defecto.

**M3 — Componentes monolíticos.** `MockContext.tsx` (689 líneas) mezcla datos + lógica de negocio + persistencia; `page.tsx` (681), `NewClientSheet.tsx` (657) y `cart/page.tsx` (475) son grandes. Conviene descomponer en hooks/servicios más pequeños.

**M4 — Uso de `any` en la capa de API.** 18 ocurrencias, concentradas en `apiMapper.ts`. Es aceptable en el límite con el backend, pero lo ideal es validar la respuesta con un esquema (Zod) y tipar las entradas.

**M5 — Sin optimización de imágenes.** Se usan `<img>` (6 veces) en lugar de `next/image`, con URLs externas de Unsplash en datos mock. `next.config.mjs` está vacío (sin `images.remotePatterns`).

### 🟢 Bajos / mejoras

- Colores hardcodeados (RGB `73,177,245`) en el PDF en lugar del color del tenant.
- Lógica de teléfono para WhatsApp algo frágil (asume móvil colombiano por prefijo "3").
- Sin README de arranque (la doc de requerimientos es excelente, pero falta el "cómo levantar el proyecto").
- Sin Prettier/config de formato visible ni CI.

---

## Recomendaciones priorizadas (ruta a producción)

**Fase 0 — Higiene inmediata (1-2 días)**
1. `git init`, primer commit, repo remoto y `.gitignore` ya existente verificado.
2. Quitar artefactos: productos `TEST-*`, color picker TEMP, `console.*`. Corregir `point-events-none`.

**Fase 1 — Seguridad (bloqueante)**
3. Crear proxy server-side (Route Handlers de Next) para todas las llamadas al ERP; mover la API key a variable de entorno **sin** `NEXT_PUBLIC_`.
4. Evaluar una key por tenant en lugar de una master compartida.
5. Mover el token a cookie `httpOnly`/`Secure`; eliminar el token de `localStorage`.

**Fase 2 — Integración real**
6. Reemplazar `MockContext` por servicios que consuman el backend real (manteniendo `apiMapper`), con manejo de errores, timeouts y estados de carga/error en la UI.
7. Validar respuestas del API con Zod (sustituir `any`).

**Fase 3 — QA y proceso**
8. Pruebas: unitarias de lógica de negocio (stock, transiciones de visita), integración de la capa API y E2E del flujo vendedor→pedido.
9. CI que corra `tsc`, `lint`, `test` y `build` en cada PR.

**Fase 4 — Pulido**
10. Descomponer componentes grandes; migrar a `next/image`; README de arranque.

---

## Conclusión

El proyecto demuestra **buen criterio de diseño y una documentación ejemplar**, y como prototipo de demostración cumple muy bien: el flujo completo de la fuerza de ventas es navegable y la base técnica es sólida. La distancia hasta producción no está en la UI sino en **tres frentes**: cerrar el hueco de seguridad de la API key (crítico), reemplazar la simulación por backend real con autorización en servidor, y montar la disciplina de ingeniería que hoy falta (git, pruebas, CI). Resueltos esos puntos, la base actual es perfectamente aprovechable.
