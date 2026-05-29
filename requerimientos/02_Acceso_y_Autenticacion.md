# 2. Acceso y Autenticación (Login)

## 2.1 Seguridad de Acceso

Pymo es un **ecosistema corporativo cerrado**. No es una aplicación de acceso público ni comercial.

| Regla | Detalle |
|---|---|
| **Proveedor de Identidad** | API del backend Mekano (producción) / MockContext (desarrollo) |
| **Registro** | **No existe "Crear Cuenta" (Sign Up)**. Los vendedores los da de alta el administrador. |
| **Persistencia de Sesión** | La sesión se guarda en `localStorage` (`pymo_seller`) y se restaura al recargar la app. |
| **Token JWT** | Se almacena en memoria via `setAuthToken()` del módulo `api.ts`. Se incluye automáticamente en todas las peticiones. |
| **Cierre de Sesión** | Solo mediante logout manual. Al hacer logout se limpia: sesión, carrito, carritosPerNit y clienteActivo. |

### Endpoint de Producción

> Autenticación basada en **token (JWT)**, sin API key en el cliente. Ver [docs/ARQUITECTURA_SEGURIDAD.md](../docs/ARQUITECTURA_SEGURIDAD.md).

```
POST /auth/login
Content-Type: application/json

{
  "id_vendedor": "<ID_vendedor>",
  "password": "<contraseña>"
}
```

> `/auth/login` es la única puerta pública. El puente Pymo la protege con rate limiting y bloqueo temporal tras varios fallos.

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "perfil": {
    "id_vendedor": "s1",
    "nombre_vendedor": "Carlos Mendoza"
  }
}
```

> El `id_vendedor` dentro del JWT es el **filtro maestro**. Todas las consultas posteriores extraen el `id_vendedor` del token. Nunca confiar en un `id_vendedor` enviado en el body.

---

## 2.2 Interfaz de Login — Implementación Actual

**Archivo:** `app/login/page.tsx`

### Diseño Visual
- **Fondo:** `bg-slate-50`, centrado vertical y horizontal
- **Ancho máximo:** `max-w-sm` (contenedor)
- **Branding:**
  - Imagen `/login.png` (220px de ancho) centrada en la parte superior
  - Subtítulo "Fuerza de Ventas" en texto uppercase, tracking `0.2em`, color `slate-500`

### Campos de Entrada

| Campo | Icono | Tipo | Placeholder |
|---|---|---|---|
| **ID Vendedor** | `Badge` (lucide) | `text` | "ID Vendedor" |
| **Contraseña** | `Lock` (lucide) | `password` (toggle a text) | "Contraseña" |

### Características Implementadas
- **Toggle de visibilidad** de contraseña: Botón "VER" / "OCULTAR" alineado a la derecha dentro del input
- **Validación HTML5:** Campos `required`
- **Mensaje de error:** Banner rojo con `bg-red-50`, texto centrado
- **Botón "Ingresar":** Ancho completo, `bg-primary` (#4B91E2), texto uppercase, tracking wide, `font-bold`
- **Estilo de inputs:** Border `slate-200`, rounded-lg, focus ring con `ring-primary/50`, padding `py-3`

### Pie de Página
- Logo `/apolosoft.png` (140px) centrado, `opacity-50`

### Credenciales de Desarrollo (Mock)

| Username | Password | Vendedor |
|---|---|---|
| `1` | `1` | Carlos Mendoza (s1) |
| `2` | `2` | Andrea Ríos (s2) |

---

## 2.3 Lógica de Redirección

```
Login exitoso → router.push("/") → Dashboard (page.tsx)
                                  → Inyecta seller en contexto global
                                  → Filtra toda la data por seller.id
```

### Protección de Rutas
El Dashboard (`page.tsx`) implementa **guardia de autenticación**:
```typescript
useEffect(() => {
    if (!isLoading && !seller) {
        router.push("/login");
    }
}, [seller, router, isLoading]);
```

- Mientras `isLoading` es `true`: Muestra spinner de carga global
- Si no hay `seller` tras cargar: Redirige automáticamente al Login
- Loading state se resuelve al verificar `localStorage` en el mount del contexto

---

## 2.4 Modelo de Datos del Vendedor

```typescript
interface Seller {
    id: string;        // ID único interno (e.g. "s1")
    name: string;      // Nombre completo del vendedor
    username: string;   // ID Vendedor para login
}
```
