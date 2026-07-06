# Documento Maestro Tecnico y Roadmap Funcional

Proyecto: QuillacentrO  
Fecha: 2026-07-05  
Alcance: auditoria, diseno tecnico, roadmap funcional y preparacion futura para VPS.  
Estado del documento: version inicial aterrizada al repositorio actual.

## 1. Objetivo del Proyecto

QuillacentrO debe evolucionar hacia una web app de comercio local para centralizar la oferta comercial del Centro de Barranquilla, con posibilidad de escalar luego a otras zonas y ciudades.

La vision funcional combina descubrimiento tipo marketplace, cercania geografica, contacto directo con comercios y, en fases posteriores, pedidos con recogida en tienda o domicilio.

Objetivos principales:

- Permitir que usuarios encuentren productos y comercios cercanos.
- Permitir que comercios registren su negocio y publiquen catalogo.
- Facilitar contacto, consulta, reserva, recogida o domicilio.
- Crear una plataforma administrable, segura y lista para operar en produccion.
- Mantener la arquitectura preparada para migrar de entorno low-code/cloud actual a VPS sin reescrituras traumaticas.

## 2. Estado Actual Identificado

Stack actual:

- Frontend: React 19, TanStack Router, TanStack Start, Tailwind CSS, Radix UI.
- Estado y datos: TanStack Query.
- Backend/API: rutas server-side dentro de TanStack Start.
- Base de datos y auth: Supabase.
- Storage: Supabase Storage.
- IA: Lovable AI Gateway.
- Build: Vite con configuracion Lovable/TanStack.

Estructura relevante:

- `src/routes`: pantallas publicas, dashboard, admin y APIs.
- `src/components`: UI, home, cards, dashboard, site y store.
- `src/lib`: auth, queries, API auth, CORS, storage, AI gateway.
- `src/integrations/supabase`: cliente browser, cliente server y tipos.
- `supabase/migrations`: modelo de datos, RLS, indices, triggers y seeds.

Funcionalidad existente:

- Home comercial.
- Busqueda de productos y comercios.
- Ficha de producto.
- Ficha de comercio.
- Contacto por WhatsApp.
- Consultas internas.
- Favoritos.
- Resenas.
- Dashboard de comercio.
- Gestion de productos.
- Gestion de promociones.
- Perfil de comercio.
- APIs para admin, comercio, cliente, busqueda e IA.

Funcionalidad incompleta o pendiente:

- Admin visual real.
- Mapa completo.
- Carrito.
- Pedidos.
- Entrega a domicilio.
- Recogida programada.
- Pagos.
- Domiciliarios.
- Moderacion operativa completa.
- Monitoreo, backups y despliegue VPS.

## 3. Supuestos Controlados

SUPUESTO CONTROLADO: el primer mercado objetivo es el Centro de Barranquilla. Esto permite iniciar con geografia limitada, reglas logisticas simples y validacion comercial rapida.

SUPUESTO CONTROLADO: en la primera etapa no se requiere microservicios. Un monolito modular con TanStack Start y Supabase es suficiente para MVP y primeras operaciones.

SUPUESTO CONTROLADO: el flujo inicial puede ser de descubrimiento y contacto, antes de incorporar checkout y pagos. Esto reduce complejidad y permite validar oferta/demanda.

SUPUESTO CONTROLADO: Supabase puede mantenerse inicialmente como backend gestionado, incluso si la app web se mueve a VPS. Migrar tambien Postgres/Auth/Storage a infraestructura propia debe evaluarse en una fase posterior.

## 4. Arquitectura Objetivo

Arquitectura recomendada para la siguiente etapa: monolito modular preparado para despliegue portable.

Capas:

- Presentacion: rutas y componentes React.
- Aplicacion: casos de uso server-side en APIs.
- Dominio: reglas de negocio por modulo.
- Datos: Supabase/PostgreSQL, RLS, indices y migraciones.
- Infraestructura: variables de entorno, storage, email, IA, logs, deploy.

