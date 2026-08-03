# Mercanta - Fase 1: identidad y autorizacion

## Cambios aplicados

- `super_admin` es el unico rol que puede cambiar roles, suspender/reactivar
  cuentas y solicitar recuperacion de cuentas.
- Un usuario no puede modificar su propio rol ni su propio estado de cuenta.
- La ultima cuenta `super_admin` activa no puede degradarse ni suspenderse.
- Las cuentas suspendidas quedan bloqueadas en API y en los guards de cliente.
- Los comercios solo pueden operar sus recursos cuando su perfil tiene rol
  `comercio`; las tareas administrativas usan sus propias rutas.
- Los cambios de rol, estado de cuenta, estado de comercio, alta de cuenta y
  categorias quedan registrados en `audit_events`.
- La API ya no publica `Access-Control-Allow-Origin: *`; la entrada del
  servidor responde CORS solo a los origenes de `APP_URL` y `ALLOWED_ORIGINS`.

## Migracion requerida

Aplicar antes de desplegar codigo:

```text
supabase/migrations/20260803000100_harden_identity_authorization.sql
```

La migracion es aditiva. Crea `audit_events`, agrega estado de cuenta a
`profiles`, restringe grants directos y crea funciones transaccionales para
cambios sensibles.

## Contratos operativos

### Cambiar rol

`PUT /api/admin/users`

```json
{
  "id": "uuid-del-usuario",
  "role": "admin",
  "reason": "Motivo operativo de al menos 10 caracteres"
}
```

Requiere: `super_admin` activo.

### Suspender o reactivar una cuenta

`PUT /api/admin/users/:id/status`

```json
{
  "account_status": "suspendido",
  "reason": "Motivo operativo de al menos 10 caracteres"
}
```

Requiere: `super_admin` activo. La suspension se replica a Supabase Auth y
evita nuevas sesiones; el estado de perfil bloquea APIs aun si existe una
sesion previa.

### Solicitar recuperacion

`POST /api/admin/users/:id/recovery`

```json
{
  "reason": "Solicitud validada por soporte operativo"
}
```

Requiere: `super_admin` activo. La cuenta debe estar activa. La respuesta no
expone correo, token ni enlace; Supabase envia el correo de recuperacion a la
URL `${APP_URL}/auth`.

### Aprobar o cambiar estado de comercio

`PUT /api/admin/stores/:id/status`

```json
{
  "estado": "activo",
  "reason": "Aprobacion de documentacion comercial"
}
```

Requiere: `admin` o `super_admin` activo. `suspendido` e `inactivo` exigen
motivo de al menos 10 caracteres.

## Evidencia de aceptacion

1. La migracion aparece como aplicada en Supabase.
2. `audit_events` contiene eventos de alta, rol, cuenta, comercio y categoria.
3. Un `admin` recibe 403 al intentar cambiar roles o estados de cuenta.
4. Un `super_admin` no puede modificarse a si mismo ni retirar el ultimo
   super administrador activo.
5. Una cuenta suspendida no puede iniciar sesion ni consumir una API protegida.
6. Un comercio no puede crear ni modificar recursos de otro comercio.
7. Un origen no incluido en `ALLOWED_ORIGINS` no recibe cabecera CORS.

## Configuracion de despliegue

Coolify debe conservar, sin valores de ejemplo:

```text
APP_URL=https://quilacentro.lab.nexostack.app
ALLOWED_ORIGINS=https://quilacentro.lab.nexostack.app
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` solo se usa en rutas de servidor. Nunca debe
tener prefijo `VITE_` ni aparecer en Git.
