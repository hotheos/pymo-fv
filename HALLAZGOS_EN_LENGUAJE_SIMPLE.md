# Pymo — Hallazgos y Recomendaciones explicados en lenguaje sencillo

**Fecha:** 2026-05-29

Este documento explica, sin tecnicismos, qué encontré al revisar tu aplicación y qué conviene arreglar. Piensa en la app como si fuera **una tienda física que estás montando**: algunas cosas ya están listas y bonitas, pero hay puertas sin cerradura y todavía no tienes inventario real en las estanterías. Abajo lo explico todo con esa idea en mente.

---

## Primero, lo bueno

Antes de los problemas, vale la pena decir que la base es buena: el diseño es moderno y ordenado, la documentación que se escribió es excelente (poca gente la hace tan completa), y la aplicación "se ve y se siente" como un producto terminado. El trabajo visible está muy bien. Los problemas están "por debajo", en cosas que el usuario no ve pero que importan mucho.

---

## Hallazgos ordenados por gravedad

Usé un semáforo para que sea fácil de leer:

- 🔴 **Rojo:** grave, hay que resolverlo sí o sí antes de usar la app con clientes reales.
- 🟠 **Naranja:** importante, debería resolverse pronto.
- 🟡 **Amarillo:** mediano, conviene arreglarlo pero no es urgente.
- 🟢 **Verde:** detalles menores, mejoras "de pulido".

---

### 🔴 Problemas graves

**1. La "llave maestra" de la aplicación está a la vista de cualquiera.**

Para que la app pueda pedirle información al sistema contable (el ERP Mekano), usa una especie de **llave** que demuestra que tiene permiso. El problema es que esa llave hoy viaja dentro del programa que se descarga al teléfono o computador del usuario, así que **cualquier persona con conocimientos podría encontrarla y copiarla**.

Para empeorarlo, es **una sola llave compartida por todas las empresas** que usan Pymo. Es como si todas las tiendas de un centro comercial tuvieran la misma llave y, además, esa llave estuviera pegada en la puerta. Quien la copie podría entrar a los datos de **cualquier** empresa cliente.

*Qué hay que hacer, en simple:* que la llave se quede guardada en el servidor (un lugar al que el público no tiene acceso) y que la app pida la información "por intermedio" de ese servidor, sin entregarle nunca la llave al usuario. Lo ideal, además, es darle **una llave distinta a cada empresa**.

**2. Todavía no hay datos reales: todo es de "mentira" (demostración).**

Hoy la aplicación funciona con información **inventada y guardada dentro del propio programa**: clientes de ejemplo, productos de ejemplo, ventas de ejemplo. Es perfecto para mostrar cómo se verá, pero **no está conectada de verdad al sistema contable**. Es como una tienda de exhibición con cajas vacías que solo tienen la foto del producto.

Esto también significa que las reglas de seguridad que están escritas en la documentación (por ejemplo, "cada vendedor solo ve sus propios clientes") **todavía no se cumplen de verdad**, porque toda la información está cargada en el dispositivo del usuario. Eso solo se vuelve real cuando exista la conexión con el servidor.

**3. El inicio de sesión es de prueba.**

Hoy se entra con usuario `1` y clave `1` (o `2` y `2`). No hay una verificación real de quién eres. Es normal en esta etapa de demostración, pero **no puede salir así a producción**: sería como una tienda donde la cerradura es de juguete.

---

### 🟠 Problemas importantes

**4. La sesión se guarda en un lugar poco seguro.**

Cuando alguien inicia sesión, el "pase de entrada" se guarda en una parte del navegador que es relativamente fácil de robar si la página llegara a tener un fallo de seguridad. Conviene guardarlo de una forma más protegida.

**5. No hay "historial de cambios" del proyecto (no se está usando control de versiones).**

Los programadores usan una herramienta (Git) que funciona como un **historial de guardado tipo "máquina del tiempo"**: registra cada cambio, permite ver quién cambió qué y volver atrás si algo se daña. Hoy el proyecto **no tiene eso**. Es como escribir un libro importante sin guardar nunca versiones: si algo se borra o se rompe, no hay forma de recuperarlo. Es lo primero que yo activaría.

**6. No hay pruebas automáticas.**

Las "pruebas" son pequeños chequeos automáticos que verifican, cada vez que se hace un cambio, que las cosas importantes siguen funcionando (por ejemplo: "que no se pueda vender un producto sin stock"). Hoy **no existe ninguna**. Sin ellas, cada cambio futuro corre el riesgo de romper algo sin que nadie se dé cuenta hasta que un usuario lo sufra.

