# 4. Identificación y Registro de Cliente (Bottom Sheet)

**Archivo:** `app/components/NewClientSheet.tsx` (~576 líneas)

> **Evolución Mayor:** Este módulo evolucionó significativamente respecto a los requerimientos originales. Pasó de ser un simple formulario de "Nuevo Cliente" a un **sistema inteligente de identificación por NIT** que maneja 3 escenarios distintos.

---

## 4.1 Concepto General

El Bottom Sheet de "Identificar Cliente" es un flujo de **dos pasos**:

1. **Paso 1 — Búsqueda:** El vendedor ingresa un NIT y el sistema busca si el cliente ya existe
2. **Paso 2 — Acción:** Según el resultado de la búsqueda, se presenta uno de 3 escenarios

---

## 4.2 Diseño y Comportamiento del Bottom Sheet

**Componente base:** `app/components/ui/BottomSheet.tsx`

| Propiedad | Valor |
|---|---|
| **Morfología** | Fondo blanco `dark:bg-dark-900`, bordes superiores `rounded-t-3xl` |
| **Overlay** | Fondo oscuro (`bg-black/50`) con clic para cerrar |
| **Animación** | Slide-up desde la base (`translate-y-full` → `translate-y-0`) con transición de 300ms |
| **Handle** | Barra gris centrada en la parte superior (indicador de arrastre visual) |
| **Altura** | Cubre ~85% de la pantalla (`max-h-[85vh]`) |
| **Scroll interno** | `overflow-y-auto` para contenido largo |

---

## 4.3 Paso 1: Búsqueda por NIT

### Campo de Búsqueda
```
┌─────────────────────────────────┐
│ 🔍 NIT o Cédula                 │
│ [___________________________]   │
│               [BUSCAR ▶]        │
└─────────────────────────────────┘
```

- **Icono:** `Fingerprint` (lucide)
- **Tipo de input:** `text` con `inputMode="numeric"` y `pattern="[0-9]*"`
- **Validación:** Solo caracteres numéricos, mínimo 5 dígitos, máximo 15
- **Botón:** "BUSCAR" con icono `Search`, gradiente del tenant
- **Estado de carga:** Spinner animado mientras busca (simula latencia de 800ms)

### Endpoint de Producción
```
GET /clientes/buscar/:nit
Authorization: Bearer <token>
```

---

## 4.4 Los 3 Escenarios de Resultado

### Escenario A: Cliente Asignado (`encontrado_en: "asignado"`)

El cliente ya tiene una visita programada con este vendedor hoy.

```
┌─────────────────────────────────┐
│  ✅ CLIENTE YA ASIGNADO         │
│                                 │
│  Tienda La Esquina              │
│  NIT: 900123456                 │
│  📞 3001234567                  │
│  📍 Calle 123 # 45-67          │
│  📧 contacto@laesquina.com     │
│                                 │
│  Estado: PENDING                │
│                                 │
│  [ir a la visita →]             │
└─────────────────────────────────┘
```

**Acción:** Botón para navegar directamente a la visita existente (comienza visita y va al catálogo)

### Escenario B: Cliente No Asignado (`encontrado_en: "no_asignado"`)

El cliente existe en el sistema Mekano pero no tiene visita con este vendedor.

```
┌─────────────────────────────────┐
│  👤 CLIENTE ENCONTRADO          │
│  (No asignado a tu ruta)        │
│                                 │
│  DISTRIBUIDORA CENTRAL          │
│  NIT: 555666777                 │
│                                 │
│  [Formulario pre-llenado]       │
│  Nombre: DISTRIBUIDORA CENTRAL  │
│  Teléfono: 3201234567           │
│  Dirección: Av. Industrial...   │
│  Email: ventas@distcentral.com  │
│                                 │
│  [✏️ Editar campos]             │
│  [GUARDAR Y EMPEZAR PEDIDO]     │
└─────────────────────────────────┘
```

**Datos:** El formulario se pre-llena con los datos del cliente encontrado
**Edición:** Los campos son editables para actualizar datos incorrectos
**Indicador de cambios:** Se detecta si el vendedor modificó datos y se usa `updateClient()` además de `addClient()`

### Escenario C: Cliente No Encontrado (`encontrado_en: null`)

El NIT no existe en ninguna parte del sistema.

```
┌─────────────────────────────────┐
│  ❌ CLIENTE NO ENCONTRADO       │
│  NIT: 777111222                 │
│                                 │
│  [Formulario vacío]             │
│  NIT: 777111222 (pre-llenado)   │
│  Nombre (*): ________________   │
│  Teléfono (*): ______________   │
│  Dirección (*): _____________   │
│  Email: _____________________   │
│                                 │
│  [GUARDAR Y EMPEZAR PEDIDO]     │
└─────────────────────────────────┘
```

**NIT:** Se pre-llena con el NIT buscado (no editable)
**Campos:** Todos vacíos, el vendedor debe llenar los obligatorios

---

## 4.5 Validación de Campos (Campo por Campo)

| Campo | Icono | Reglas | Obligatorio |
|---|---|---|---|
| **NIT / Cédula** | `Hash` | Solo numérico, 5-15 dígitos, regex `/^[0-9]{5,15}$/` | ✅ |
| **Razón Social** | `Store` | Mínimo 3 caracteres, regex `/^[a-záéíóúñ0-9\s.,&\-'#]+$/i` | ✅ |
| **Teléfono** | `Phone` | Solo dígitos, exactamente 10, regex `/^[0-9]{10}$/` | ✅ |
| **Dirección** | `MapPin` | Mínimo 5 caracteres | ✅ |
| **Email** | `Mail` | Formato email válido (si se proporciona), regex válido | ❌ |

### Sistema de Feedback Visual
- **Borde verde** (`border-emerald-400`): Campo validado correctamente
- **Borde rojo** (`border-red-400`): Campo con error de validación
- **Borde neutro** (`border-slate-200`): Campo sin modificar (sin feedback aún)
- **Mensajes inline:** Checkmark verde o mensaje de error rojo debajo de cada campo
- **Validación en blur:** Se valida cuando el campo pierde el foco

---

## 4.6 Lógica de Transición (Operación Atómica)

Al presionar **"GUARDAR Y EMPEZAR PEDIDO"**:

```
1. Sanitización  → Limpieza de espacios extras, trim
2. Validación    → Verificar campos obligatorios + formatos
3. addClient()   → Registro/actualización en base de datos
                    ├── Si NIT duplicado → Error "Ya tienes visita con este NIT"
                    ├── Si es nuevo → Crear cliente + crear visita PENDING
                    └── Si existe → Actualizar datos + crear visita PENDING
4. beginVisit()  → Activar el NIT como cliente activo
5. Navegación    → router.push('/catalog?newVisit=true&nit=<NIT>')
```

> **Salto Atómico:** Se navega **directamente al Catálogo** sin regresar al Dashboard, para capitalizar el impulso de venta.

### Botón deshabilitado cuando:
- Campos obligatorios vacíos
- Errores de validación presentes
- En escenario "asignado" (no necesita guardar, solo navegar)

---

## 4.7 Modelo de Datos del Cliente

```typescript
interface Client {
    nit: string;       // PK — identificador único del negocio
    name: string;      // Razón social
    phone: string;     // Teléfono (10 dígitos)
    address: string;   // Dirección
    email?: string;    // Correo (opcional)
}
```

---

## 4.8 Reset del Formulario

Al cerrar el Bottom Sheet (`handleClose`):
- Se limpian todos los campos del formulario
- Se resetean los estados de validación y errores
- Se resetea el resultado de búsqueda
- Se vuelve al Paso 1 (búsqueda)
