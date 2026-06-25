---
name: design-system
description: Applies the SkySAFE 2.0 design system tokens, CSS variables, and utility classes. Use when creating UI components, styling pages, or refactoring existing styles to use design tokens instead of hardcoded values.
---

# Design System — SkySAFE 2.0

The application follows a monochrome core with pastel color-block sections. All styling uses CSS custom properties defined in `src/index.css`.

## Color Tokens

| Variable | Value | Usage |
|---|---|---|
| `--color-primary` | `#000000` | Brand, CTAs, body text |
| `--color-on-primary` | `#ffffff` | Text on primary background |
| `--color-ink` | `#000000` | Body text, headers |
| `--color-accent-magenta` | `#ff3d8b` | Accent highlights |
| `--color-canvas` | `#ffffff` | Page background |
| `--color-inverse-canvas` | `#000000` | Text on dark backgrounds |
| `--color-surface-soft` | `#f7f7f5` | Card surfaces, subtle panels |
| `--color-hairline` | `#e6e6e6` | Borders, dividers |
| `--color-hairline-soft` | `#f1f1f1` | Subtle borders |
| `--color-success` | `#1ea64a` | Success states |
| `--color-overlay-scrim` | `rgba(0, 0, 0, 0.6)` | Modal overlays |

### Color Blocks

| Variable | Value | Usage |
|---|---|---|
| `--color-block-lime` | `#dceeb1` | Lime panels |
| `--color-block-lilac` | `#c5b0f4` | Lilac panels |
| `--color-block-cream` | `#f4ecd6` | Cream panels |
| `--color-block-mint` | `#c8e6cd` | Mint panels |
| `--color-block-pink` | `#efd4d4` | Pink panels |
| `--color-block-coral` | `#f3c9b6` | Coral panels |
| `--color-block-navy` | `#1f1d3d` | Navy panels (inverse text) |

## Typography Tokens

| Variable | Size / Line-Height | Weight | Usage |
|---|---|---|---|
| `--text-display-xl` | 86px / 1.00 | 340 | Hero headings |
| `--text-display-lg` | 64px / 1.10 | 340 | Section headings |
| `--text-headline` | 26px / 1.35 | 540 | Card titles |
| `--text-subhead` | 26px / 1.35 | 340 | Sub-headings |
| `--text-card-title` | 24px / 1.45 | 700 | Emphasized titles |
| `--text-body-lg` | 20px / 1.40 | 330 | Large body text |
| `--text-body` | 18px / 1.45 | 320 | Default body |
| `--text-body-sm` | 16px / 1.45 | 330 | Small body |
| `--text-button` | 20px / 1.40 | 480 | Buttons |
| `--text-eyebrow` | 18px / 1.30 | 400 | Mono, uppercase labels |
| `--text-caption` | 12px / 1.00 | 400 | Mono, uppercase captions |

Fonts: `--font-sans` = Inter, `--font-mono` = JetBrains Mono.

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

| Variable | Value |
|---|---|
| `--radius-xs` | 2px |
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 24px |
| `--radius-xl` | 32px |
| `--radius-pill` | 50px |
| `--radius-full` | 9999px |

## Component Classes

### Buttons

- `.btn-primary` — Black pill button, white text
- `.btn-secondary` — White pill button, black text
- `.btn-tertiary-text` — Plain text link with pill hit target
- `.btn-icon-circular` — 40x40px circle, surface-soft background
- `.btn-magenta-promo` — Magenta pill button

### Forms

- `.input-field` — Canvas background, hairline border, md radius
- `.input-field--error` — Red border, error message below
- `.label` — Body-sm, weight 480
- `.label--required` — Red asterisk
- `.error-msg` — Body-sm, red color
- `.hint` — Body-sm, ink color, weight 320

### Cards & Blocks

- `.card` — Canvas background, hairline border, no shadow
- `.card--soft` — Surface-soft background
- `.color-block` — Radius-lg, xxl padding
- `.color-block--lime`, `--lilac`, `--cream`, `--mint`, `--pink`, `--coral`, `--navy` — Background variants

### Status Badges

- `.badge` — Inline-flex, pill shape
- `.badge--submitted` — Blue text/background
- `.badge--under-review` — Orange text/background
- `.badge--approved` — Green text/background
- `.badge--returned` — Red text/background

## Design Principles

1. **Monochrome core** — All CTAs, body text, headers use `--color-primary` / `--color-ink` on `--color-canvas`
2. **Color blocks** — Pastel panels with `--radius-lg` and `--space-xxl` padding
3. **Pill buttons only** — `--radius-pill` for text CTAs, `--radius-full` for icon buttons
4. **Weight, not opacity** — Hierarchy via font-weight, not color darkness
5. **Mono for taxonomy** — `--font-mono` only for labels, captions — never body copy
6. **Flat elevation** — Color blocks replace shadows for visual depth
7. **White canvas between blocks** — `--space-section` (96px) gap between sections

## Responsive Breakpoints

| Name | Width | Usage |
|---|---|---|
| Mobile-XS | < 560px | Full-width CTAs, single column |
| Mobile | 560–768px | Display sizes scale down |
| Mobile-L | 768–960px | Color blocks full-bleed |
| Tablet | 960–1280px | 2-column grids, hamburger nav |
| Desktop | 1280–1440px | 3-column grids, default layout |
| Desktop-XL | > 1440px | Max content width 1280px |
