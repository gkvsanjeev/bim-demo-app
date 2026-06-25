---
name: design-system
description: Applies the SkySAFE 2.0 design system tokens, CSS variables, and utility classes. Use when creating UI components, styling pages, or refactoring existing styles to use design tokens instead of hardcoded values.
---

# Design System — SkySAFE 2.0

Source of truth: `DESIGN.md` (repo root).
CSS custom properties and utility classes: `src/styles/tokens.css` (imported globally in `main.tsx`).

Fonts: `--font-sans` = Inter (variable), `--font-mono` = JetBrains Mono. Loaded via Google Fonts in `index.html`.

## Color Tokens

| Variable | Value | Usage |
|---|---|---|
| `--color-primary` | `#000000` | Brand, CTAs |
| `--color-on-primary` | `#ffffff` | Text on primary bg |
| `--color-ink` | `#000000` | All body text on light surfaces |
| `--color-canvas` | `#ffffff` | Page background |
| `--color-inverse-canvas` | `#000000` | Footer, marquee, navy block |
| `--color-inverse-ink` | `#ffffff` | Text on inverse surfaces |
| `--color-surface-soft` | `#f7f7f5` | Card tiles, icon btn bg |
| `--color-hairline` | `#e6e6e6` | 1px borders on inputs/cards |
| `--color-hairline-soft` | `#f1f1f1` | Subtle row separators |
| `--color-accent-magenta` | `#ff3d8b` | Promo CTA — use once per page |
| `--color-success` | `#1ea64a` | Checkmarks, success states |
| `--color-overlay-scrim` | `#000000` | Apply at 60% opacity for modal scrim |

### Color Blocks

| Variable | Value |
|---|---|
| `--color-block-lime` | `#dceeb1` |
| `--color-block-lilac` | `#c5b0f4` |
| `--color-block-cream` | `#f4ecd6` |
| `--color-block-mint` | `#c8e6cd` |
| `--color-block-pink` | `#efd4d4` |
| `--color-block-coral` | `#f3c9b6` |
| `--color-block-navy` | `#1f1d3d` |

## Typography Tokens

Individual property variables (compose in CSS modules):

| Role | Size var | Weight var | Line-height var | Letter-spacing var |
|---|---|---|---|---|
| display-xl | `--font-size-display-xl` (86px) | 340 | 1.00 | -1.72px |
| display-lg | `--font-size-display-lg` (64px) | 340 | 1.10 | -0.96px |
| headline | `--font-size-headline` (26px) | 540 | 1.35 | -0.26px |
| subhead | `--font-size-subhead` (26px) | 340 | 1.35 | -0.26px |
| card-title | `--font-size-card-title` (24px) | 700 | 1.45 | 0 |
| body-lg | `--font-size-body-lg` (20px) | 330 | 1.40 | -0.14px |
| body | `--font-size-body` (18px) | 320 | 1.45 | -0.26px |
| body-sm | `--font-size-body-sm` (16px) | 330 | 1.45 | -0.14px |
| eyebrow | `--font-size-eyebrow` (18px, mono) | 400 | 1.30 | +0.54px |
| caption | `--font-size-caption` (12px, mono) | 400 | 1.00 | +0.60px |

Or use the pre-built **typography utility classes**: `.type-display-xl`, `.type-headline`, `.type-body`, `.type-eyebrow`, `.type-caption`, etc.

## Spacing Tokens

| Variable | Value |
|---|---|
| `--space-hair` | 1px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-sm` | 12px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--space-section` | 96px |

## Border Radius Tokens

| Variable | Value | Use |
|---|---|---|
| `--radius-xs` | 2px | Decorative corners |
| `--radius-sm` | 6px | Chips, sub-nav |
| `--radius-md` | 8px | Inputs, image frames |
| `--radius-lg` | 24px | Cards, color-blocks |
| `--radius-xl` | 32px | Hero panels |
| `--radius-pill` | 50px | All text CTAs |
| `--radius-full` | 9999px | Icon buttons |

## Component Utility Classes

### Buttons
- `.btn-primary` — black pill, white text
- `.btn-secondary` — white pill, black text, hairline border
- `.btn-tertiary` — transparent, text link hit target
- `.btn-icon` — 40px circle, surface-soft bg (light surfaces)
- `.btn-icon-inverse` — 40px circle, 16% white bg (dark/navy surfaces)
- `.btn-magenta` — magenta pill (promo only, once per page)

### Color Blocks
- `.color-block` — base class: radius-lg, xxl padding
- `.color-block-lime` / `-lilac` / `-cream` / `-mint` / `-pink` / `-coral` / `-navy`

### Cards
- `.card` — canvas bg, hairline border, radius-lg, lg padding
- `.card-soft` — surface-soft bg, no border, radius-md, md padding

### Forms
- `.input` — full-width, canvas bg, hairline border, radius-md, body typography

## Design Principles

1. **Monochrome core** — CTAs and body use `--color-primary`/`--color-ink` on `--color-canvas`
2. **Color blocks** — one pastel panel per viewport; always return to white canvas between them
3. **Pill buttons only** — `--radius-pill` for text CTAs, `--radius-full` for icon buttons
4. **Weight, not opacity** — font-weight carries hierarchy; no mid-gray text
5. **Mono for taxonomy** — `--font-mono` only for `.type-eyebrow` / `.type-caption`
6. **Flat elevation** — color blocks replace shadows; only `--shadow-soft` on floating tiles
7. **White canvas gap** — `--space-section` (96px) between every two color-block sections

## Responsive Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Mobile-XS | < 560px | Full-width CTAs, single column |
| Mobile | 560–768px | Display sizes scale down |
| Mobile-L | 768–960px | Color blocks go full-bleed (no radius) |
| Tablet | 960–1280px | 2-column grids, hamburger nav |
| Desktop | 1280–1440px | 3-column grids, default layout |
| Desktop-XL | > 1440px | Max content width 1280px |