Modulos de dominio:

- `catalogo`: productos, categorias, atributos, imagenes, disponibilidad.
- `comercios`: perfil, ubicacion, horarios, estado, plan, reputacion.
- `busqueda`: texto, filtros, geolocalizacion, ranking, historial.
- `clientes`: perfil, favoritos, resenas, historial, consultas.
- `pedidos`: carrito, orden, items, modalidad, estados.
- `logistica`: zonas, tarifas, domiciliarios, asignaciones, tracking.
- `admin`: aprobacion, moderacion, usuarios, categorias, reportes.
- `monetizacion`: planes, destacados, publicidad, comisiones.
- `ia`: asistente, sugerencias, copy, descripcion, pricing.

## 5. Modelo de Datos Actual

Tablas existentes detectadas en migraciones:

- `profiles`
- `zonas`
- `categorias`
- `planes_suscripcion`
- `comercios`
- `productos`
- `promociones`
- `calificaciones`
- `favoritos`
- `consultas`
- `historial_busquedas`
- `publicidad`

Fortalezas:

- Roles definidos desde el inicio.
- RLS presente en tablas principales.
- Soft delete en comercios/productos.
- Indices para busqueda y filtros basicos.
- Relacion comercio-producto clara.
- Storage con politicas por bucket.

Riesgos:

- No existe dominio transaccional de pedido.
- No existe estructura formal de logistica.
- No existe auditoria operativa suficiente.
- Las consultas anonimas pueden requerir rate limiting y proteccion anti-spam.
- Hay uso de service role en APIs server-side, lo cual exige controles estrictos para no exponerlo al cliente.

## 6. Tablas Faltantes Recomendadas

### MVP de pedidos

`carritos`

- `id`
- `cliente_id`
- `estado`: activo, convertido, abandonado
- `created_at`
- `updated_at`

`carrito_items`

- `id`
- `carrito_id`
- `producto_id`
- `comercio_id`
- `cantidad`
- `precio_unitario_snapshot`
- `created_at`

`pedidos`

- `id`
- `cliente_id`
- `comercio_id`
- `codigo`
- `estado`: nuevo, aceptado, rechazado, preparando, listo, en_camino, entregado, cancelado
- `modalidad`: recoger, domicilio
- `subtotal`
- `costo_domicilio`
- `total`
- `nombre_cliente_snapshot`
- `telefono_cliente_snapshot`
- `direccion_entrega`
- `lat_entrega`
- `lng_entrega`
- `notas`
- `created_at`
- `updated_at`

`pedido_items`

- `id`
- `pedido_id`
- `producto_id`
- `nombre_snapshot`
- `sku_snapshot`
- `cantidad`
- `precio_unitario`
- `total_linea`

`pedido_eventos`

- `id`
- `pedido_id`
- `estado_anterior`
- `estado_nuevo`
- `actor_id`
- `actor_tipo`: cliente, comercio, admin, domiciliario, sistema
- `comentario`
- `created_at`

### Logistica

`domiciliarios`

- `id`
- `profile_id`
- `nombre`
- `telefono`
- `estado`: activo, inactivo, suspendido
- `zona_id`
- `created_at`

`entregas`

- `id`
- `pedido_id`
- `domiciliario_id`
- `estado`: pendiente, asignada, recogida, en_camino, entregada, fallida
- `costo`
- `evidencia_url`
- `created_at`
- `updated_at`

`tarifas_envio`

- `id`
- `zona_origen_id`
- `zona_destino_id`
- `radio_km`
- `tarifa_base`
- `tarifa_por_km`
- `activo`

### Operacion y confianza

`reportes_contenido`

- `id`
- `tipo_objeto`: comercio, producto, resena
- `objeto_id`
- `cliente_id`
- `motivo`
- `estado`: nuevo, revisado, descartado, accionado
- `created_at`

`auditoria_admin`

