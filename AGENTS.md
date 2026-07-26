# Reglas de trabajo para Quilacentro

Este archivo define las reglas obligatorias para cualquier agente Codex que
trabaje en este repositorio. Debe leerse antes de analizar, editar, probar,
versionar o desplegar el proyecto.

## 1. Objetivo del proyecto

Quilacentro es una aplicacion web comercial que debe combinar:

- Experiencia visual premium, clara y consistente.
- UX accesible, responsive y orientada a conversion.
- Frontend mantenible y de alto rendimiento.
- Backend y autenticacion seguros.
- Datos protegidos mediante Supabase y RLS.
- Flujo reproducible desde Codex a GitHub y de GitHub a Coolify.
- Portabilidad: el proyecto debe poder migrarse a otro VPS sin depender de
  Lovable para ejecutarse.

Lovable puede servir como referencia visual o herramienta de maquetacion, pero
no es la fuente de verdad del codigo, la seguridad, los datos ni el despliegue.
La fuente de verdad es este repositorio Git.

## 2. Stack y restricciones tecnicas

Stack principal:

- Node.js 22
- npm 10
- React 19
- TanStack Start y TanStack Router
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- Coolify sobre VPS

Reglas:

- Respetar las versiones declaradas en `package.json`, `.nvmrc` y lockfiles.
- Usar `npm` como gestor principal para CI y despliegues.
- No cambiar framework, router, gestor de paquetes o proveedor de datos sin
  una justificacion arquitectonica y autorizacion expresa del usuario.
- Reutilizar componentes, patrones y utilidades existentes antes de crear
  abstracciones nuevas.
- Evitar dependencias nuevas si la necesidad puede resolverse de manera clara
  con las herramientas ya instaladas.

## 3. Lectura inicial obligatoria

Antes de editar:

1. Ejecutar `git status --short`.
2. Identificar la rama y el remoto activos.
3. Leer `package.json`, `vite.config.ts`, `.env.example` y los archivos
   directamente relacionados con la tarea.
4. Revisar cambios locales existentes antes de tocar un archivo modificado.
5. Considerar todos los cambios previos como trabajo del usuario.

Nunca eliminar, revertir, sobrescribir ni formatear masivamente cambios que no
hayan sido creados por el agente durante la tarea actual.

## 4. Orquestacion profesional

No activar todos los especialistas por rutina. Elegir solo los necesarios
segun el alcance y mantener un responsable tecnico claro.

Usar los skills instalados con esta logica:

- `orquestador-proyectos-premium`: mejoras integrales o solicitudes de
  elevar el proyecto a nivel profesional.
- `arquitecto-software-principal`: arquitectura, limites de modulos, deuda
  tecnica y decisiones transversales.
- `director-creativo-ai`: direccion visual, concepto creativo y coherencia de
  marca.
- `chief-ux-officer`: flujos, jerarquia, accesibilidad, responsive y
  usabilidad.
- `landing-cro-specialist`: paginas de captacion, ventas o conversion.
- `copywriter-senior`: textos comerciales, propuestas de valor y CTA.
- `desarrollador-web-fullstack`: implementacion web y componentes.
- `arquitecto-backend-desktop`: API, autenticacion, autorizacion y logica de
  servidor.
- `arquitecto-dba-empresarial`: modelo de datos, consultas, indices,
  migraciones y politicas RLS.
- `git-github-devops`: ramas, commits, PR, conflictos y automatizacion GitHub.
- `arquitecto-infra-devops`: Coolify, Docker, VPS, DNS, SSL, backups y
  monitoreo.
- `auditor-qa-final`: revision integral antes de publicar o promover cambios.

Para tareas completas, el orden recomendado es:

1. Arquitectura y riesgos.
2. Direccion creativa y UX.
3. CRO y copy cuando correspondan.
4. Implementacion frontend y backend.
5. Datos y seguridad.
6. Git e infraestructura.
7. QA final.

## 5. Reglas visuales y UX

- Mantener una experiencia premium sin sacrificar claridad o rendimiento.
- Diseñar primero el flujo y la jerarquia; la decoracion es secundaria.
- Usar los componentes y tokens existentes antes de introducir estilos
  aislados.
- Usar iconos de Lucide cuando exista un icono adecuado.
- Mantener responsive real para movil, tableta y escritorio.
- No permitir texto cortado, controles superpuestos ni saltos de layout.
- Incluir estados de carga, vacio, error, exito, deshabilitado y foco.
- Mantener contraste, navegacion por teclado, etiquetas y semantica accesible.
- Evitar UI generica, exceso de tarjetas, gradientes decorativos y animaciones
  que no ayuden al usuario.
- No modificar identidad, logotipo, colores principales o copy de marca sin
  revisar el contexto existente y explicar el impacto.

## 6. Frontend y calidad de codigo

- TypeScript debe conservar tipado estricto; evitar `any` salvo justificacion.
- No duplicar logica de negocio entre rutas y componentes.
- Mantener componentes pequenos y con responsabilidades claras.
- Validar entradas con esquemas existentes o Zod cuando corresponda.
- No introducir secretos, tokens ni credenciales en codigo del cliente.
- Toda variable `VITE_*` se considera publica y visible en el navegador.
- Evitar llamadas privilegiadas a Supabase desde componentes cliente.
- Mantener manejo explicito de errores y mensajes seguros para el usuario.
- No dejar `console.log`, datos de prueba o bypass de autenticacion en cambios
  destinados al laboratorio compartido.

## 7. Backend, Supabase y seguridad

