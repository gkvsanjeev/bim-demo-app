# UI Patterns — SkySAFE 2.0 Design System

> Before writing any UI component, read this file. All patterns here derive from `DESIGN.md` (root).
> CSS custom properties live in `src/styles/tokens.css` — already imported globally in `main.tsx`.
> Never hardcode colors, spacing, font sizes, or border radii. Always use `var(--token-name)`.

---

## Font substitutes

| DESIGN.md font | Substitute loaded in app | Use |
|---|---|---|
| figmaSans | **Inter** (variable, Google Fonts) | All sans-serif text |
| figmaMono | **JetBrains Mono** (variable, Google Fonts) | Eyebrows and captions only — always uppercase |

---

## Typography — how to apply

Use the `.type-*` utility classes from `tokens.css` directly in JSX, or copy the properties into a CSS module.

```tsx
// JSX utility class (simplest)
<h1 className="type-display-xl">Building height review</h1>
<p className="type-body">Submit your IFC+SG BIM file for CAAS review.</p>
<span className="type-eyebrow">Application status</span>

// CSS module — compose the properties manually
// SubmissionForm.module.css
.formLabel {
  font-family: var(--font-sans);
  font-size: var(--font-size-body-lg);
  font-weight: var(--font-weight-body-lg);
  line-height: var(--line-height-body-lg);
  letter-spacing: var(--letter-spacing-body-lg);
  color: var(--color-ink);
}
```

**Typography rules:**
- Hierarchy comes from **font-weight**, not font-size. A 20px label at weight 330 reads as body; at weight 480 it reads as a link/action.
- `figmaMono` (JetBrains Mono) is for `.type-eyebrow` and `.type-caption` only — never for body paragraphs.
- Display sizes (`display-xl`, `display-lg`) belong only in hero sections and page headers.
- Inside a color-block section, use `type-headline` or `type-subhead` for the leading line.

---

## Buttons

All CTAs are pills. No square buttons anywhere.

```tsx
import styles from './MyComponent.module.css'

// Primary — black pill, white text. One per viewport.
<button className="btn-primary">Submit application</button>

// Secondary — white pill, black text. Paired with primary.
<button className="btn-secondary">Save draft</button>

// Tertiary — text-only hit target for nav links and inline actions
<button className="btn-tertiary">View details →</button>

// Icon button — circular, 40px, on light surface
<button className="btn-icon" aria-label="Close panel">✕</button>

// Icon button on dark / inverse surface (navy block, inverse-canvas)
<button className="btn-icon-inverse" aria-label="Back">←</button>

// Magenta promo — one per page maximum, only inside a color-block banner
<button className="btn-magenta">Save your spot</button>
```

**Button rules:**
- Never use more than one `btn-primary` in the same viewport — demote the second one to `btn-secondary`.
- Never use `btn-magenta` outside a promo banner or color-block context.
- All pill buttons must maintain ≥ 44px tap height. The documented paddings achieve this automatically.

---

## Color-block sections (the signature design pattern)

A color-block is a full-content-width panel with rounded corners and generous padding. It is the primary depth and narrative device — it replaces shadows and cards for major page sections.

```tsx
// Basic color-block wrapper
<section className="color-block color-block-lime">
  <span className="type-eyebrow">Assessment results</span>
  <h2 className="type-headline">OLS intersection detected</h2>
  <p className="type-subhead">
    The proposed building penetrates the Transitional Surface by 7.42 m.
  </p>
  <button className="btn-primary">View full report</button>
</section>

// Navy color-block — inverse surface; text is white
<section className="color-block color-block-navy">
  <span className="type-eyebrow">Next steps</span>
  <h2 className="type-headline">Submit for ADP approval</h2>
  <button className="btn-icon-inverse" aria-label="Arrow">→</button>
</section>
```

**Color-block rules:**
- Never stack two color-blocks without a white-canvas gap (`padding: var(--space-section) 0`) between them.
- Never show two color-blocks simultaneously in one viewport.
- Choose one block color per section — do not mix `block-lime` and `block-lilac` in the same section.
- On mobile (< 768px), remove `border-radius` so the block bleeds full-width (poster effect).

### SkySAFE page → color-block mapping

