# Merkanta: CRM, mapa y preparación de Wompi

## Alcance

- El nombre visible pasa a **Merkanta**. Los nombres técnicos existentes de archivos, rutas y almacenamiento permanecen intactos para no romper enlaces ni datos.
- Explorar comercios permite alternar Lista/Mapa conservando búsqueda, categoría y ubicación. El mapa muestra todos los puntos con coordenadas y una ficha de acceso a la tienda y la ruta.
- Cada comercio dispone de oportunidades propias con etapa, responsable, próxima acción y notas. Una consulta de la plataforma crea su oportunidad automáticamente; los clics anónimos a WhatsApp siguen siendo solo métricas.
- La administración ve un resumen agregado por comercio. Solo `super_admin` puede configurar Wompi; esto **no activa cobros**.

## Despliegue controlado

1. Revisar el diff y ejecutar `npm ci`, `npm run lint`, `npx tsc --noEmit` y `npm run build`. Las variables públicas `VITE_SUPABASE_*` deben estar presentes **durante el build**; la clave de servicio solo en runtime del servidor.
2. Respaldar la base de datos de Merkanta. Aplicar en orden `20260929000100_store_crm.sql` y `20260929000200_wompi_config.sql` en su proyecto Supabase propio. No ejecutar estas migraciones en la base de otro proyecto.
3. Configurar `PAYMENT_CONFIG_KEY` como secreto del servidor en Coolify. Debe contener 32 bytes aleatorios codificados en base64 y conservarse también en el respaldo seguro de secretos. Si se pierde, las llaves Wompi cifradas no podrán recuperarse.
4. Desplegar la rama aprobada mediante GitHub → Coolify. Verificar `/api/health`, el mapa, una consulta real de prueba y que el propietario vea únicamente los leads de su comercio.
5. En administración, `super_admin` puede guardar por separado las cuatro llaves Wompi de pruebas y producción. Ninguna se devuelve por la API. La plataforma no procesa pagos hasta implementar y aprobar checkout, webhook, conciliación, reembolsos y el modelo de receptor de fondos.

## Pruebas de aceptación

- Una consulta nueva genera exactamente una oportunidad en su comercio; el cliente anónimo no obtiene acceso al CRM.
- El usuario de una tienda no puede leer ni modificar oportunidades de otra, aunque conozca su UUID. El equipo `atencion` solo opera en tiendas con membresía activa.
- Cambiar etapa, responsable o seguimiento genera actividad en la misma transacción de la base. Guardar una nota deja una actividad independiente.
- Una búsqueda por producto muestra en el mapa los comercios coincidentes; Lista y Mapa mantienen los filtros.
- Un usuario no autenticado recibe 401 en CRM y configuración Wompi; un administrador común no puede guardar llaves.
- No se exponen llaves privadas ni secretos de Wompi en HTML, respuestas, logs o `VITE_*`.