**7. La app no avisa bien cuando algo falla.**

Si la aplicación no logra traer la información, hoy **no le muestra al usuario un mensaje claro de error**: simplemente usa los datos de ejemplo en silencio. El usuario podría creer que está viendo datos reales cuando no es así. Falta mostrar pantallas de "cargando..." y de "ocurrió un error, intenta de nuevo".

---

### 🟡 Problemas medianos

**8. Quedaron cosas de prueba dentro del producto.**

Hay restos del trabajo de desarrollo que deberían quitarse antes de publicar: dos productos falsos de prueba ("Producto Sin Imagen" y "Producto Imagen Rota"), un selector de colores marcado como "temporal — quitar después", y varios mensajes internos de depuración. Son como las **etiquetas y plásticos de protección** que hay que retirar antes de abrir la tienda.

**9. Un pequeño defecto visual en la pantalla de inicio de sesión.**

Hay un error de escritura en una instrucción de estilo (se escribió `point-events` en lugar de `pointer-events`). Hoy no causa un problema visible, pero es un defecto que conviene corregir.

**10. Algunas partes del código son demasiado grandes.**

Varios archivos concentran muchísimas funciones en un solo lugar (uno tiene casi 700 líneas). Es como tener **una sola caja gigante donde guardas todo en la casa**: funciona, pero cuesta encontrar las cosas y es más fácil equivocarse. Conviene dividirlos en partes más pequeñas y ordenadas.

**11. Falta validar mejor la información que llega del sistema contable.**

Cuando se conecte al ERP real, conviene **revisar que los datos lleguen en el formato esperado** antes de mostrarlos, para evitar que un dato mal formado rompa la pantalla.

**12. Las imágenes no están optimizadas.**

Las fotos de productos se cargan de forma básica, sin las optimizaciones que ofrece la tecnología que usa la app. Eso puede hacer que cargue un poco más lento o consuma más datos del celular del vendedor.

---

### 🟢 Detalles menores (pulido)

- En el PDF de pedido, el color del encabezado está "fijo" y no toma el color de cada empresa.
- La función para compartir por WhatsApp asume siempre un número de celular colombiano; podría fallar con otros formatos.
- Falta una guía corta de "cómo arrancar el proyecto" para cualquier programador nuevo (la documentación de requisitos sí es excelente).

---

## Qué hacer y en qué orden (plan recomendado)

Lo ordené en fases, de lo más urgente a lo de pulido. Cada fase es como un "paquete de trabajo".

### Fase 0 — Limpieza inmediata (rápida)
- Activar el historial de cambios (Git) y hacer el primer "guardado oficial". *(Resuelve el punto 5.)*
- Retirar las cosas de prueba: productos falsos, selector de color temporal y mensajes de depuración. Corregir el defecto visual del login. *(Puntos 8 y 9.)*

### Fase 1 — Seguridad (lo más importante)
- Esconder la "llave maestra" en el servidor para que el público nunca la vea, y hacer que la app pida los datos a través de ese servidor. *(Punto 1.)*
- Idealmente, darle una llave distinta a cada empresa en vez de una sola compartida. *(Punto 1.)*
- Guardar el "pase de sesión" de forma más segura. *(Punto 4.)*

### Fase 2 — Conexión real con el sistema contable
- Reemplazar los datos de ejemplo por la conexión real al ERP, incluyendo mensajes claros de "cargando" y de error. *(Puntos 2, 3 y 7.)*
- Revisar que los datos lleguen en el formato correcto. *(Punto 11.)*

### Fase 3 — Calidad y proceso
- Crear las pruebas automáticas de los flujos importantes (vender, validar stock, manejar visitas). *(Punto 6.)*
- Poner un "control de calidad automático" que revise el proyecto cada vez que se hace un cambio, antes de aprobarlo.

### Fase 4 — Pulido final
- Dividir los archivos grandes en partes más manejables, optimizar las imágenes y escribir la guía de arranque. *(Puntos 10, 12 y verdes.)*

---

## En una frase

La aplicación **se ve terminada y está bien pensada**, pero por dentro todavía es una **maqueta de demostración con una puerta de seguridad abierta**. Lo prioritario, en este orden, es: (1) cerrar el tema de la llave de seguridad, (2) conectarla de verdad al sistema contable, y (3) montar las buenas prácticas que hoy faltan (historial de cambios y pruebas). Resuelto eso, lo que ya está construido sirve perfectamente como base.
