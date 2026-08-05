# Claymorphism Design Specification

> Definitive visual reference derived from the provided UI screenshots (soft lavender clay surfaces + muted sage accent controls). This document replaces prior “toy-button / solid offset shadow” guidance, which does **not** match the reference style.

---

## 1. Core Claymorphism Principles (200-300 words)

This system treats every interactive surface as a soft, matte, molded object—closer to silicone or clay than to glass, metal, or flat Material UI. Depth comes almost entirely from **paired light and dark shadows**, not from borders, strokes, or saturated color contrast. Components share the same cool lavender base as the page so form is revealed by lighting alone; accent controls introduce a single muted sage green that still obeys the same light model.

Light is fixed at the **top-left (~315°)**. Raised elements cast a soft cool-lavender shadow toward the bottom-right and receive a white outer glow toward the top-left. Volume (the “puffy” clay look) is completed with **dual inset shadows**: a white inner highlight on the top/left rim and a darker lavender (or darker sage) inner shade on the bottom/right rim. Surfaces are fully opaque and matte—no blur-fill glass, no specular hotspots, no hard bevels.

Geometry is uniformly soft: squircles for nav tiles, capsules for CTAs, full circles for icon wells and nested camera controls. Edges are defined by shadow falloff, never by 1px strokes. Nested depth is allowed and characteristic—white rings around sage discs, icon wells floating on cards, glyphs that read as gently embossed or recessed into the clay. Content stays low-contrast and desaturated so typography and icons feel printed into the material rather than pasted on top. Crowding breaks the illusion; generous padding and calm hierarchy are part of the material language.

---

## 2. Color Palette Specification (Hex Codes)

Colors below are sampled from the reference screenshots (interior solid regions). Use these tokens exactly; do not substitute brighter Tailwind greens/purples or neutral gray shadows.

### Canvas & soft clay (lavender family)

| Token | Hex | Role |
|---|---|---|
| `--clay-bg` | `#E5E1EE` | Page / screen background |
| `--clay-surface` | `#E7E1F0` | Raised soft tiles, cards, icon wells (same family as bg) |
| `--clay-surface-soft` | `#E4E0EC` | Alternate face tone when sampling shows slightly cooler face |
| `--clay-highlight` | `#FFFFFF` | Outer top-left highlight & inner rim light |
| `--clay-shadow` | `#D5CFE7` | Outer bottom-right shadow (lavender, never `#000`) |
| `--clay-shadow-deep` | `#C8C2D8` | Stronger contact / deeper inset on large cards |
| `--clay-divider` | `#D5CFE7` | Hairline column rules at ~35–45% opacity |

### Accent clay (sage family)

| Token | Hex | Role |
|---|---|---|
| `--clay-sage` | `#9EAFAC` | Primary CTA / accent button face; camera disc |
| `--clay-sage-highlight` | `#B7C6C2` | Lighter sage for top-left inner rim on sage controls |
| `--clay-sage-shadow` | `#7F908C` | Darker sage for bottom-right outer/inner shade on sage controls |
| `--clay-sage-icon` | `#697B75` | Recessed camera glyph / embossed icon body on sage |
| `--clay-on-sage` | `#1A2824` | Icon + label on sage CTAs (near-charcoal green) |

### Content (typography & glyphs on lavender)

| Token | Hex | Role |
|---|---|---|
| `--clay-heading` | `#2D2D42` | Card titles (e.g. “About Granite”) |
| `--clay-body` | `#7E7993` | Supporting paragraph text |
| `--clay-muted` | `#8A85A8` | Nav labels, stat labels, outline icons on soft clay |
| `--clay-muted-strong` | `#78729A` | Filled icons / slightly stronger secondary type |

### Structural whites

| Token | Hex | Role |
|---|---|---|
| `--clay-ring` | `#FFFFFF` | Thick outer ring around nested circular controls |

**Hard rules**

