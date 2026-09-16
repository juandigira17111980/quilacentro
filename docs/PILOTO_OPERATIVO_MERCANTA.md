# Piloto Operativo Mercanta

## Alcance

Este piloto valida una operación de marketplace sin pagos: un cliente crea una solicitud por un comercio, el inventario se reserva y el comercio cambia el estado hasta entrega o cancelación. La pasarela, facturación, repartidores y cobros quedan fuera de este piloto.

## Orden de ejecución

1. Aplicar primero `20260803000100_harden_identity_authorization.sql`.
2. Aplicar `20260817000100_marketplace_operations.sql`.
3. Configurar las variables de entorno de piloto solo en una terminal segura, nunca en Git ni Coolify.
4. Ejecutar `npm run pilot:provision`.
5. Crear una cuenta de cliente desde `/auth`; esta cuenta no se siembra para no mantener contraseñas adicionales de prueba.
6. Probar con el cliente: producto -> pedido con recoger/domicilio -> cancelación antes de aceptación.
7. Probar con cada comercio: aceptar -> preparar -> listo -> entregar; y rechazar/cancelar verificando que el stock se repone.
8. Verificar como superadministrador: usuarios, comercios, estados y `audit_events`.

## Variables requeridas

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PILOT_SUPERADMIN_EMAIL=
PILOT_SUPERADMIN_PASSWORD=
PILOT_MERCHANT_1_EMAIL=
PILOT_MERCHANT_1_PASSWORD=
PILOT_MERCHANT_2_EMAIL=
PILOT_MERCHANT_2_PASSWORD=
```

El aprovisionador crea exactamente tres cuentas de operación: un superadministrador y dos propietarios de comercios piloto. Es idempotente por correo y slug, no imprime contraseñas y se debe ejecutar una sola vez en el entorno de piloto, con credenciales autorizadas de Supabase.
