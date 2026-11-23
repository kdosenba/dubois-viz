# W.E.B. Du Bois Design Language Specification (`dubois-viz`)

This document codifies the visual, spatial, chromatic, and typographic rules inspired by W.E.B. Du Bois's 1900 Paris Exposition archival gouache plates. Every chart, control, and plate layout in `dubois-viz` adheres to this specification.

---

## 1. Spatial Philosophy: *"The Page Is the Border"*

Charts are rendered as flat lithographic plates painted directly onto warm archival parchment—never boxed inside web-dashboard cards.

| Token Role | CSS Variable | Hex | Usage |
| :--- | :--- | :---: | :--- |
| **Primary Parchment** | `--dubois-parchment` | `#F4EFE6` | Plate and chart canvas background, tooltip and popover body. |
| **Aged Vellum** | `--dubois-vellum` | `#EAE2D3` | Top Whisper Bar, subtle alternating bands, shaded eras, map oceans. |
| **Warm Tan** | `--dubois-warm-tan` | `#D2B48C` | Base structural tiers, secondary fills, page-fold underlays. |
| **Unfocused Neutral** | `--dubois-unfocused` | `#DED6C6` | Muted gouache tone for dimmed/unfocused marks during interactive focus. |
| **India Ink** | `--dubois-ink` | `#1A1615` | Primary type, axes, rules, and mandatory `1px–1.2px` outlines around marks. |
| **Archival Charcoal** | `--dubois-charcoal` | `#52493E` | Subtitles, Whisper Bar slot keys, axis ticks, secondary annotations. |
| **Faint Guideline** | `--dubois-guideline` | `#8C7A6B` | Dashed structural guidelines (`stroke-opacity: 0.28–0.35`) and inactive borders. |

### Spatial Rules
- **Zero Dashboard Chrome:** No rounded cards (`border-radius: 0`), no soft blurred drop shadows (`rgba`), no gray SaaS panels. Floating surfaces (tooltips, popovers, expanded drawers) use crisp `1.5px–2px solid #1A1615` borders and hard `4px 4px 0px #1A1615` archival offset shadows.
- **Generous Negative Space:** Leave ample open `#F4EFE6` parchment around data marks rather than filling every pixel with chrome.
- **Single Structural Border Rule:** In full-bleed exhibition layouts, only the `1px solid #1A1615` bottom rule of the `32px` Whisper Bar crosses the plate horizontally.
- **Host-Page Safety:** Core styles (`tokens.css`, `base.css`, `controls.css`, `plates.css`) are strictly `.dubois-*` scoped so standalone charts embed safely into any host website or app. Full-bleed `100dvh` scroll-snapping lives in opt-in `exhibition.css`.

---

## 2. Chromatic System & The Three Pigment Laws

1. **100% Flat-Opaque Gouache (`fill-opacity: 1`):** Every bar, ribbon, area band, disc, petal, and polygon uses solid opaque pigment. Never use gradients, glassmorphism, or translucent fills on data marks.
2. **Crisp India-Ink Outlines (`1px–1.2px solid #1A1615`):** Every geometric data mark carries an explicit `#1A1615` ink outline.
3. **Chromatic Orthogonality:** Keep **Palette A (Categorical)** and **Palette B (Ordered Sequential)** conceptually distinct. Never mix both palettes arbitrarily inside a single series encoding.

### Palette A — Primary Categorical Gouache (9 Swatches)
| Swatch | CSS Variable | Hex | High-Contrast Inner Partner |
| :--- | :--- | :---: | :--- |
| Exhibition Crimson | `--dubois-crimson` | `#DC143C` | `#FFD700` |
| Paris Cobalt | `--dubois-cobalt` | `#2B5B84` | `#FFD700` / `#D2B48C` |
| Viridian Emerald | `--dubois-emerald` | `#008055` | `#FFD700` |
| Atlanta Gold | `--dubois-gold` | `#FFD700` | `#1A1615` / `#DC143C` |
| Ochre Orange | `--dubois-ochre` | `#E87722` | `#F4EFE6` / `#FFD700` |
| Royal Violet | `--dubois-violet` | `#753ABD` | `#FFD700` |
| Archival Teal | `--dubois-teal` | `#00A7B5` | `#FFD700` |
| Burnt Umber | `--dubois-umber` | `#654321` | `#D2B48C` |
| Warm Tan | `--dubois-warm-tan` | `#D2B48C` | `#1A1615` |