- Shadows on lavender surfaces use `--clay-shadow` / `--clay-shadow-deep`, not gray (`#CBD5E1`) or black.
- Shadows on sage surfaces tint sage (`--clay-sage-shadow`), optionally mixed with a soft lavender atmospheric shadow.
- Do not introduce coral, bright blue, amber, or other accent hues—the references use **only** lavender + sage + white.

---

## 3. Lighting and Shadow Mechanics (Specific values/descriptions)

### Global light model

- **Direction:** Top-left → bottom-right.
- **Material response:** Diffuse only. Large blur, low contrast, no hard contact slabs.
- **Forbidden (from failed prior attempts):** Solid offset shadows such as `0 6px 0 0 #color`. That “Duolingo extrusion” look is **not** present in these screenshots.

### Canonical elevated soft-clay shadow (lavender surface)

Use on Home/History tiles, stats card shell, icon circles, white camera ring:

```css
box-shadow:
  10px 10px 20px var(--clay-shadow),
  -8px -8px 18px var(--clay-highlight),
  inset -5px -5px 12px rgba(255, 255, 255, 0.85),
  inset 5px 5px 12px rgba(213, 207, 231, 0.65);
```

### Canonical elevated sage control

Use on “Learn More” capsules and the sage camera disc:

```css
background: var(--clay-sage);
box-shadow:
  8px 10px 18px rgba(127, 144, 140, 0.45),
  -4px -4px 12px rgba(255, 255, 255, 0.55),
  inset -4px -4px 10px rgba(183, 198, 194, 0.75),
  inset 4px 5px 12px rgba(127, 144, 140, 0.55);
```

### Nested / recessed glyph (camera icon into sage)

Invert the inset pair so the glyph reads carved into the disc:

```css
/* Approximate recessed clay cut */
box-shadow:
  inset 3px 3px 6px rgba(75, 91, 87, 0.55),
  inset -2px -2px 5px rgba(183, 198, 194, 0.45);
color: var(--clay-sage-icon);
```

### Card elevation (large content cards)

Slightly larger blur, still soft—no thick colored “platform” slab:

```css
box-shadow:
  12px 14px 28px rgba(213, 207, 231, 0.85),
  -8px -8px 22px rgba(255, 255, 255, 0.9),
  inset -3px -3px 8px rgba(255, 255, 255, 0.7),
  inset 3px 3px 10px rgba(213, 207, 231, 0.45);
```

### Interaction states (inferred — not shown as separate frames)

Screenshots only show resting elevation. Until dedicated pressed frames exist, keep motion subtle:

- **Hover:** Reduce outer offsets by ~2px; preserve inset clay rims.
- **Active:** Further flatten outer shadows; optionally deepen inset shadows to suggest compression.
- **Transition:** `120–160ms ease-out` on `box-shadow` and `transform` only.

**Limitation:** Exact blur radii / opacities are best-fit reconstructions from raster screenshots; match visually against the PNGs and tune ±2–4px blur if a surface reads too harsh or too flat.

---

## 4. Component Structure and Edge Treatment

### Shared edge language

- **No visible borders** on clay objects. Silhouette = shadow falloff.
- **Matte fill** only (solid or imperceptibly even—no radial glossy vignette).
- **Corner radii are large** relative to element size (squircle / capsule / circle).

### Component recipes (as demonstrated)

| Component | Shape | Radius / geometry | Depth treatment |
|---|---|---|---|
| Soft nav tile (Home, History) | Square squircle | ~28–36% of side (~`32px` on a ~110px tile) | Same-color face as canvas; dual outer + dual inset |
| Sage CTA (“Learn More”) | Horizontal capsule | `999px` / height-radius | Sage fill; dual outer + dual inset; content centered |
| Camera control | Concentric circles | Outer ring ~15–20% of diameter thick; inner disc inset | White raised ring → sage convex disc → recessed camera glyph |
| Stats / attributes card | Wide rounded rect | ~`40–48px` | Soft elevated lavender card; 3 equal columns |
| Icon well (in stats card) | Circle | `50%` | Same clay elevation as a mini button above the card face |
| Content card (“About Granite”) | Rounded rect | ~`40–56px` | Elevated lavender card containing heading, body, centered sage CTA |