- `id`
- `admin_id`
- `accion`
- `entidad`
- `entidad_id`
- `metadata`
- `created_at`

`notificaciones`

- `id`
- `user_id`
- `tipo`
- `titulo`
- `mensaje`
- `leida`
- `metadata`
- `created_at`

## 7. Pantallas Requeridas

### Cliente

- Home con buscador principal.
- Resultados con filtros y ranking.
- Mapa completo.
- Detalle de producto.
- Detalle de comercio.
- Favoritos.
- Mis consultas.
- Mi historial.
- Carrito.
- Checkout simple.
- Mis pedidos.
- Estado de pedido.

### Comercio

- Onboarding de comercio.
- Perfil del comercio.
- Productos.
- Promociones.
- Consultas.
- Pedidos recibidos.
- Configuracion de domicilio/recogida.
- Estadisticas.
- Plan y limites.

### Admin

- Dashboard global.
- Aprobacion de comercios.
- Gestion de usuarios.
- Gestion de categorias.
- Moderacion de productos.
- Reportes de contenido.
- Gestion de planes.
- Gestion de publicidad/destacados.
- Reportes operativos.
- Auditoria de acciones.

### Logistica

- Panel de entregas.
- Asignacion de domiciliario.
- Estado de entrega.
- Evidencia de entrega.

## 8. Endpoints Recomendados

Convencion sugerida:

- Publicos: `GET /api/...`
- Cliente autenticado: `/api/client/...`
- Comercio autenticado: `/api/store/...`
- Admin: `/api/admin/...`

### Publicos

- `GET /api/search`
- `GET /api/stores`
- `GET /api/stores/:slug`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/promotions`

### Cliente

- `GET /api/client/favorites`
- `POST /api/client/favorites`
- `DELETE /api/client/favorites/:id`
- `POST /api/client/queries`
- `POST /api/client/reviews`
- `GET /api/client/cart`
- `POST /api/client/cart/items`
- `PUT /api/client/cart/items/:id`
- `DELETE /api/client/cart/items/:id`
- `POST /api/client/orders`
- `GET /api/client/orders`
- `GET /api/client/orders/:id`

### Comercio

- `POST /api/store/profile`
- `POST /api/store/products`
- `PUT /api/store/products/:id`
- `DELETE /api/store/products/:id`
- `POST /api/store/promotions`
- `PUT /api/store/promotions/:id`
- `GET /api/store/queries`
- `PUT /api/store/queries/:id`
- `GET /api/store/orders`
- `PUT /api/store/orders/:id/status`
- `GET /api/store/stats`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users`
- `GET /api/admin/stores`
- `PUT /api/admin/stores/:id/status`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `DELETE /api/admin/categories`
- `GET /api/admin/reports`
- `GET /api/admin/content-reports`
- `PUT /api/admin/content-reports/:id`
- `GET /api/admin/audit`

### IA

- `POST /api/ai/search`
- `POST /api/ai/product-description`
- `POST /api/ai/promotion-copy`
- `POST /api/ai/price-suggestion`

## 9. Permisos y Seguridad

Roles:

- `anon`: puede ver comercios activos, productos disponibles, promociones vigentes, categorias activas y crear consultas controladas.
- `cliente`: puede gestionar sus favoritos, consultas, resenas, carrito y pedidos.
- `comercio`: puede gestionar su comercio, productos, promociones, consultas y pedidos recibidos.
- `admin`: puede aprobar, suspender, moderar y gestionar catalogos.
- `super_admin`: puede gestionar configuracion sensible y roles.

Reglas clave:

- Un comercio solo puede modificar sus propios productos.
- Un cliente solo puede ver sus propios pedidos.
- Un comercio solo puede ver pedidos de su comercio.
- Admin puede ver informacion operativa, pero toda accion debe auditarse.
- Service role solo debe usarse en server-side y nunca importarse en componentes cliente.
- Los cambios de rol deben quedar bloqueados para usuarios no admin.
- Las consultas anonimas deben tener rate limiting, captcha o proteccion equivalente.

