# Decisión — Manejo de llaves de API

**Fecha de decisión:** 2026-05-29
**Decisión actual:** Mantener **una sola llave maestra compartida por todos los tenants**, tal como está implementada hoy (leída de `NEXT_PUBLIC_API_KEY` y enviada desde el cliente en el header `X-API-Key`). Pymo la rota globalmente cuando sea necesario.
**Estado:** Riesgo aceptado conscientemente para la etapa actual (mock, sin ERP conectado). A revisar antes de pasar a producción (ver "Disparadores de revisión").

---

## Cómo funciona hoy

- En `app/config/api.ts` la app usa una sola llave leída de `NEXT_PUBLIC_API_KEY`.
- Se envía en el header `X-API-Key` en cada request al ERP.
- Lo único que cambia por empresa es la URL del ERP (`apiBaseUrl` en `TenantContext.tsx`), no la llave.
- El ERP local de cada empresa valida esa llave en cada request.

## Por qué se acepta este esquema en esta etapa

- Pymo es **dueño del ERP y de la aplicación**; no se expone a terceros.
- El número de empresas (tenants) es pequeño y de confianza.
- Una sola llave es operativamente simple: se cambia un valor y se actualiza para todos.
- Hoy el proyecto trabaja con datos simulados (mock) y **no está conectado a ningún ERP real**, así que la llave actual (`pk_master_change_me`) no da acceso a nada. No hay riesgo activo.

## Riesgos asumidos (documentados a propósito)

Para que la decisión quede tomada con la información completa:

1. **La llave es visible en el navegador.** Todo lo que lleva el prefijo `NEXT_PUBLIC_` queda incrustado en el código que se descarga al cliente. Cualquiera que inspeccione la app puede extraer la llave.
2. **Las URLs de los ERP también viajan al cliente hoy.** `TenantContext.tsx` es código de cliente e incluye los `apiBaseUrl` de todas las empresas. La protección "no conocen la URL" no aplica mientras el registro de tenants viva en el cliente. Además, las URLs siguen un patrón adivinable (`empresa-local.pymo.io`).
3. **La misma llave abre todos los ERP.** Quien tenga la llave (cualquier usuario de la app) podría, en teoría, alcanzar los datos de otra empresa si da con su URL.
4. **Rotación global.** Si la llave se filtra, hay que rotarla para todas las empresas a la vez (y al rotarla, todas se reconectan a la vez).

## Disparadores de revisión (antes de producción)

Cuando se conecte el ERP real, evaluar estos ajustes — **sin necesidad de cambiar a múltiples llaves**, manteniendo la idea de una sola llave:

- **Mover la llave al servidor:** que el navegador hable con el propio servidor Next.js (Route Handlers) y este, en privado, hable con el ERP. La llave deja de viajar al cliente. Misma simplicidad operativa (sigue siendo una sola llave que se rota igual).
- **Lista blanca de IP en el ERP:** que cada ERP solo acepte peticiones desde la IP del servidor central de Pymo. Aunque la llave se filtre, no sirve desde ningún otro origen. Este es el control más efectivo y simple.
- **Mover el registro de tenants (URLs) a una API/BD central**, para que el cliente no reciba las URLs de las demás empresas.

## Resumen

Se mantiene **una sola llave compartida, rotada globalmente**, como decisión válida para esta etapa. Antes de producción, la forma recomendada de robustecerla **sin perder esa simplicidad** es: llave en el servidor + lista blanca de IP en cada ERP. No es necesario migrar a una llave por empresa.
