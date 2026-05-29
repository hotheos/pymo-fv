# Arquitectura de Seguridad — Pymo Fuerza de Ventas

**Fecha de decisión:** 2026-05-29
**Modelo:** Autenticación basada en **token (JWT)**, sin API key estática en el cliente.
**Estado:** Lado cliente implementado (con fallback a mock mientras no exista el puente). Lado servidor (puente Pymo) por implementar al conectar el ERP real.

---

## El sistema en una imagen

```
Fuerza de Ventas (navegador)
        │  Authorization: Bearer <JWT>
        ▼
   Puente Pymo  (uno por empresa)   ←── aquí vive el secreto de firma del token
        │
        ▼
   ERP Mekano (local de la empresa)
```

Puntos clave:

- **Fuerza de Ventas nunca habla con Mekano directamente.** Todo pasa por el puente Pymo.
- El puente es de **Pymo** (lo controlamos nosotros). Es el lugar correcto para validar tokens y abrir/cerrar el acceso a Mekano.
- Hay **un puente por empresa**, accesible por la URL del tenant (`apiBaseUrl`).

---

## La decisión: el token es la seguridad, no la API key

Una API key estática metida en el navegador no se puede proteger: es visible, es igual para todos y no autentica a nadie en concreto. El token (JWT) es mejor en todo:

- Se **gana** iniciando sesión (hay que probar credenciales).
- Es **por vendedor** (lleva el `id_vendedor` dentro).
- **Caduca**.
- **No se puede falsificar**, porque se firma con un secreto que vive solo en el puente.

Por eso se elimina la API key del cliente y la autenticación recae en el token.

---

## Cómo funciona

### 1. Login (única puerta pública)

`POST /auth/login` con `{ id_vendedor, password }` al puente. El puente valida contra Mekano y responde con un **JWT firmado** que contiene el `id_vendedor` (y el tenant). El secreto de firma **nunca sale del puente**.

Como el login es el único endpoint sin token, hay que protegerlo en el puente con:
- **Rate limiting** (límite de intentos por IP/usuario).
- **Bloqueo temporal** tras varios fallos seguidos.

### 2. Todas las demás peticiones

Llevan `Authorization: Bearer <token>`. El puente:
1. Verifica la firma del token (si es inválido o expiró → 401).
2. Extrae el `id_vendedor` del token.
3. Filtra **toda** consulta y modificación por ese `id_vendedor` (el "filtro maestro").

Regla de oro del backend: **nunca confiar en un `id_vendedor` enviado en el body**; siempre tomarlo del token.

### 3. Aislamiento entre empresas (sin llaves por empresa)

Cada puente (por empresa) firma con **su propio secreto**. Así, un token emitido por el puente de la empresa A **no es válido** en el de la empresa B. El cruce entre empresas queda resuelto sin necesidad de API keys por tenant.

### 4. Duración del token

Token de corta duración (p. ej. la jornada laboral). Al expirar, se vuelve a iniciar sesión. Opcionalmente, un *refresh token* más adelante; no es necesario al inicio.

### 5. Refuerzo opcional (cinturón extra)

- **Lista blanca de IP en el puente:** que cada puente solo acepte peticiones desde la IP del servidor central de Pymo. Aunque algo se filtre, no sirve desde otro origen.
- **HTTPS obligatorio** en todo el trayecto.

---

## Estado de la implementación

### Lado cliente (este repositorio) — HECHO

- `app/config/api.ts`: se eliminó la API key (`getApiKey`, `masterApiKey`, header `X-API-Key`). La autenticación se hace con `Authorization: Bearer <token>`.
- `app/context/MockContext.tsx`: `login()` ahora es asíncrono. Intenta `POST /auth/login` contra el puente; si el puente **no está disponible** (aún no conectado), cae a usuarios mock para desarrollo. Si el puente responde y **rechaza** las credenciales (401), no cae a mock.
- `.env.example` / `.env.local`: se quitó `NEXT_PUBLIC_API_KEY`. Solo queda `NEXT_PUBLIC_API_BASE_URL` (la URL del puente, que no es un secreto).

### Lado servidor (puente Pymo) — PENDIENTE (al conectar el ERP)

- Implementar `POST /auth/login`: validar contra Mekano y emitir el JWT firmado.
- Validar el JWT en cada endpoint y filtrar por `id_vendedor`.
- Rate limiting + bloqueo en el login.
- Un secreto de firma distinto por puente/empresa.
- (Opcional) lista blanca de IP.

### Al pasar a producción

- Eliminar `MOCK_SELLERS` y el fallback a mock del `login`.
- Confirmar que ningún secreto viaja con prefijo `NEXT_PUBLIC_`.

---

## Nota sobre el almacenamiento del token

Hoy el token se guarda en `localStorage` (simple y suficiente para esta etapa). Antes de producción conviene evaluar guardarlo en una cookie `httpOnly`/`Secure`, que es más resistente a robo por XSS. Es un ajuste menor y se decide al conectar el puente.

---

## Resumen

Un **login que entrega un JWT firmado en el puente**, **token por vendedor que caduca**, **cada puente con su propio secreto de firma**, y **rate limiting en el login**. Sin API keys en el cliente, sin llaves por empresa. Simple y seguro, aprovechando que el puente Pymo es nuestro.
