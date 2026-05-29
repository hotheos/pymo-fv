# Requerimientos Técnicos y Funcionales: Pymo (Fuerza de Ventas)


# **1\. Fundamentos y Arquitectura del Proyecto** {#1.-fundamentos-y-arquitectura-del-proyecto}

* **Nombre del Proyecto:** Pymo (Extensión oficial del ERP Mekano).  
* **Infraestructura de Datos:** Supabase (PostgreSQL) operando como capa intermedia de alta disponibilidad para la gestión de estados y persistencia.  
* **Estrategia de Sincronización:**   
  * **Inbound:** El ERP Mekano alimenta las tablas de Supabase mediante integración vía API.  
  * **Outbound:** La aplicación Pymo consume y escribe datos directamente en Supabase, actuando esta como la "fuente de verdad" para el cliente móvil.  
* **Propósito Técnico:** Maximizar el rendimiento operativo (*performance*) y garantizar la continuidad del flujo de venta (acceso a clientes, productos y precios) en escenarios de conectividad limitada o alta latencia.

# 

# **2\. Acceso y Autenticación (Login)** {#2.-acceso-y-autenticación-(login)}

1. ##  **Seguridad de Acceso** {#seguridad-de-acceso}

   El sistema **Pymo** está diseñado como un ecosistema corporativo cerrado. No es una aplicación de acceso público ni comercial.

* **Proveedor de Identidad:** Se utiliza **Supabase Auth** para la gestión robusta de sesiones y tokens.

* **Restricción de Registro:** **No existe el flujo de "Crear Cuenta" (Sign Up)**. Los usuarios (vendedores) son dados de alta exclusivamente por el administrador desde el panel de gestión centralizado.

* **Persistencia:** La sesión debe mantenerse activa para optimizar la operatividad en calle, evitando re-autenticaciones innecesarias, a menos que se ejecute un cierre de sesión manual.

2. ##  **Interfaz de Login (SaaS Minimalista)** {#interfaz-de-login-(saas-minimalista)}

   La puerta de entrada mantiene la estética de alta tecnología y limpieza visual:

* **Branding:** Logo de Pymo (icono water\_drop) destacado en la parte superior con generoso espacio en blanco.

* **Campos de Entrada:**

  * **Vendedor ID:** Input con icono de badge.

  * **Contraseña:** Input con máscara de seguridad y opción de "mostrar" mediante icono de lock.