| Page / section | Recommended block | Rationale |
|---|---|---|
| Public dashboard — submission CTA | `color-block-lime` | Action / systems block (home pattern) |
| Submission form — upload area | `color-block-cream` | Warm, neutral — invites file drop |
| CAAS dashboard — flagged submissions | `color-block-coral` | Attention / urgency without red |
| Assessment results — OLS/ILS hit | `color-block-pink` | Soft warning surface |
| Assessment results — all clear | `color-block-mint` | Positive / success surface |
| Next-steps / approval CTA | `color-block-navy` | Weight and authority for final action |
| FAQ / help sections | `color-block-lime` | Consistent with DESIGN.md FAQ pattern |
| Promo banners (inside any block) | `color-block-lilac` + `btn-magenta` | DESIGN.md promo banner pattern |

---

## Cards

```tsx
// Standard card — white background, hairline border, rounded-lg
<div className="card">
  <h3 className="type-card-title">Submission #APP-2025-001</h3>
  <p className="type-body-sm">Submitted 14 Jun 2025 · Pending IO review</p>
</div>

// Soft card — off-white surface, no border, rounded-md. For tiles and thumbnails.
<div className="card-soft">
  <span className="type-eyebrow">IFC file</span>
  <p className="type-body-sm">building_tower_a.ifc</p>
</div>
```

**Card rules:**
- `card` uses a hairline border, not a shadow. Do not add `box-shadow` to cards.
- `card-soft` sits on the white canvas. Do not place it on a color-block (redundant surface).
- Card grids: 3- or 4-column on desktop, 2-column at tablet, 1-column on mobile.

---

## Form inputs

```tsx
// Standard text input
<input
  className="input"
  type="text"
  placeholder="Enter application reference"
/>

// In a CSS module, extend with:
// .myField { /* layout only — no typography or color overrides */ }
```

**Form rules:**
- Never override `border`, `border-radius`, or `font-*` on inputs — the `.input` class handles all of these from tokens.
- Error state: add a red `border-color` override only; do not change background or font.
- Minimum tap target height: 48px on mobile. The documented 12px vertical padding achieves ≥ 44px with 18px body font.

---

## Navigation shell

```tsx
// Top nav shell — sticky, white canvas, 56px height
<nav style={{
  position: 'sticky',
  top: 0,
  height: '56px',
  backgroundColor: 'var(--color-canvas)',
  borderBottom: '1px solid var(--color-hairline)',
  display: 'flex',
  alignItems: 'center',
  padding: `0 var(--space-xl)`,
  gap: 'var(--space-lg)',
  zIndex: 100,
}}>
  <span className="type-card-title">SkySAFE 2.0</span>
  <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)' }}>
    <button className="btn-secondary">Sign out</button>
    <button className="btn-primary">New submission</button>
  </div>
</nav>
```

---

## Elevation rules

| Surface | Treatment |
|---|---|
| Default page, color-block sections | No shadow, no border |
| Cards, form inputs, table cells | `1px solid var(--color-hairline)` |
| Floating tiles, dropdowns | `box-shadow: var(--shadow-soft)` |
| Modals, lightboxes | `box-shadow: var(--shadow-modal)` + scrim at 60% |

Do not add shadows to color-block sections. The color itself is the depth device.

---

## CSS module pattern

In feature modules, use `*.module.css` for layout. Never override design token values — only add layout-specific properties.

```css
/* SubmissionForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 640px;
}

.actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
}
```

```tsx
import styles from './SubmissionForm.module.css'

<form className={styles.form}>
  <input className="input" type="text" placeholder="Application reference" />
  <div className={styles.actions}>
    <button className="btn-secondary">Save draft</button>
    <button className="btn-primary">Submit</button>
  </div>
</form>
```

---

## What NOT to do

- No hardcoded hex values, px values for spacing, or numeric border-radius values anywhere in component code.
- No mid-gray text (e.g., `color: #666`). Hierarchy is weight, not opacity. Use `var(--color-ink)` at different `font-weight` values.
- No square or rounded-rectangle buttons. All CTAs are `border-radius: var(--radius-pill)`.
- No shadows on color-block sections.
- No `font-family` set to anything other than `var(--font-sans)` or `var(--font-mono)`.
- No JetBrains Mono in body paragraphs — mono is taxonomy only.
- Do not place two color-blocks adjacent with no white gap between them.
- Do not introduce Tailwind, MUI, Mantine, or any CSS-in-JS library without confirming with the user.