### Extrusion vs indentation

- **Extruded (default controls & cards):** Outer BR dark + outer TL white + inset TL light + inset BR dark.
- **Nested recess (camera glyph, optional embossed nav icons):** Invert inset pair; keep fill in the darker sage / muted purple family.
- **Column dividers:** 1px (or hairline) vertical rules using `--clay-divider` at reduced opacity—never heavy bars.

### Proportions observed

- Nav tile content is vertically stacked and centered (icon above label).
- Stats columns are equal width; icon → label → value stacked and centered.
- About card: generous internal padding (~`28–40px`); CTA centered under body copy with clear separation (~`20–28px`).

---

## 5. Content Presentation Guidelines (Typography, Iconography, Spacing)

### Typography

- **Family:** Clean geometric / neo-grotesque sans (references read as Inter / SF Pro–class). Not display serif; not ultra-rounded “toy” fonts.
- **Weights:** Medium for labels and CTA text; Semibold/Bold for card titles; Regular for body.
- **Colors:**
  - Titles on soft clay → `--clay-heading` (`#2D2D42`)
  - Body → `--clay-body` (`#7E7993`)
  - Nav / meta labels → `--clay-muted` (`#8A85A8`)
  - CTA on sage → `--clay-on-sage` (`#1A2824`) — **not** white
- **Sizing (approximate from screenshots):**
  - Card title ≈ `20–22px`, tight tracking
  - Body ≈ `14–16px`, line-height ≈ `1.5`
  - Nav label / stat label ≈ `13–15px`
  - CTA label ≈ `15–16px`
- **Case:** Title case as shown (“Learn More”, “Home”, “History”, “Rock Type”).

### Iconography

- **On soft lavender:** Muted purple (`--clay-muted` / `--clay-muted-strong`). Stroke icons for nav (clock, home); filled simple glyphs inside stats wells (crystals, pin, mountain).
- **On sage CTAs:** Dark charcoal-green outline icons matching label weight (open book + “Learn More”).
- **On sage camera disc:** Volumetric / filled camera mark in `--clay-sage-icon`, reading recessed—not a thin 1px stroke sticker.
- Corners of icon shapes are slightly rounded to match clay geometry.
- Icons never sit raw on the page without either (a) a clay tile/well or (b) placement inside a sage control.

### Spacing

- Maintain large quiet margins around floating components.
- Nav tile: icon and label grouped; gap ≈ ¼–⅓ icon height; equal inset from tile edges.
- Stats card: even column padding; ~`12–16px` between icon well, label, and value.
- CTA: horizontal padding ≈ `28–36px`; vertical padding ≈ `12–16px`; icon-to-label gap ≈ `8–10px`.
- Do not add badge clusters, stat strips, or extra chrome not present in the references.

---

## 6. Implementation Notes/Best Practices (100-150 words)

Implement clay with **layered `box-shadow`** (outer pair + inset pair) on opaque backgrounds—do not fake depth with drops alone or with CSS `filter: drop-shadow` on text. Keep page and soft-component fills in the same lavender family so elevation stays shadow-driven. Pair every sage fill with sage-tinted shade tokens; never park a gray slab under a green button. Prefer `border-radius` squircles/capsules/circles and omit border strokes. Put tokens in CSS variables early so cards, tiles, and CTAs stay synchronized. Validate against the six reference PNGs at 100% zoom: if a control looks flat, strengthen inset rims; if it looks muddy or neon, desaturate and reduce shadow contrast. Until pressed-state art exists, keep interaction deltas small so rest states remain the visual source of truth.