* **Botón de Acción:** Botón sólido **"Ingresar"** en color azul primario (**\#4B91E2**).

* **Pie de Página:** Identificación discreta: *"Desarrollada por Apolosoft"*.

3. ## **Lógica de Redirección** {#lógica-de-redirección}

* **Validación de Perfil:** Tras un inicio de sesión exitoso, el sistema valida las credenciales y el estado activo del vendedor en la base de datos.

* **Aterrizaje:** Redirección automática al **Dashboard**, inyectando el vendedor\_id en el contexto global para filtrar toda la información subsiguiente.

# 

# **3\. Dashboard: Gestión de Ruta (Vista Principal)** {#3.-dashboard:-gestión-de-ruta-(vista-principal)}

El Dashboard es el centro de control operativo. Su diseño huye de la tendencia plana (*flat*) para adoptar un estilo de **Tarjetas de Alta Elevación**, utilizando sombras profundas que generan un efecto visual de profundidad (3D sutil) sobre un fondo base de color \#F8FAFC.

## **I. Cabecera (Header de Identidad y Sincronización)** {#i.-cabecera-(header-de-identidad-y-sincronización)}

* **Identidad Visual:** El logotipo de **Pymo** se ubica fijo en la esquina superior izquierda.

* **Personalización:** En el centro de la barra superior, se muestra de forma destacada el **Nombre del Vendedor** (ej. "Juan Pérez").

* **Actualización (Pull-to-Refresh):** La interfaz debe integrar el gesto de *scroll* hacia arriba (tirar hacia abajo en el tope) para forzar la actualización de datos (*re-fetch*) desde Supabase/Mekano.

* **Filtro de Distracciones:** Restricción absoluta de elementos innecesarios; se eliminan menús laterales (hamburguesa) y campanas de notificación para mantener el foco en la venta.

## **II. Panel de Indicadores (KPIs en Cuadrícula)** {#ii.-panel-de-indicadores-(kpis-en-cuadrícula)}

Organización en un **Grid de 2x2** compuesto por cuatro tarjetas independientes de alta elevación. Cada una debe incluir un icono descriptivo y la cifra en negrita:

* **TOTAL:** Icono analytics (Color Azul). Muestra el conteo global de la ruta.

* **PENDIENTES:** Icono schedule (Color Naranja/Amarillo).

* **CERRADAS:** Icono check\_circle (Color Verde).

* **CANCELADAS:** Icono block (Color Rojo).

## **III. Monitor de Ventas (Banner Horizontal)** {#iii.-monitor-de-ventas-(banner-horizontal)}

Una tarjeta única de ancho completo que destaca el rendimiento financiero de la jornada.

* **Contenido:** Etiqueta **"Total Venta Día"** y el monto acumulado en un formato de moneda de gran tamaño.

* **Estilo:** Debe ser visualmente distinta a los KPIs para jerarquizar el valor del dinero recaudado.

## **IV. Acción Prioritaria (Botón de Prospección)** {#iv.-acción-prioritaria-(botón-de-prospección)}

Elemento diseñado para capturar nuevos clientes de forma inmediata.

* **Visual:** Un botón o tarjeta de alto contraste con el texto **"+ Nuevo Cliente"**.

* **Jerarquía:** Es el elemento con mayor "peso visual" de la sección media, diseñado para ser el disparador principal de nuevas visitas.

## **V. Gestión de Visitas (Tarjetas de Trabajo 3D)** {#v.-gestión-de-visitas-(tarjetas-de-trabajo-3d)}

Pila de tarjetas individuales para las visitas programadas, diseñadas como objetos físicos "flotando" sobre el fondo.

* **Estética Visual:**

  * **Elevación:** Uso de sombras proyectadas (*drop-shadow*) intensas y difuminadas.

  * **Geometría:** Esquinas redondeadas obligatorias de **16px a 20px**.

* **Estructura Funcional de la Tarjeta:**

  * **Cabecera:** Nombre del cliente en **negrita** (izquierda) y hora programada (derecha).

  * **Cuerpo de Interacción:** Incluye icono de **Teléfono** (dispara llamada) e icono de **Mapa** (enlace interactivo azul que abre la ubicación exacta en Google Maps).

  * **Base Operativa:** Botón integrado de ancho completo con el texto **"Comenzar visita"**.

# 

# **4\. Formulario: Registro de Nuevo Cliente (Bottom Sheet)** {#4.-formulario:-registro-de-nuevo-cliente-(bottom-sheet)}

Este módulo no es una página independiente, sino un **Plugin Visual** que emerge desde la base, cubriendo el 80% de la pantalla para mantener al vendedor en contexto.

## **I. Diseño y Comportamiento** {#i.-diseño-y-comportamiento}

* **Morfología:** Fondo blanco sólido con bordes superiores redondeados (rounded-t-xl).

* **Indicador de Arrastre:** Incluye una barra superior (*handle*) que indica visualmente que el módulo puede deslizarse hacia abajo para cerrarse.

## **II. Campos de Entrada (Inputs con Iconos)** {#ii.-campos-de-entrada-(inputs-con-iconos)}

Todos los campos deben seguir la estética SaaS (limpios, con bordes sutiles e iconos descriptivos):

* **NIT / Cédula (\*):** Validación numérica estricta. Icono fingerprint.

* **Razón Social / Nombre (\*):** Formato de texto con auto-mayúsculas. Icono store.

* **Teléfono (\*):** Teclado numérico optimizado. Icono call.

* **Dirección (\*):** Icono location\_on.

* **Correo Electrónico:** Validación de formato email. Icono mail.

## **III. Lógica de Transición (Operación Atómica)** {#iii.-lógica-de-transición-(operación-atómica)}

Al final del formulario se ubica el botón **"GUARDAR Y EMPEZAR PEDIDO"**. Al ser presionado, el sistema ejecuta:

1. **Escritura:** Registro inmediato en Supabase.

2. **Vinculación:** Generación automática del ID de Visita.

3. **Salto Atómico:** Navegación directa al **Catálogo de Productos**.

   **Nota:** Se omite el regreso al Dashboard para capitalizar el impulso de venta con el cliente nuevo.

# **5\. Interfaz de Catálogo (Búsqueda y Listado)** {#5.-interfaz-de-catálogo-(búsqueda-y-listado)}

La prioridad de esta interfaz es la **velocidad de identificación** y una navegación fluida sin fricción, optimizada para entornos de movilidad.

1. ## **Cabecera Fija (Sticky Header):** {#cabecera-fija-(sticky-header):}

   * **Buscador Dominante:** Input de ancho completo con icono de lupa. Filtrado reactivo (en tiempo real) por **Nombre**, **SKU** o **Código de Barras**.

   * **Indicador de Carrito:** Ubicado en la esquina superior derecha. Incluye icono shopping\_cart y un **badge dinámico** (círculo con el conteo de ítems) para mantener el estado de la compra siempre visible.

2. ## **Semáforo de Stock (Lógica de Negocio):**  {#semáforo-de-stock-(lógica-de-negocio):}

   Indicadores visuales basados en umbrales de inventario:

   * **Verde (Disponible):** Stock superior al umbral de seguridad. Permite venta sin restricciones.

     * **Amarillo (Pocas Unidades):** Stock crítico. Alerta visual para que el vendedor valide disponibilidad antes de comprometer la venta.

     * **Rojo (Agotado):** Stock en cero. **Bloqueo Automático:** Se deshabilita la capacidad de agregar al carrito para evitar pedidos que el ERP Mekano rechazaría.

# **5\. Detalle de Producto (Expansión / Modal)** {#5.-detalle-de-producto-(expansión-/-modal)}

Este componente es un **Bottom Sheet** que emerge sobre el catálogo, permitiendo la configuración rápida del producto antes de agregarlo al carrito.

## **I. Entorno y Navegación** {#i.-entorno-y-navegación}

* **Fondo Contextual:** Al activarse, el catálogo de fondo debe aplicar un efecto de desenfoque (*blur*) y un velo oscuro (*dimmed overlay*). El usuario debe sentir que sigue en el catálogo pero con un foco prioritario.

* **Botón de Cierre:** Una **"X" circular** nítida en la esquina superior derecha del modal blanco para cerrar la vista sin guardar cambios.

## **II. Identidad y Ficha Técnica** {#ii.-identidad-y-ficha-técnica}

* **Imagen Hero:** Visualización premium del producto en formato cuadrado (**1:1**).

* **Datos Base:** Título en negrita, precio unitario y bloque de descripción técnica (materiales, dimensiones) extraído de Mekano.

* **Estatus de Inventario:** Texto destacado en azul: **"Disponible: \[X\] unidades"**. Este dato precede a la compra para asegurar al vendedor que hay stock suficiente.

## **III. Bloque de Interacción Dual (Selector y Cálculo)** {#iii.-bloque-de-interacción-dual-(selector-y-cálculo)}

Esta sección se organiza en una sola fila horizontal (flex-row) para maximizar la ergonomía y claridad visual:

* **Lado Izquierdo: Selector Ergonómico**

  * **Controles:** Botones circulares de **56px** de diámetro (\+ y \-) con un campo numérico central de **80px**.

  * **Estética:** Los botones deben tener una sombra proyectada que los haga resaltar como elementos táctiles.

* **Lado Derecho: Calculadora de Línea**

  * **Alineación:** El texto debe estar alineado a la derecha, frente al selector.

  * **Visualización:** Muestra la operación en tiempo real: \[Precio\] x \[Cantidad\].

  * **Total de Línea:** Justo debajo de la operación, se muestra el **Resultado Total** en una fuente de mayor tamaño (ej. **24px**), en negrita y color oscuro.

  * **Efecto Visual:** El cambio en el total debe ser instantáneo y animado al presionar los botones del selector.

## **IV. Acción Final: Inserción (Footer)** {#iv.-acción-final:-inserción-(footer)}

* **Estética del Pie:** El fondo detrás del botón debe ser **blanco limpio**, prohibiendo el uso de colores degradados o fondos extraños.

* **Botón Atómico:** Botón de ancho completo en **Azul Primario (\#4B91E2)**.

* **Iconografía:** Incluye el icono de shopping\_cart a la izquierda del texto **"AGREGAR AL CARRITO"**.

# **6\. Módulo de Carrito: Revisión y Check-out** {#6.-módulo-de-carrito:-revisión-y-check-out}

A diferencia de una aplicación de consumo masivo, este carrito está diseñado para la **agilidad operativa** y la **edición masiva** en tiempo real.

1. ## **Cabecera Funcional:** {#cabecera-funcional:}

* **Flecha de Retroceso (Izquierda):** Permite el retorno inmediato al catálogo.

* **Regla de Oro:** Al volver al catálogo, el estado del carrito **no se limpia**. Los productos seleccionados deben persistir en memoria para que el vendedor pueda seguir añadiendo ítems sin interrupciones.

* **Título:** "Resumen del Pedido".

2. ## **Listado de Ítems (Visual e Informativo):**  {#listado-de-ítems-(visual-e-informativo):}

   Cada producto se presenta en una tarjeta o fila optimizada que incluye:

* **Miniatura del Producto:** Fotografía a pequeña escala para una confirmación visual instantánea del artículo.

* **Identificación:** Título del producto en **negrita** y su respectivo **SKU / Código** en la parte inferior.

* **Control de Cantidad Integrado:** Botones de gran tamaño (\+ y \-) dispuestos directamente en la fila. Esto permite ajustes rápidos de volumen sin necesidad de reingresar al detalle del producto.

* **Eliminación Directa:** Icono de papelera (delete) para remover artículos de la lista con un solo toque.

3. ## **Cálculos Dinámicos:** {#cálculos-dinámicos:}

* **Subtotales por Línea:** Cálculo automático de Precio Unitario x Cantidad.

* **Pie de Página (Sticky Footer):** Panel fijo en la base que muestra el **Total General** de forma resaltada.

* **Reactividad:** Cualquier modificación en las cantidades debe actualizar el total de forma **instantánea y animada**, proporcionando feedback inmediato al vendedor.

4. ## **Acción Final:** {#acción-final:}

* **Botón Maestro:** **"FINALIZAR PEDIDO Y GENERAR PDF"**. Un botón de ancho completo, sólido, en color azul primario, que proyecta autoridad y cierre de proceso.

# 

# **7\. Cierre de Proceso: Éxito y Documentación** {#7.-cierre-de-proceso:-éxito-y-documentación}

1. ## **Pantalla de Confirmación (Éxito)** {#pantalla-de-confirmación-(éxito)}

   Tras presionar **"FINALIZAR PEDIDO Y GENERAR PDF"** en el carrito, el sistema bloquea automáticamente cualquier posibilidad de edición para garantizar la inmutabilidad de la transacción y despliega la vista de éxito.

   **Elementos Visuales:**  
* **Icono de Éxito:** Un check\_circle de gran formato, centrado, en color **Primary Blue (\#4B91E2)**.

* **Mensaje de Estado:** "¡Pedido Generado Correctamente\!" en tipografía destacada (**Bold**).

* **Resumen del Pedido:** Una tarjeta minimalista que presenta datos clave para validación rápida:

  * **Número de Pedido:** Asignado por la sincronización Mekano/Supabase.

  * **Monto Total Final:** Cifra definitiva del pedido.

2. ##  **Gestión del PDF y Distribución** {#gestión-del-pdf-y-distribución}

   El sistema debe facilitar que el cliente reciba su comprobante de forma inmediata, eliminando procesos manuales.

* **Acción de Visualización:** Botón principal **"Ver / Descargar PDF"**. Esta acción abre el documento generado por la *Edge Function* para que el vendedor pueda mostrárselo al cliente en el acto.

* **Acción de Envío:** Botón **"Compartir por WhatsApp"**. Integra la funcionalidad nativa del dispositivo para despachar el archivo directamente al contacto del cliente registrado.

## **III. Lógica de Reset (Limpieza de Sesión)** {#iii.-lógica-de-reset-(limpieza-de-sesión)}

Este paso es crítico para la integridad de los datos y la preparación de la siguiente venta. El botón **"Volver al Dashboard"** dispara un **Hard Reset** del estado de la aplicación.

**Acciones Técnicas de Limpieza:**

* **Vacuidad del Carrito:** Se elimina por completo el arreglo de productos en memoria local.

* **Reset de Identificadores:** Se limpian los IDs del cliente y de la visita actual del contexto global.

* **Refresco de Dashboard:** Al aterrizar en la pantalla inicial, el sistema debe ejecutar un **"re-fetch"** de los KPIs para incluir la venta recién realizada en el **Total Vendido del Día**.

## 

# **8\. Reglas de Seguridad e Integridad (Anti-Alucinaciones)** {#8.-reglas-de-seguridad-e-integridad-(anti-alucinaciones)}

Para garantizar un sistema robusto y evitar errores lógicos en la programación, el agente de desarrollo debe seguir estas **tres reglas innegociables**:

## **I. Seguridad a Nivel de Fila (RLS \- Supabase)** {#i.-seguridad-a-nivel-de-fila-(rls---supabase)}

El sistema debe ser **implacablemente privado**. No se confía únicamente en el filtrado del frontend; la seguridad debe nacer y ejecutarse desde la base de datos.

* **Implementación:** Todas las tablas (clientes, visitas, pedidos, detalles\_pedido) deben tener activado el **Row Level Security (RLS)**.

* **Filtro Obligatorio:** Cada consulta ejecutada por la aplicación debe estar vinculada de forma intrínseca al auth.uid().

* **Resultado:** Un vendedor jamás podrá listar, leer, editar o eliminar información de un cliente o pedido que no tenga su vendedor\_id asociado.

## **II. Validación Estricta de Datos (Formularios)** {#ii.-validación-estricta-de-datos-(formularios)}

El formulario de **"Nuevo Cliente"** es la puerta de entrada de datos al ERP Mekano. Para evitar inconsistencias contables o logísticas, no se permiten datos incompletos.

* **Bloqueo de Envío:** El botón **"Guardar y Empezar Pedido"** debe permanecer deshabilitado o disparar una alerta clara si los campos obligatorios (\*) están vacíos.

* **Campos Críticos:** NIT/Cédula (solo caracteres numéricos), Razón Social, Teléfono y Dirección.

* **Sanitización:** El sistema debe limpiar automáticamente espacios en blanco adicionales y caracteres especiales no permitidos antes de la inserción en Supabase.

## **III. Blindaje de Inventario (Manejo de Stock)** {#iii.-blindaje-de-inventario-(manejo-de-stock)}

Para evitar la venta de "humo" (artículos inexistentes), el carrito tiene una restricción física basada en el inventario real sincronizado.

* **Validación en Tiempo Real:** Al agregar un producto o modificar su cantidad, el sistema debe contrastar el valor deseado contra el campo stock\_disponible de la tabla de productos.

* **Restricciones de Interfaz (UI):**

  * **Bloqueo de Incremento:** El botón \+ se deshabilita automáticamente al alcanzar el límite de existencias.

  * **Corrección Automática:** Si se ingresa una cifra manual superior al stock, el sistema debe resetear el valor al máximo disponible y notificar al usuario: *"Solo hay \[X\] unidades disponibles"*.

  * **Bloqueo de Agotados:** Todo producto con stock \= 0 debe aparecer visualmente inhabilitado para su adición al carrito.

### 

# **Guía de Entrega: Configuración en Google AntiGravity** {#guía-de-entrega:-configuración-en-google-antigravity}

Para que el desarrollo sea exitoso, sigue estos pasos al iniciar el proyecto:

1. **Preparación del Archivo:** Guarda todo nuestro trabajo en un archivo llamado `requirements.md`.  
2. **Carga de Contexto:** Sube el archivo a la base de conocimiento de AntiGravity.  
3. **Ejecución del Master Prompt:** Copia y pega el siguiente comando en el chat inicial.

## **Master Prompt para el Agente de Desarrollo** {#master-prompt-para-el-agente-de-desarrollo}

**Instrucción:** Actúa como un **Desarrollador Fullstack Senior experto en Supabase, React y Tailwind CSS**. Tu tarea es construir la aplicación **Pymo** basándote estrictamente en el archivo `requirements.md` adjunto.

**Directrices Innegociables de Arquitectura y UX:**

* **Navegación Lineal:** Prohibido el uso de *Bottom Navigation Bar*. El flujo es un túnel de venta (Dashboard ➔ Catálogo ➔ Carrito ➔ Éxito).  
* **Estética 3D (High Elevation):** La interfaz debe huir del diseño plano. Usa sombras proyectadas profundas (`drop-shadow`) y bordes de `20px` para que las tarjetas parezcan objetos físicos.  
* **Registro Atómico:** El formulario de 'Nuevo Cliente' debe validar campos (NIT, Nombre, Teléfono, Dirección) y, tras guardar en Supabase, realizar un **salto directo al catálogo** inyectando el ID de la nueva visita.  
* **Persistencia del Carrito:** El estado del carrito debe sobrevivir al uso del botón físico o virtual de retroceso para evitar pérdida de datos.  
* **Precisión de Inventario:** El modal de producto debe mostrar el stock numérico exacto y permitir un **Cálculo Dinámico** (Selector de 56px a la izquierda, Cálculo matemático a la derecha).

  **Tu primera tarea:** Antes de escribir código de interfaz, propón el **Esquema SQL (Database Schema)** detallado en Supabase que soporte la relación entre `vendedores`, `clientes`, `visitas`, `productos` (con stock real) y `pedidos` (cabecera y detalle). Asegúrate de incluir las políticas de **RLS (Row Level Security)** para que cada vendedor solo vea su propia data.

  ## **¿Por qué este prompt es efectivo?** {#¿por-qué-este-prompt-es-efectivo?}

* **Establece Autoridad:** Al pedirle que actúe como "Senior", limitas la posibilidad de código "pobre" o poco optimizado.  
* **Prioriza los Datos:** Al exigir el esquema SQL primero, garantizas que la base de la app sea sólida antes de que la IA se ponga a "dibujar" botones.  
* **Blindaje de Diseño:** Incluir lo de "High Elevation" y los "56px" desde el primer segundo le dice a AntiGravity que eres un usuario que sabe exactamente lo que quiere.