Hallazgo actual a corregir:

- `.env` esta versionado. Debe moverse a `.env.example` sin valores reales.
- `CORS_HEADERS` permite solo `GET, OPTIONS`, pero hay endpoints `POST`, `PUT`, `DELETE`.
- Falta documentar y separar ambientes: local, staging y production.

## 10. Estrategia de Busqueda y Ranking

Busqueda objetivo:

- Texto por nombre, descripcion, marca, tags y categoria.
- Ranking por cercania cuando hay ubicacion del usuario.
- Ranking por disponibilidad.
- Ranking por precio.
- Ranking por rating.
- Ranking por promociones.
- Penalizacion a comercios inactivos, suspendidos o sin ubicacion.

Recomendacion tecnica:

- Usar full-text search de PostgreSQL para productos.
- Mantener fallback por `ilike` solo para consultas simples.
- Incorporar lat/lng y radio.
- Crear respuesta unificada con productos y comercios.
- Registrar busquedas para analitica y demanda no cubierta.

## 11. Estrategia UX/UI

Principio: simple para usuarios, robusta para operacion.

Cliente:

- Buscador dominante.
- Filtros visibles, no escondidos en exceso.
- Acciones rapidas: WhatsApp, consultar, como llegar, guardar, pedir.
- Resultados comparables por precio, distancia y disponibilidad.
- Mapa como vista real de decision.

Comercio:

- Panel sobrio y operativo.
- Publicar producto en menos de 2 minutos.
- Alertas claras de stock, consultas y pedidos.
- Estados visibles y accionables.

Admin:

- Interfaces densas, no estilo landing.
- Tablas, filtros, estados, auditoria y acciones masivas controladas.

## 12. Preparacion para VPS

Objetivo: que el proyecto pueda salir de entorno actual y correr en un VPS con Node, Docker, Nginx y SSL.

Arquitectura VPS recomendada para primera produccion:

- Ubuntu LTS.
- Nginx como reverse proxy.
- Node runtime o contenedor Docker.
- PM2 o Docker Compose para proceso persistente.
- SSL con Let's Encrypt.
- UFW + Fail2Ban.
- Backups documentados.
- Uptime Kuma o Netdata para monitoreo inicial.

