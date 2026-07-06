# Fase 0 - Saneamiento Tecnico

Fecha: 2026-07-05

## Objetivo

Preparar el repositorio para trabajo profesional antes de construir nuevas funcionalidades. Esta fase reduce riesgo de seguridad, facilita ejecucion local y deja bases claras para una futura migracion a VPS.

## Cambios Aplicados

- Se agrego `.env` y variantes al `.gitignore`.
- Se creo `.env.example` sin valores reales.
- Se amplio la configuracion CORS base para cubrir `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `OPTIONS`.
- Se creo `README.md` con requisitos, configuracion local, scripts y reglas de seguridad.
- Se declaro Node 22 y npm como runtime/package manager recomendado en `.nvmrc` y `package.json`.
- Se ajusto Prettier para tolerar saltos de linea del entorno local.
- Se corrigio un problema de React Hooks en `src/routes/product.$id.tsx`.
- Se bajo `@typescript-eslint/no-explicit-any` a warning para permitir saneamiento gradual de APIs.
- Se mantiene el Documento Maestro Tecnico en `docs/DOCUMENTO_MAESTRO_TECNICO_ROADMAP.md`.

## Pendientes Recomendados

- Eliminar o dejar sin uso `bun.lock` cuando se confirme que npm sera el estandar definitivo.
- Corregir textos con problemas de codificacion visibles en la UI.
- Tipar gradualmente las rutas API que hoy usan `any`.
- Separar constantes/helpers de algunos componentes UI para eliminar warnings de Fast Refresh.
- Agregar health endpoint para despliegue VPS.
- Agregar Dockerfile y docker-compose en la fase de preparacion de despliegue.
- Crear pipeline CI/CD cuando se defina rama y estrategia de despliegue.

## Validaciones Esperadas

Ejecutadas el 2026-07-05:

```bash
npm install
npm run lint
npm run build
npm audit --audit-level=moderate
```

Resultado:

- `npm install`: OK.
- `npm run lint`: OK, sin errores; quedan warnings por `any` en APIs y Fast Refresh en algunos componentes UI.
- `npm run build`: OK.
- `npm audit --audit-level=moderate`: OK. Queda 1 vulnerabilidad baja en `esbuild` usada por Vite dev server en Windows.

## Criterio de Salida

La Fase 0 se considera lista cuando:

- No hay secretos versionados.
- Existe `.env.example`.
- El proyecto tiene README operativo.
- Los comandos de instalacion y build estan claros.
- Hay una decision documentada sobre package manager.
