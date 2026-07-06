# Panel del Comercio — /dashboard

Implementaré el panel completo de gestión para comercios, con acceso restringido por rol y validación de límites de plan.

## 1. Infraestructura base

**Storage buckets** (vía `supabase--storage_create_bucket`):

- `comercios` (público) — logos y banners
- `productos` (público) — imágenes de productos
- `promociones` (público) — imágenes de promociones

**Migración**: políticas RLS sobre `storage.objects` para que cada comercio solo pueda subir/editar archivos en su propio subdirectorio (`{comercio_id}/...`).

**Rutas** (todas bajo el layout existente `_authenticated` o con guard por rol):

```
src/routes/dashboard.tsx              (layout con sidebar)
src/routes/dashboard.index.tsx        (resumen / KPIs)
src/routes/dashboard.profile.tsx      (perfil + wizard 3 pasos si no existe)
src/routes/dashboard.products.tsx     (tabla + modal CRUD)
src/routes/dashboard.promotions.tsx   (lista + form CRUD)
src/routes/dashboard.queries.tsx      (bandeja de consultas)
```

Guard: cargar `profiles.role` desde sesión; si ≠ `comercio` redirigir a `/`.

## 2. Página por página

### /dashboard (resumen)

- 4 KPI Cards: `count(productos)`, vistas mes (placeholder o `historial_busquedas`), `count(consultas where estado='nuevo')`, `comercios.rating_avg`.
- Gráfico de línea (recharts, ya disponible) — vistas por día últimos 30 días (datos simulados con seed estable basada en `comercio_id` hasta tener tracking real).
- Lista últimas 5 consultas con badge de estado.
- `Alert` si `comercios.estado = 'pendiente'`.

### /dashboard/profile

- Si no existe registro en `comercios` para el `owner_id`: wizard 3 pasos (Info básica → Ubicación → Contacto/horarios) con stepper.
- Si existe: formulario único con tabs o secciones colapsables.
- Campos: nombre, descripción, categoría (select desde `categorias`), dirección, teléfono, whatsapp, email, horarios (JSONB por día), logo, banner, lat/lng.
- Mapa: reutilizar el embed OpenStreetMap con marker draggable mediante un input dual lat/lng + botón "Usar mi ubicación actual" (geolocation API). No introducimos Mapbox aquí (consistente con etapas previas).
- Subida de imágenes a bucket `comercios/{owner_id}/logo.ext` y `/banner.ext`.

### /dashboard/products

- Tabla con `DataTable` shadcn (imagen thumb, nombre, precio, stock, switch disponible, switch destacado, acciones editar/eliminar).
- Botón "Nuevo producto" → Dialog con formulario completo.
- **Validación de plan**: antes de insertar, consultar `count(productos where comercio_id=...)` y comparar contra `planes_suscripcion.max_productos` del plan del comercio. Si excede, mostrar toast y bloquear.
- Imágenes: subida múltiple (1 principal + hasta 4) a `productos/{comercio_id}/{producto_id}/...`, guardadas en `productos.imagenes` (JSONB array de URLs).
- Tags: input con chips (array de strings).
- Atributos: lista dinámica de pares `{ clave, valor }` → `productos.atributos` (JSONB).
- AlertDialog para confirmar eliminación.

### /dashboard/promotions

- Lista (cards) con badge de estado calculado por fechas vs `now()`.
- Form modal: título, descripción, tipo (select), valor, fecha inicio/fin (DatePicker shadcn), producto asociado (select de mis productos, opcional), imagen.
- Insert/update en `promociones`.

### /dashboard/queries

- Lista de `consultas` del comercio con cliente (`profiles.full_name`), producto (`productos.nombre`), mensaje truncado, fecha, badge de estado.
- Click → Sheet/Dialog con mensaje completo + botones "Marcar como leída" / "Marcar como respondida" (update `consultas.estado`).

## 3. Componentes nuevos

```
src/components/dashboard/
  DashboardLayout.tsx       (sidebar + Outlet, guard de rol)
  KpiCard.tsx
  ViewsChart.tsx            (recharts LineChart)
  ProductFormDialog.tsx
  PromotionFormDialog.tsx
  ProfileWizard.tsx
  ImageUploader.tsx         (subida única o múltiple a Storage)
  HoursEditor.tsx           (7 días con apertura/cierre/cerrado)
  TagsInput.tsx
  AttributesEditor.tsx
```

## 4. Hooks/queries

Extender `src/lib/queries.ts` con:

- `myComercioQueryOptions(ownerId)`
- `myProductsQueryOptions(comercioId)`
- `myPromotionsQueryOptions(comercioId)`
- `myQueriesQueryOptions(comercioId)`
- `dashboardKpisQueryOptions(comercioId)`

Mutaciones con `useMutation` + `invalidateQueries`.

## 5. Restricciones respetadas

- No tocamos rutas del cliente (`/`, `/search`, `/product/$id`, `/store/$slug`).
- No tocamos auth ni el header.
- Las RLS ya existen; solo añadimos políticas de `storage.objects`.
- Validación de límite de productos en el cliente antes de insertar (la RLS no puede contar filas eficientemente).

## Criterios de aceptación cubiertos

- Wizard crea el perfil del comercio completo.
- Tabla de productos con CRUD + imágenes en Storage.
- Promociones creadas aparecen automáticamente en el Home (`PromoCard` ya lee de `promociones`).
- Límite de productos validado contra el plan.

¿Apruebas el plan para empezar a implementar?