### Palette B — 14-Step Ordered Sequential Spectrum
| Step | Full Saturation (`--dubois-seq-NN`) | Vellum Tint (`--dubois-seq-NN-tint`) | Safe Nested Highlight |
| :-: | :---: | :---: | :---: |
| 01 | `#A50050` | `#C96B8E` | `#FFD700` |
| 02 | `#DC143C` | `#E67384` | `#FFD700` |
| 03 | `#EE5340` | `#F09583` | `#FFD700` |
| 04 | `#FFA400` | `#F5C16C` | `#EAE2D3` |
| 05 | `#FFCD00` | `#F7DB7C` | `#DC143C` |
| 06 | `#FAE053` | `#F6E89E` | `#2B5B84` |
| 07 | `#DBE442` | `#E4E895` | `#008055` |
| 08 | `#8FD14F` | `#BBE094` | `#008055` |
| 09 | `#00A651` | `#6FC493` | `#FFD700` |
| 10 | `#007A5E` | `#6BA896` | `#FFD700` |
| 11 | `#00A7B5` | `#74C7CE` | `#FFD700` |
| 12 | `#2B5B84` | `#7E98AF` | `#FFD700` |
| 13 | `#6638B6` | `#A187CE` | `#FFD700` |
| 14 | `#AF3BC9` | `#CCA3D9` | `#FFD700` |

---

## 3. Typography, Labeling & Benchmarks

- **Display / Plate Titles (`--dubois-font-title`):** `'Inter', 'Public Sans', sans-serif`, `800` Bold, `UPPERCASE`, `letter-spacing: 0.10em`, `#1A1615`.
- **Subtitles & Narrative Prose (`--dubois-font-serif`):** `'EB Garamond', Georgia, serif`, `400` Italic (subtitles) / Regular (notes), `#52493E`.
- **Data Values, Axes, Legends & Controls (`--dubois-font-mono`):** `'Space Mono', 'IBM Plex Mono', monospace`, `700` Bold (values) / `400` Regular (ticks), `10px–11px`, `letter-spacing: 0.05em`.
- **Benchmark Geometry:** Optional prior/target benchmarks render as crisp dashed India-ink marks—vertical dashed ticks (`stroke-dasharray="2,2"`) on horizontal bars and discrete dashed horizontal caps (`stroke-dasharray="3,2"`) on vertical columns.
- **Tactile Vellum Tooltip (`.dubois-exhibition-tooltip`):** `#1A1615` uppercase header band with `#F4EFE6` text and `10px × 10px` swatch, over a `#F4EFE6` key/value body framed in `2px solid #1A1615` with `4px 4px 0px #1A1615` shadow.
- **Responsive Size Tiers:** Charts automatically adapt label density and spacing across `expanded` (`>= 520px`), `compact` (`280px–519px`), and `micro` (`< 280px`) container widths via `ResizeObserver`.

---

## 4. Pre-Flight Quality Checklist

1. Every geometric data mark carries `stroke="#1A1615"` (`1px–1.2px`) and `fill-opacity="1"`.
2. Open parchment (`#F4EFE6`) spines and negative space stay uncluttered.
3. Optional features (benchmarks, nested highlights, groupings, overlays) degrade cleanly when omitted.
4. Every chart in `src/charts/` has **zero local file imports** (imports only `'d3'`) and injects minimal `var(--dubois-*, <fallback>)` fallback CSS if standalone.
5. Zero `any`, zero `zod`, branded IDs, strict TypeScript (`noUncheckedIndexedAccess`), and zero domain-specific terminology anywhere in the library.
