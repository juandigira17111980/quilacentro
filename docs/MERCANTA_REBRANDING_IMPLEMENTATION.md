# Mercanta Rebranding Implementation

## Objective

Rebrand the user-facing Quilla Centro marketplace as Mercanta while preserving the existing technical project name, routes, data model, roles, and Supabase integration.

## Brand Direction

- Brand name: Mercanta
- Master line: Busca menos. Encuentra mas.
- Supporting promise: El comercio local, mas cerca.
- Market: Centro de Barranquilla, Colombia
- Personality: cercana, confiable, activa, profesional, urbana y caribena.

## Color System: Caribe Confiable

| Role               | Token                   | Value     | Product use                                    |
| ------------------ | ----------------------- | --------- | ---------------------------------------------- |
| Primary brand      | `primary`               | `#3B1165` | Navigation, headings, primary actions          |
| Conversion         | `accent` / `brand-gold` | `#D6A51A` | Benefits, highlights, selected value CTAs      |
| Trust and location | `brand-teal`            | `#007F86` | Search, map, location and informational states |
| Energy             | `brand-coral`           | `#E95B49` | Promotions and urgent states only              |
| Surface            | `background`            | `#FFFCF7` | Main background                                |
| Ink                | `foreground`            | `#1B1124` | Copy, footer and dark areas                    |

## Implemented Scope

- New Mercanta logo assets in `public/brand/`.
- Editorial Centro de Barranquilla hero image in `public/images/`.
- Global Mercanta design tokens, typography and dark mode in `src/styles.css`.
- New header, footer, login identity and AI assistant copy.
- Conversion-led home hero and rewritten user-facing copy.
- Updated cards, categories, offer banner, commerce CTA and stats bar.
- Public metadata, social metadata and PWA manifest renamed to Mercanta.
- Public route titles renamed to Mercanta.
- Desktop and mobile visual QA completed on the landing page.

## Content Rules

- Use "Busca menos. Encuentra mas." only in strategic launch positions such as hero, launch creative or campaign headers.
- Use "El comercio local, mas cerca." as support copy, not as a competing headline.
- Prefer direct actions: "Buscar ahora", "Ver tiendas", "Consultar disponibilidad", "Como llegar".
- Do not use the former public name Quilla Centro or QuillacentrO in frontend copy, browser metadata, or campaigns.

## Asset Rules

- The supplied Mercanta logo is used as the source asset. Replace raster derivatives with official SVG files once they are available.
- Use real, editorial, local commerce photography. Avoid generic malls, unrelated restaurant stock, low quality catalog imagery, and text embedded in photographs.
- Keep hero images free of baked-in copy and logos so responsive overlays remain accessible.

## QA Evidence

- `npm run lint`: passes with 0 errors. Existing repository warnings remain outside this rebrand scope.
- `npm run build`: passes.
- Browser QA: desktop 1440px and mobile 390px landing views verified without horizontal overflow.

## Next Visual Iteration

1. Replace the supplied raster logo with approved SVG, favicon, and PWA icon exports.
2. Add a curated local photography library for campaigns, categories, and commerce profiles.
3. Apply the same content and visual audit to authenticated dashboard workflows after merchant feedback.
4. Add image optimization and responsive WebP/AVIF variants before production scale.
