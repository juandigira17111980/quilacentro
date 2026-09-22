# Supabase propio de Mercanta

Esta carpeta contiene la capa Mercanta sobre el despliegue oficial de
Supabase self-hosted. La instalacion se fija a `self-hosted/v0.8.1` y se
mantiene separada de la base de datos interna de Coolify.

## Limites de red

- `api-gw` se conecta a la red Docker externa `coolify` solo para recibir
  trafico HTTPS de Traefik.
- PostgreSQL, Auth, Storage, Realtime, Studio y los demas servicios de
  Supabase no publican puertos en el host.
- La unica URL publica es
  `https://supabase.quilacentro.lab.nexostack.app`.
- El firewall del VPS conserva abiertos exclusivamente SSH, HTTP y HTTPS.

## Secretos

El archivo `.env` de Supabase se crea exclusivamente en el VPS con permisos
restrictivos. No se copia al repositorio ni se usa como variable `VITE_*`.
Los valores de aplicacion que se cargan en Coolify son:

- `SUPABASE_URL`
- `SUPABASE_PROJECT_ID=self-hosted`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID=self-hosted`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` permanece solamente en la configuracion del
servidor de Mercanta.

## Proceso operativo

1. Preparar el stack oficial en `/opt/mercanta-supabase` desde el tag fijado.
2. Generar secretos con los scripts oficiales de Supabase directamente en el
   VPS y limitar `.env` a `0600`.
3. Copiar `docker-compose.mercanta.yml` como `docker-compose.override.yml` y
   declarar `COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml` en
   el `.env` oficial para que Compose cargue el override.
4. Validar el archivo resultante con `docker compose config` antes de iniciar.
5. Iniciar el stack y esperar los health checks.
6. Aplicar las migraciones versionadas en `supabase/migrations/`, en orden.
   La migracion `20260921000100_create_mercanta_storage_buckets.sql` crea
   los buckets privados requeridos por las politicas existentes.
7. Instalar los scripts y unidades de `bin/` y `systemd/` en el VPS para
   respaldo diario y health check cada cinco minutos.
8. Cargar datos piloto y crear cuentas mediante la API administrativa.
9. Configurar el SMTP real antes de habilitar recuperacion de contrasenas.
10. Cambiar las variables de la aplicacion Mercanta en Coolify y desplegar por
   GitHub.

## Actualizaciones y respaldo

- Actualizar solo desde una version de Supabase fijada y despues de probar en
  una copia de respaldo.
- El respaldo local diario conserva PostgreSQL, Storage y configuracion sin
  secretos durante siete dias. Instalarlo con permisos `0750` en
  `/usr/local/sbin` y habilitar las unidades systemd incluidas.
- Configurar una segunda copia cifrada fuera del VPS antes de produccion; el
  repositorio no presupone proveedor ni credenciales de almacenamiento.
- Probar restauracion antes de una salida a produccion.
