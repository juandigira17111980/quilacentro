# Blueprint de sincronizacion Lovable

## Objetivo

Alinear Lovable Cloud con el repositorio remoto como fuente de verdad, sin regenerar ni
sobrescribir arquitectura existente.

## Instruccion principal para Lovable

Antes de modificar codigo, audita el repo remoto actual y confirma que Lovable Cloud puede correr
este estado sin errores de build ni runtime.

No reemplaces TanStack Start, Supabase, rutas existentes, dashboard, componentes base ni estructura
actual. No regeneres UI ni endpoints si ya existen.

## Validaciones requeridas

1. Variables de entorno configuradas en Lovable Cloud:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LOVABLE_API_KEY`, solo si se activan funciones AI

2. Migraciones Supabase aplicadas:
   - `supabase/migrations/20260705000100_add_store_operations.sql`
   - `supabase/migrations/20260705000200_add_lead_events.sql`

3. Comandos de validacion:
   - `npm ci`
   - `npm run lint`
   - `npm run build`

4. Flujos funcionales a probar:
   - Home carga correctamente.
   - `/search` lista productos y comercios.
   - `/map` carga mapa y busqueda por cercania.
   - `/store/$slug` carga ficha de tienda.
   - `/product/$id` carga ficha de producto.
   - CTA WhatsApp registra `whatsapp_click` en `lead_events`.
   - CTA Como llegar registra `directions_click` en `lead_events`.
   - Consulta disponibilidad crea `consulta` con estado `nuevo` y registra `availability_submit`.
   - Dashboard muestra metricas reales de interes comercial.

## Reporte esperado

Lovable debe responder con:

- Variables faltantes.
- Migraciones pendientes.
- Errores de build o runtime.
- Archivos que propone tocar.
- Riesgos antes de publicar.
- Recomendacion final: listo para publicar, listo con observaciones, o bloqueado.

## Criterio de exito

Lovable queda sincronizado desde GitHub, no desde cambios generados manualmente en la nube, y la web
mantiene paridad con el repo remoto.