Variables por ambiente:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY`
- `NODE_ENV`
- `APP_URL`
- `ALLOWED_ORIGINS`

Pendientes para VPS:

- Crear `Dockerfile`.
- Crear `docker-compose.yml`.
- Crear `.env.example`.
- Crear health endpoint.
- Crear guia de deploy.
- Crear estrategia de rollback.
- Definir si Supabase se mantiene gestionado o si se migra Postgres/Auth/Storage.

## 13. CI/CD Recomendado

Pipeline minimo:

1. Instalar dependencias.
2. Ejecutar lint.
3. Ejecutar typecheck.
4. Ejecutar build.
5. Empaquetar artefacto o imagen Docker.
6. Deploy a staging.
7. Smoke test.
8. Deploy manual/aprobado a produccion.

Comandos objetivo:

- `npm install` o `bun install`, elegir uno.
- `npm run lint`
- `npm run build`
- `npm run preview`

Decision pendiente:

- Unificar package manager. El repo trae `package-lock.json` y `bun.lock`. Para produccion profesional se recomienda escoger uno y documentarlo.

## 14. Backups y Recuperacion

Backups minimos:

- Base de datos Supabase/Postgres.
- Storage de imagenes.
- Variables y configuraciones.
- Repositorio Git.
- Configuracion Nginx/Docker.

Politica recomendada:

- Backup diario.
- Retencion: 7 diarios, 4 semanales, 3 mensuales.
- Copia offsite.
- Prueba mensual de restauracion.

RPO inicial recomendado: 24 horas.  
RTO inicial recomendado: 4 horas.

## 15. Observabilidad

Minimo antes de produccion:

- Logs de aplicacion.
- Logs de Nginx.
- Health check HTTP.
- Alertas por caida.
- Alertas por CPU, RAM, disco y SSL.
- Registro de errores server-side.
- Registro de acciones admin.

## 16. Prioridades de Implementacion

### Prioridad 0: saneamiento tecnico

- Sacar `.env` del control de versiones.
- Crear `.env.example`.
- Corregir CORS.
- Corregir problemas de codificacion de textos.
- Documentar comandos y entorno.
- Elegir npm o bun como package manager oficial.

### Prioridad 1: MVP profesional de descubrimiento

- Completar mapa.
- Mejorar busqueda por cercania.
- Mejorar ranking.
- Pulir ficha producto.
- Pulir ficha comercio.
- Mejorar flujo de consulta.
- Agregar proteccion anti-spam.

### Prioridad 2: dashboard comercio operativo

- Productos robustos.
- Stock.
- Promociones.
- Consultas.
- Estadisticas.
- Configuracion de recogida/domicilio.

### Prioridad 3: admin real

- Aprobar comercios.
- Gestionar usuarios.
- Gestionar categorias.
- Moderar productos.
- Ver reportes.
- Auditar acciones.

### Prioridad 4: pedidos sin pago complejo

- Carrito.
- Checkout simple.
- Pedido por comercio.
- Recogida o domicilio.
- Estados de pedido.
- Historial cliente.
- Bandeja comercio.

### Prioridad 5: VPS y produccion

- Docker.
- Nginx.
- SSL.
- CI/CD.
- Health checks.
- Backups.
- Monitoreo.
- Staging.

### Prioridad 6: escala comercial

- Pagos.
- Comisiones.
- Domiciliarios.
- Multi-zona.
- Multi-ciudad.
- Publicidad avanzada.
- Analitica de demanda.

## 17. Criterios de Aceptacion por Fase

Fase 0 se acepta cuando:

- No hay secretos versionados.
- Hay `.env.example`.
- El proyecto instala y compila siguiendo README.
- El equipo conoce comandos oficiales.

Fase 1 se acepta cuando:

- Usuario encuentra productos por texto, categoria y cercania.
- Producto muestra tienda, precio, disponibilidad y contacto.
- Comercio muestra ubicacion, horarios, catalogo y reputacion.
- Mapa es funcional.

Fase 2 se acepta cuando:

- Comercio puede operar catalogo sin asistencia tecnica.
- Puede responder consultas.
- Puede ver metricas basicas.

Fase 3 se acepta cuando:

- Admin puede aprobar/suspender comercios.
- Admin puede gestionar categorias.
- Admin puede revisar reportes y metricas.

Fase 4 se acepta cuando:

- Cliente crea pedido.
- Comercio acepta/rechaza pedido.
- Pedido cambia de estado.
- Cliente ve historial.

Fase 5 se acepta cuando:

- App corre en VPS con SSL.
- Hay rollback.
- Hay monitoreo.
- Hay backups probados.

## 18. Riesgos si se Construye sin Este Orden

- Mezclar logica de pedidos con pantallas existentes y generar deuda dificil de corregir.
- Escalar sobre un admin incompleto y perder control operativo.
- Mover a VPS sin variables, logs y health checks claros.
- Crear domicilio sin modelo de estados y terminar operando manualmente.
- Depender demasiado de WhatsApp sin trazabilidad interna.
- Publicar con secretos o configuraciones sensibles mal manejadas.

## 19. Recomendacion Final

La ruta correcta es no convertir QuillacentrO de golpe en un Rappi completo. La ruta profesional es:

1. Consolidar descubrimiento local.
2. Hacer fuerte el onboarding y catalogo de comercios.
3. Crear admin operativo.
4. Agregar pedidos simples.
5. Formalizar domicilio.
6. Preparar VPS y produccion desde la base.

Asi la plataforma puede vender, validar mercado y crecer sin reescritura total.