- Aplicar minimo privilegio en todas las operaciones.
- `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente de servidor y nunca puede
  llevar prefijo `VITE_`.
- No exponer service role, claves privadas, tokens o contrasenas en commits,
  capturas, logs o respuestas.
- Mantener `.env` fuera de Git. Actualizar `.env.example` solo con nombres y
  valores ficticios.
- Toda tabla con datos de usuarios o comercios debe tener RLS revisado.
- Las politicas deben validar identidad, pertenencia y rol; no confiar solo en
  filtros del frontend.
- Los cambios de esquema deben implementarse mediante migraciones versionadas.
- No ejecutar cambios destructivos en datos o esquema sin backup, evaluacion
  de impacto y aprobacion del usuario.
- No usar datos reales de clientes en pruebas locales.
- Validar autorizacion en el servidor para rutas administrativas.
- Registrar errores utiles sin incluir PII ni secretos.

Variables actualmente previstas:

```text
SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
LOVABLE_API_KEY
NODE_ENV
APP_URL
ALLOWED_ORIGINS
```

Las claves sensibles solo se configuran en Coolify cuando una funcion del
servidor realmente las necesite.

## 8. Git y GitHub

- Nunca trabajar directamente sobre cambios locales del usuario sin
  preservarlos.
- No usar `git reset --hard`, `git clean -fd`, `git checkout --` ni comandos
  destructivos salvo solicitud expresa.
- Para cambios nuevos, preferir ramas `codex/<descripcion-corta>`.
- Hacer commits pequenos, coherentes y con mensajes descriptivos.
- No mezclar refactors no relacionados con una correccion o funcionalidad.
- Revisar `git diff` y ejecutar las validaciones antes de cada commit.
- No hacer `push`, merge, rebase, PR o deploy sin que la tarea lo requiera.
- Nunca forzar un push a ramas compartidas.
- No incluir `.env`, dumps, credenciales, logs temporales, `node_modules`,
  artefactos de build ni capturas sensibles.

Estado del laboratorio:

```text
Repositorio: juandigira17111980/quilacentro
Aplicacion Coolify: quilacentro-lab
Rama desplegada: codex/coolify-deploy
URL: https://quilacentro.lab.nexostack.app
```

La rama de despliegue se considera protegida. No reemplazarla, eliminarla ni
cambiar la rama configurada en Coolify sin autorizacion.

## 9. Configuracion obligatoria de Coolify

La aplicacion es un servidor Node, no un sitio estatico.

```text
Build Pack: Nixpacks
Install Command: npm ci
Build Command: npm run build
Start Command: npm run start
Base Directory: /
Publish Directory: vacio
Port Exposes: 3000
Domain: https://quilacentro.lab.nexostack.app
```

Reglas criticas:

- `Publish Directory` debe quedar completamente vacio.
- No colocar `/` en `Publish Directory`; hacerlo inicia Caddy como sitio
  estatico y provoca un 404.
- No mapear el puerto 3000 al host. Debe exponerse solo a la red interna de
  Coolify.
- No abrir 3000, 6001, 6002, 8000 o 8080 en el firewall publico.
- Mantener publicos unicamente 80 y 443; SSH 22 debe conservar sus controles.
- HTTPS lo administra Coolify mediante Let's Encrypt.
- Los registros del laboratorio permanecen `DNS only` en Cloudflare mientras
  Coolify gestione directamente los certificados.

Para ejecutar como Node, la rama desplegable debe conservar:

```json
"start": "node .output/server/index.mjs"
```

Y `vite.config.ts` debe generar salida compatible con servidor Node:

```ts
nitro: {
  preset: "node-server",
}
```

No volver al preset Cloudflare para despliegues en este VPS.

## 10. Flujo de trabajo y despliegue

Flujo normal:

1. Analizar requerimiento y riesgos.
2. Proteger los cambios locales existentes.
3. Crear o usar una rama de trabajo apropiada.
4. Implementar el cambio con alcance controlado.
5. Ejecutar validaciones locales.
6. Revisar diff, seguridad y migraciones.
7. Commit y push solo cuando corresponda.
8. Integrar mediante PR o procedimiento aprobado.
9. Desplegar desde GitHub a Coolify.
10. Validar runtime, HTTPS, logs y flujo funcional.

Nunca editar archivos directamente dentro del contenedor de produccion. Todo
cambio de aplicacion debe nacer en Git y ser reproducible.

## 11. Validaciones obligatorias

Para cambios normales:

```bash
npm ci
npm run lint
npm run build
```

Si el repositorio incorpora pruebas, ejecutar tambien la suite pertinente.

Para cambios visuales:

- Revisar movil y escritorio.
- Verificar consola del navegador.
- Confirmar que no existan recursos rotos ni desbordamientos.
- Probar estados interactivos y rutas afectadas.

Para cambios de autenticacion, backend o datos:

- Probar usuario autorizado y no autorizado.
- Revisar RLS y limites entre cliente y servidor.
- Verificar que los logs no expongan secretos.
- Probar fallos de red y entradas invalidas.

Despues de desplegar:

- Confirmar estado `finished` en Coolify.
- Confirmar que el proceso Node este activo.
- Confirmar respuesta HTTPS 200 en la ruta publica esperada.
- Revisar logs del contenedor.
- Validar certificado TLS.
- Ejecutar una prueba funcional manual de las rutas modificadas.

## 12. Criterio de finalizacion

Una tarea no esta terminada solo porque compile. Debe:

- Cumplir el objetivo funcional.
- Respetar UX y responsive.
- No introducir regresiones conocidas.
- Mantener secretos fuera de Git y del navegador.
- Incluir migraciones o documentacion cuando sean necesarias.
- Superar las validaciones aplicables.
- Informar claramente archivos modificados, pruebas realizadas y riesgos
  pendientes.

Si falta una credencial, acceso externo o decision del usuario, avanzar todo lo
posible de forma segura y describir el bloqueo exacto sin inventar valores.
