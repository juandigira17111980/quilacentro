# QuillacentrO

Marketplace local para descubrir productos y comercios del Centro de Barranquilla.

## Estado Actual

El proyecto esta en fase de saneamiento tecnico y preparacion para evolucionar hacia una web app profesional de comercio local.

Stack principal:

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- Supabase
- TanStack Query

## Requisitos

- Node.js 22 recomendado
- npm como package manager recomendado para esta fase
- Variables de entorno basadas en `.env.example`

> Nota: el repositorio contiene tambien `bun.lock`. Antes de produccion debe tomarse una decision definitiva entre npm y Bun para evitar locks divergentes.

## Configuracion Local

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Completar los valores de Supabase y servicios externos en `.env`.

3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar en desarrollo:

```bash
npm run dev
```

## Scripts

```bash
npm run dev       # Servidor local
npm run build     # Build de produccion
npm run preview   # Preview del build
npm run lint      # Revision ESLint
npm run format    # Formato con Prettier
```

## Documentacion

- `docs/DOCUMENTO_MAESTRO_TECNICO_ROADMAP.md`: vision tecnica, modulos, modelo de datos, endpoints, VPS y roadmap.
- `docs/FASE_0_SANEAMIENTO_TECNICO.md`: checklist de limpieza tecnica inicial.

## Seguridad

- No commitear `.env`.
- No poner `SUPABASE_SERVICE_ROLE_KEY` en variables `VITE_*`.
- No exponer tokens privados en frontend.
- Usar ambientes separados para local, staging y produccion.
