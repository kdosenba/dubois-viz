# `dubois-viz`

A framework-agnostic, strictly typed, **zero-dependency-per-chart** D3.js visualization library and design system inspired by W.E.B. Du Bois's 1900 Paris Exposition archival gouache plates.

> **Live Interactive Showcase:** [**https://kdosenba.github.io/dubois-viz/**](https://kdosenba.github.io/dubois-viz/) — explore all 13 charts and interactive mix-and-match compositions (`SelectionBus`, `TimeWindowBus`, `ScaleGroup`, `FlipBookPlate`, `WhisperBar`). Pre-built static files also live in [`docs/`](docs/).

- **13 standalone D3 charts** — every file in `src/charts/*.ts` has **zero local imports** (only `'d3'` and Web APIs). Install the full package *or* copy any single chart file straight into your codebase and own it.
- **100% domain-agnostic** — built for financial analysis, music pop charts, SaaS cohorts, transit networks, public policy, climate telemetry, or any custom dataset.
- **Composable mix-and-match architecture** — connect any combination of charts with headless sync buses (`ScaleGroup`, `SelectionBus`, `TimeWindowBus`, `PeerStateBus`), reusable Du Bois controls (`WhisperBar`, `VellumPopover`, `HierarchyEngine`, `LegendDrawer`), and pluggable plate layouts (`SinglePlate`, `SmallMultiplesPlate`, `SyncedStackPlate`, `FlipBookPlate`, `TitlePlate`, `StorylineShell`).
- **Host-page-safe modular CSS** — core styles are strictly `.dubois-*` scoped so standalone charts drop cleanly into any existing site or app.

---

## Quick Start

### Option 1: Install as an ESM / TypeScript Package

```bash
npm install d3 github:kdosenba/dubois-viz
```

```ts
import 'dubois-viz/styles'; // Scoped tokens + base + controls + plates (safe in any app)
import { mountButterfly } from 'dubois-viz/charts/butterfly';

const chart = mountButterfly(
  document.getElementById('chart')!,
  {
    rows: [
      { id: 'pop', label: 'POP', leftValue: 84, rightValue: 96, leftBenchmark: 76, rightBenchmark: 88 },
      { id: 'rock', label: 'ROCK', leftValue: 59, rightValue: 47 },
    ],
  },
  { leftLabel: '2015', rightLabel: '2025', spineHeader: 'Genre' }
);
```

### Option 2: Copy a Single Standalone File ("Own the Code")

Copy any file from [`src/charts/`](src/charts/) (e.g., `butterfly.ts`) into your TypeScript project with `d3` installed. Each chart injects minimal `var(--dubois-*, <fallback>)` fallback CSS when the shared stylesheet is absent, so it renders in authentic Du Bois archival gouache out of the box.

---

## Chart Catalog (13 Self-Contained Archetypes)

| Chart | Subpath Export | Capabilities | Ideal Use Cases |
| :--- | :--- | :--- | :--- |
| **Columns** | `dubois-viz/charts/columns` | `Scalable`, `TimeWindow`, `Selectable`, `PeerSyncable` | Single/grouped/stacked bars, X-axis group brackets, combo line overlay, benchmarks, mode toggles |
| **Butterfly** | `dubois-viz/charts/butterfly` | `Scalable`, `Selectable`, `PeerSyncable` | Diverging comparisons, Palette A wings or Palette B sequential pyramids, expandable child rows, switchable highlights |
| **Line Chart** | `dubois-viz/charts/line-chart` | `Scalable`, `Selectable`, `PeerSyncable` | Time series, retention/survival curves, CDFs, dashed baselines, collision-free right-margin direct labels |
| **Stacked Area** | `dubois-viz/charts/stacked-area` | `Scalable`, `TimeWindow`, `Selectable` | Stacked area & staggered cohort long-tail envelopes with click-to-focus dimming, sum line & brush-zoom |
| **Histogram** | `dubois-viz/charts/histogram` | `Scalable`, `Selectable` | Distributions & optional 3-zone pre/anchor/post diverging histograms |
| **Heatmap** | `dubois-viz/charts/heatmap` | `Scalable`, `Selectable` | 2D proportional gouache disc or square/tile matrices |
| **Table** | `dubois-viz/charts/table` | `Selectable` | Structured archival tables with grouped column headers, presence swatches, values & deltas |
| **Ratio Pyramids** | `dubois-viz/charts/ratio-pyramids` | `Scalable`, `Selectable` | `2..N`-tier proportional funnels connected by `1 : N` ratio necks |
| **Radial Coil** | `dubois-viz/charts/radial-coil` | `Scalable` (per-panel), `Selectable` | Iconic W.E.B. Du Bois wrapped spiral bar charts |
| **Radial Dynamo** | `dubois-viz/charts/radial-dynamo` | `Scalable` (linear radial), `Zoomable`, `Selectable` | Polar stacked petals, inner composition ring, event badges & orbiting satellites |
| **Sparkline** | `dubois-viz/charts/sparkline` | `Scalable`, `TimeWindow` | Compact `1..N`-band area/line/bar sparklines with eras & milestone markers |
| **Map** | `dubois-viz/charts/map` | `Scalable`, `Zoomable`, `Selectable` | GeoJSON / polygon choropleths, proportional symbols, curved flow arcs & marginal callouts |
| **TOC Bookshelf** | `dubois-viz/charts/toc-bookshelf` | `Selectable` | Visual archival volume bookshelf & plate index with built-in chart miniatures |

---

## Mixing & Matching Across Charts

### Cross-Filtering Any Two Charts (`SelectionBus`)
```ts
import { createSelectionBus } from 'dubois-viz/sync';
import { mountMap } from 'dubois-viz/charts/map';
import { mountButterfly } from 'dubois-viz/charts/butterfly';

const bus = createSelectionBus<string>();
const map = mountMap(mapEl, mapData, { onSelect: (k) => bus.select(k), onHover: (k) => bus.hover(k) });
const bf = mountButterfly(bfEl, bfData, { onSelect: (k) => bus.select(k), onHover: (k) => bus.hover(k) });
bus.connect(map);
bus.connect(bf);
```

### Synchronized Multi-Panel Time Stack (`SyncedStackPlate` + `TimeWindowBus`)
```ts
import { createSyncedStackPlate } from 'dubois-viz/plates';
import { mountColumns } from 'dubois-viz/charts/columns';
import { mountStackedArea } from 'dubois-viz/charts/stacked-area';

createSyncedStackPlate(hostEl, {
  title: 'COHORT TIMELINE',
  sections: [
    { id: 'top', render: (el, { timeWindowBus }) => mountColumns(el, topData, { layout: 'stacked', enableBrushZoom: true, onTimeWindowChange: (w) => timeWindowBus.setWindow(w) }) },
    { id: 'mid', weight: 1.4, render: (el, { timeWindowBus }) => mountStackedArea(el, cohortData, { enableBrushZoom: true, onTimeWindowChange: (w) => timeWindowBus.setWindow(w) }) },
  ],
});
```

---

## Using with React, Vue, or Svelte (10-Line Wrapper)

Because every chart exposes `(container, data, options) => { update, resize, destroy }`, integrating with any framework requires zero wrapper packages:

```tsx
// React example
import { useEffect, useRef } from 'react';
import { mountColumns, type ColumnsData, type ColumnsOptions } from 'dubois-viz/charts/columns';

export function DuBoisColumns({ data, options }: { data: ColumnsData; options?: ColumnsOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<ReturnType<typeof mountColumns> | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    inst.current = mountColumns(ref.current, data, options);
    return () => { inst.current?.destroy(); inst.current = null; };
  }, []);
  useEffect(() => { inst.current?.update(data, options); }, [data, options]);
  return <div ref={ref} style={{ width: '100%', height: 420 }} />;
}
```

---

## Modular CSS Imports

- `dubois-viz/styles` — Default non-invasive bundle (`tokens` + `base` + `controls` + `plates`).
- `dubois-viz/styles/tokens` — `:root` CSS custom properties only.
- `dubois-viz/styles/fonts` — Optional Google Fonts import (`Inter`, `EB Garamond`, `Space Mono`).
- `dubois-viz/styles/exhibition` — Opt-in full-bleed `100dvh` scroll-snapping page shell.

---

## Consumer Domain Adapter Pattern

Keep domain-specific logic (SQL column names, custom calendars, geographic or organizational hierarchies) in a thin adapter layer inside your own project—leaving `dubois-viz` clean and reusable:

```ts
// Inside your project's src/adapters/sales-adapter.ts
import type { ColumnsData } from 'dubois-viz/charts/columns';
import { executeHierarchyQuery, type HierarchySchema } from 'dubois-viz/controls';

interface SalesRow { readonly region: string; readonly office: string; readonly quarter: string; readonly revenue: number; }

export const salesHierarchy: HierarchySchema<'region' | 'office', SalesRow> = {
  levels: [
    { level: 'region', label: 'Region', getValue: (r) => r.region },
    { level: 'office', label: 'Office', getValue: (r) => r.office },
  ],
};

export function toSalesColumns(rows: readonly SalesRow[]): ColumnsData {
  return {
    bars: rows.map((r, i) => ({
      stepId: r.quarter,
      stepLabel: r.quarter,
      stepOrder: i,
      seriesId: r.region,
      seriesLabel: r.region,
      value: r.revenue,
    })),
  };
}
```

---

## Development & Verification

```bash
npm run typecheck       # Strict tsc --noEmit + compile-time structural contract tests
npm run verify          # Zero local imports, zero any/zod, domain-agnostic audit, CSS isolation, token parity
npm run build:lib       # Emits dist/ ESM + .d.ts + CSS and validates every package.json export
npm run build:showcase  # Builds pre-built static exhibition gallery into docs/
```

See [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) for the complete visual specification and [LICENSE](LICENSE) (MIT).
