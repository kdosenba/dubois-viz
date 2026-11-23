import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type ButterflyChartId = string & { readonly __brand: 'ButterflyChartId' };
export const asButterflyChartId = (id: string): ButterflyChartId =>
  id as ButterflyChartId;

export type ResponsiveSizeTier = 'expanded' | 'compact' | 'micro';

export interface ScaleDomain {
  readonly min: number;
  readonly max: number;
}

export interface TooltipSpec {
  readonly title: string;
  readonly swatchColor?: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}

export interface ButterflyHighlightLayer {
  readonly id: string;
  readonly label: string;
  readonly color?: string;
}

export interface ButterflyRow {
  readonly id: string;
  readonly label: string;
  readonly fullLabel?: string;
  readonly parentId?: string | null;
  readonly order?: number;
  readonly leftValue: number;
  readonly rightValue: number;
  readonly leftBenchmark?: number;
  readonly rightBenchmark?: number;
  readonly leftHighlights?: Readonly<Record<string, number>>;
  readonly rightHighlights?: Readonly<Record<string, number>>;
  readonly color?: string;
}

export interface ButterflyData {
  readonly rows: readonly ButterflyRow[];
  readonly highlightLayers?: readonly ButterflyHighlightLayer[];
}

export interface ButterflySharedState {
  readonly expandedParents?: readonly string[];
  readonly activeHighlightId?: string | null;
}

export interface ButterflyOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly colorMode?: 'wings' | 'sequential';
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly spineHeader?: string;
  readonly benchmarkLabel?: string;
  readonly leftColor?: string;
  readonly rightColor?: string;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly initialExpandedParents?: readonly string[];
  readonly initialHighlightId?: string | null;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (row: ButterflyRow, wing: 'left' | 'right') => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onSharedStateChange?: (state: ButterflySharedState) => void;
}

export interface ButterflyChartInstance {
  readonly chartId: ButterflyChartId;
  update(data: ButterflyData, options?: Partial<ButterflyOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  getSharedState(): ButterflySharedState;
  applySharedState(state: Partial<ButterflySharedState>): void;
  destroy(): void;
}

// ============================================================================
// Canonical Du Bois Palette Tokens & Fallback CSS
// ============================================================================
const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const VELLUM = '#EAE2D3';
const UNFOCUSED = '#DED6C6';
const CRIMSON = '#DC143C';
const COBALT = '#2B5B84';
const GOLD = '#FFD700';

const HIGHLIGHT_DEFAULTS: readonly string[] = [
  '#FFD700',
  '#008055',
  '#E87722',
  '#753ABD',
  '#00A7B5',
];

const SEQ_SPECTRUM: readonly {
  readonly right: string;
  readonly left: string;
  readonly highlight: string;
}[] = [
  { right: '#A50050', left: '#C96B8E', highlight: '#FFD700' },
  { right: '#DC143C', left: '#E67384', highlight: '#FFD700' },
  { right: '#EE5340', left: '#F09583', highlight: '#FFD700' },
  { right: '#FFA400', left: '#F5C16C', highlight: '#EAE2D3' },
  { right: '#FFCD00', left: '#F7DB7C', highlight: '#DC143C' },
  { right: '#FAE053', left: '#F6E89E', highlight: '#2B5B84' },
  { right: '#DBE442', left: '#E4E895', highlight: '#008055' },
  { right: '#8FD14F', left: '#BBE094', highlight: '#008055' },
  { right: '#00A651', left: '#6FC493', highlight: '#FFD700' },
  { right: '#007A5E', left: '#6BA896', highlight: '#FFD700' },
  { right: '#00A7B5', left: '#74C7CE', highlight: '#FFD700' },
  { right: '#2B5B84', left: '#7E98AF', highlight: '#FFD700' },
  { right: '#6638B6', left: '#A187CE', highlight: '#FFD700' },
  { right: '#AF3BC9', left: '#CCA3D9', highlight: '#FFD700' },
];

const FALLBACK_STYLE_ID = 'dubois-butterfly-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:visible}
    .dubois-legend-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 14px;padding:4px 8px;font-family:var(--dubois-font-mono,monospace);font-size:10px;text-transform:uppercase;color:var(--dubois-ink,#1A1615)}
    .dubois-legend-item{display:inline-flex;align-items:center;gap:5px;background:transparent;border:none;padding:1px 3px;font:inherit;text-transform:inherit;color:inherit}
    .dubois-legend-item--switch{cursor:pointer;text-decoration:underline;text-decoration-style:dashed;text-underline-offset:3px}
    .dubois-legend-item--active{font-weight:700;text-decoration-style:solid}
    .dubois-legend-swatch{inline-size:11px;block-size:11px;border:1px solid var(--dubois-ink,#1A1615);display:inline-block}
    .dubois-legend-swatch--dashed{inline-size:14px;block-size:0;border:none;border-block-start:2px dashed var(--dubois-ink,#1A1615)}
    .dubois-exhibition-tooltip{position:fixed;background:var(--dubois-parchment,#F4EFE6);border:2px solid var(--dubois-ink,#1A1615);box-shadow:4px 4px 0 var(--dubois-ink,#1A1615);min-inline-size:200px;max-inline-size:320px;pointer-events:none;z-index:1200;font-family:var(--dubois-font-mono,monospace);font-size:11px;color:var(--dubois-ink,#1A1615)}
    .dubois-exhibition-tooltip-header{background:var(--dubois-ink,#1A1615);color:var(--dubois-parchment,#F4EFE6);padding:5px 9px;font-weight:700;text-transform:uppercase;display:flex;align-items:center;gap:7px}
    .dubois-exhibition-tooltip-swatch{inline-size:10px;block-size:10px;border:1px solid var(--dubois-parchment,#F4EFE6);flex-shrink:0}
    .dubois-exhibition-tooltip-body{padding:7px 9px;display:flex;flex-direction:column;gap:3px}
    .dubois-exhibition-tooltip-row{display:flex;justify-content:space-between;gap:12px}
    .dubois-exhibition-tooltip-key{color:var(--dubois-charcoal,#52493E)}
    .dubois-exhibition-tooltip-val{color:var(--dubois-ink,#1A1615);font-weight:700}
  `;
  document.head.appendChild(style);
}

function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
}

function sampleSpectrum(idx: number, total: number): (typeof SEQ_SPECTRUM)[number] {
  if (total <= 1) return SEQ_SPECTRUM[0]!;
  const scaled = Math.round((idx / (total - 1)) * (SEQ_SPECTRUM.length - 1));
  return SEQ_SPECTRUM[Math.max(0, Math.min(SEQ_SPECTRUM.length - 1, scaled))]!;
}

/**
 * Unified Du Bois Butterfly & Bilateral Pyramid Chart.
 * Features an open parchment center spine, Palette A wing colors OR Palette B
 * sequential spectrum, optional expandable parent/child rows, 0..N switchable
 * nested highlight layers, and optional dashed benchmark ticks.
 */
export function mountButterfly(
  container: HTMLElement,
  initialData: ButterflyData,
  initialOptions: ButterflyOptions = {}
): ButterflyChartInstance {
  ensureFallbackStyles();

  const chartId = asButterflyChartId(
    initialOptions.chartId ?? `butterfly-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: ButterflyData = initialData;
  let options: ButterflyOptions = { ...initialOptions };
  let expandedParents = new Set<string>(options.initialExpandedParents ?? []);
  let activeHighlightId: string | null =
    options.initialHighlightId !== undefined
      ? options.initialHighlightId
      : data.highlightLayers?.[0]?.id ?? null;
  let overrideDomain: ScaleDomain | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 1 };

  const root = document.createElement('div');
  root.className = 'dubois-chart-root';
  root.dataset['chartId'] = chartId;

  const legendWrap = document.createElement('div');
  const svgWrap = document.createElement('div');
  svgWrap.className = 'dubois-chart-svg-wrap';
  root.append(legendWrap, svgWrap);
  container.innerHTML = '';
  container.appendChild(root);

  const svg = d3
    .select(svgWrap)
    .append('svg')
    .attr('class', 'dubois-chart-svg')
    .attr('role', 'img')
    .attr('aria-label', options.ariaLabel ?? 'Butterfly comparison chart');

  let tooltipEl: HTMLDivElement | null = null;

  function showTooltip(ev: MouseEvent, spec: TooltipSpec | null): void {
    if (options.showTooltip === false || !spec) return;
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'dubois-exhibition-tooltip';
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.innerHTML = '';
    const hdr = document.createElement('div');
    hdr.className = 'dubois-exhibition-tooltip-header';
    if (spec.swatchColor) {
      const sw = document.createElement('span');
      sw.className = 'dubois-exhibition-tooltip-swatch';
      sw.style.backgroundColor = spec.swatchColor;
      hdr.appendChild(sw);
    }
    const title = document.createElement('span');
    title.textContent = spec.title;
    hdr.appendChild(title);
    const body = document.createElement('div');
    body.className = 'dubois-exhibition-tooltip-body';
    for (const row of spec.rows) {
      const r = document.createElement('div');
      r.className = 'dubois-exhibition-tooltip-row';
      const k = document.createElement('span');
      k.className = 'dubois-exhibition-tooltip-key';
      k.textContent = row.label;
      const v = document.createElement('span');
      v.className = 'dubois-exhibition-tooltip-val';
      v.textContent = row.value;
      r.append(k, v);
      body.appendChild(r);
    }
    tooltipEl.append(hdr, body);
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = `${Math.max(8, Math.min(ev.clientX + 14, window.innerWidth - 260))}px`;
    tooltipEl.style.top = `${Math.max(8, Math.min(ev.clientY + 14, window.innerHeight - 140))}px`;
  }

  function hideTooltip(): void {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function buildDisplayRows(): readonly {
    readonly row: ButterflyRow;
    readonly isChild: boolean;
    readonly hasChildren: boolean;
    readonly parentIdx: number;
    readonly parentCount: number;
  }[] {
    const sorted = [...data.rows].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const childrenMap = new Map<string, ButterflyRow[]>();
    const parents: ButterflyRow[] = [];

    for (const r of sorted) {
      if (r.parentId) {
        const list = childrenMap.get(r.parentId) ?? [];
        list.push(r);
        childrenMap.set(r.parentId, list);
      } else {
        parents.push(r);
      }
    }

    const out: {
      row: ButterflyRow;
      isChild: boolean;
      hasChildren: boolean;
      parentIdx: number;
      parentCount: number;
    }[] = [];

    parents.forEach((p, idx) => {
      const kids = childrenMap.get(p.id) ?? [];
      out.push({
        row: p,
        isChild: false,
        hasChildren: kids.length > 0,
        parentIdx: idx,
        parentCount: parents.length,
      });
      if (kids.length > 0 && expandedParents.has(p.id)) {
        for (const kid of kids) {
          out.push({
            row: kid,
            isChild: true,
            hasChildren: false,
            parentIdx: idx,
            parentCount: parents.length,
          });
        }
      }
    });
    return out;
  }

  function render(): void {
    const rect = svgWrap.getBoundingClientRect();
    const width = Math.max(160, Math.round(rect.width || 640));
    const height = Math.max(120, Math.round(rect.height || 360));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    root.classList.toggle('dubois-chart-root--micro', tier === 'micro');

    const displayRows = buildDisplayRows();
    const fmt = options.formatValue ?? defaultFormat;
    const colorMode = options.colorMode ?? 'wings';
    const leftWingColor = options.leftColor ?? CRIMSON;
    const rightWingColor = options.rightColor ?? COBALT;
    const layers = data.highlightLayers ?? [];
    const activeLayer =
      layers.find((l) => l.id === activeHighlightId) ?? null;

    let maxVal = 0;
    for (const item of displayRows) {
      const r = item.row;
      maxVal = Math.max(
        maxVal,
        r.leftValue,
        r.rightValue,
        r.leftBenchmark ?? 0,
        r.rightBenchmark ?? 0
      );
      if (activeLayer) {
        maxVal = Math.max(
          maxVal,
          r.leftHighlights?.[activeLayer.id] ?? 0,
          r.rightHighlights?.[activeLayer.id] ?? 0
        );
      }
    }
    naturalDomain = { min: 0, max: maxVal > 0 ? maxVal * 1.15 : 1 };

    // Legend
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const hasBenchmarks = data.rows.some(
      (r) =>
        typeof r.leftBenchmark === 'number' || typeof r.rightBenchmark === 'number'
    );

    if (options.showLegend !== false) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      if (colorMode === 'wings') {
        const leftItem = document.createElement('span');
        leftItem.className = 'dubois-legend-item';
        const lSw = document.createElement('span');
        lSw.className = 'dubois-legend-swatch';
        lSw.style.backgroundColor = leftWingColor;
        const lTx = document.createElement('span');
        lTx.textContent = options.leftLabel ?? 'Left Wing';
        leftItem.append(lSw, lTx);

        const rightItem = document.createElement('span');
        rightItem.className = 'dubois-legend-item';
        const rSw = document.createElement('span');
        rSw.className = 'dubois-legend-swatch';
        rSw.style.backgroundColor = rightWingColor;
        const rTx = document.createElement('span');
        rTx.textContent = options.rightLabel ?? 'Right Wing';
        rightItem.append(rSw, rTx);
        strip.append(leftItem, rightItem);
      }

      layers.forEach((layer, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = layer.id === activeHighlightId;
        btn.className =
          layers.length > 1
            ? `dubois-legend-item dubois-legend-item--switch${isActive ? ' dubois-legend-item--active' : ''}`
            : 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor =
          layer.color ?? HIGHLIGHT_DEFAULTS[idx % HIGHLIGHT_DEFAULTS.length] ?? GOLD;
        const tx = document.createElement('span');
        tx.textContent = layer.label;
        btn.append(sw, tx);
        if (layers.length > 1) {
          btn.addEventListener('click', () => {
            activeHighlightId = activeHighlightId === layer.id ? null : layer.id;
            options.onSharedStateChange?.({
              expandedParents: Array.from(expandedParents),
              activeHighlightId,
            });
            render();
          });
        }
        strip.appendChild(btn);
      });

      if (hasBenchmarks) {
        const bItem = document.createElement('span');
        bItem.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--dashed';
        const tx = document.createElement('span');
        tx.textContent = options.benchmarkLabel ?? 'Benchmark';
        bItem.append(sw, tx);
        strip.appendChild(bItem);
      }

      legendTarget.appendChild(strip);
    }

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (displayRows.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const margin = {
      top: 28,
      right: tier === 'micro' ? 14 : 44,
      bottom: 24,
      left: tier === 'micro' ? 14 : 44,
    };

    const innerW = Math.max(80, width - margin.left - margin.right);
    const innerH = Math.max(60, height - margin.top - margin.bottom);
    const spineW = Math.min(
      tier === 'micro' ? 68 : 136,
      Math.max(54, innerW * 0.24)
    );
    const wingW = Math.max(24, (innerW - spineW) / 2);
    const spineLeft = wingW;
    const spineRight = wingW + spineW;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yBand = d3
      .scaleBand<string>()
      .domain(displayRows.map((d) => d.row.id))
      .range([0, innerH])
      .padding(displayRows.length > 12 ? 0.18 : 0.28);

    const effective = overrideDomain ?? naturalDomain;
    const xWing = d3.scaleLinear().domain([0, effective.max]).nice(3).range([0, wingW]);

    // Wing banners & spine header
    g.append('text')
      .attr('class', 'dubois-wing-banner')
      .attr('x', spineLeft - 8)
      .attr('y', -10)
      .attr('text-anchor', 'end')
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', tier === 'micro' ? 9 : 11)
      .attr('font-weight', 800)
      .attr('fill', INK)
      .text((options.leftLabel ?? 'LEFT').toUpperCase());

    g.append('text')
      .attr('class', 'dubois-wing-banner')
      .attr('x', spineRight + 8)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', tier === 'micro' ? 9 : 11)
      .attr('font-weight', 800)
      .attr('fill', INK)
      .text((options.rightLabel ?? 'RIGHT').toUpperCase());

    if (options.spineHeader) {
      g.append('text')
        .attr('x', (spineLeft + spineRight) / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 9.5)
        .attr('font-weight', 700)
        .attr('fill', CHARCOAL)
        .text(options.spineHeader.toUpperCase());
    }

    // Subtle vertical guidelines on both wings
    const ticks = xWing.ticks(tier === 'micro' ? 2 : 3).filter((t) => t > 0);
    for (const t of ticks) {
      const dist = xWing(t);
      for (const xPos of [spineLeft - dist, spineRight + dist]) {
        g.append('line')
          .attr('class', 'dubois-guideline-rule')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', innerH)
          .attr('stroke', GUIDELINE)
          .attr('stroke-opacity', 0.3)
          .attr('stroke-dasharray', '3,3');

        if (tier !== 'micro') {
          g.append('text')
            .attr('class', 'dubois-axis-tick-label')
            .attr('x', xPos)
            .attr('y', innerH + 14)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 9.5)
            .attr('fill', CHARCOAL)
            .text(fmt(t));
        }
      }
    }

    // Open parchment center spine bounded by two 1.2px India-ink axis lines
    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', spineLeft)
      .attr('x2', spineLeft)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', spineRight)
      .attr('x2', spineRight)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    const activeLayerIdx = activeLayer
      ? layers.findIndex((l) => l.id === activeLayer.id)
      : -1;
    const defaultHighlightColor = activeLayer
      ? activeLayer.color ??
        HIGHLIGHT_DEFAULTS[Math.max(0, activeLayerIdx) % HIGHLIGHT_DEFAULTS.length] ??
        GOLD
      : GOLD;

    // Draw rows
    for (const entry of displayRows) {
      const { row, isChild, hasChildren, parentIdx, parentCount } = entry;
      const y = yBand(row.id);
      if (y === undefined) continue;
      const bh = yBand.bandwidth();

      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(row.id)) ||
        (hoveredKey !== null && hoveredKey !== row.id);

      const seq = sampleSpectrum(parentIdx, parentCount);
      const lFill = isDimmed
        ? UNFOCUSED
        : row.color ?? (colorMode === 'sequential' ? seq.left : leftWingColor);
      const rFill = isDimmed
        ? UNFOCUSED
        : row.color ?? (colorMode === 'sequential' ? seq.right : rightWingColor);
      const hFill = colorMode === 'sequential' && !activeLayer?.color ? seq.highlight : defaultHighlightColor;

      if (isChild) {
        g.append('rect')
          .attr('x', spineLeft + 2)
          .attr('y', y)
          .attr('width', spineW - 4)
          .attr('height', bh)
          .attr('fill', VELLUM);
      }

      // Spine label + optional expand toggle
      const spineGroup = g
        .append('g')
        .style('cursor', hasChildren ? 'pointer' : 'default')
        .on('click', () => {
          if (!hasChildren) return;
          if (expandedParents.has(row.id)) expandedParents.delete(row.id);
          else expandedParents.add(row.id);
          options.onSharedStateChange?.({
            expandedParents: Array.from(expandedParents),
            activeHighlightId,
          });
          render();
        });

      const prefix = hasChildren ? (expandedParents.has(row.id) ? '− ' : '+ ') : isChild ? '↳ ' : '';
      spineGroup
        .append('text')
        .attr('x', (spineLeft + spineRight) / 2)
        .attr('y', y + bh / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : isChild ? 9 : 10)
        .attr('font-weight', isChild ? 400 : 700)
        .attr('fill', INK)
        .text(`${prefix}${row.label}`);

      const bindWing = (
        sel: d3.Selection<SVGRectElement, unknown, null, undefined>,
        wing: 'left' | 'right',
        swatch: string
      ): void => {
        sel
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent) => {
            const val = wing === 'left' ? row.leftValue : row.rightValue;
            const bm = wing === 'left' ? row.leftBenchmark : row.rightBenchmark;
            const hl = activeLayer
              ? wing === 'left'
                ? row.leftHighlights?.[activeLayer.id]
                : row.rightHighlights?.[activeLayer.id]
              : undefined;
            const tRows: { label: string; value: string }[] = [
              {
                label: wing === 'left' ? options.leftLabel ?? 'Left' : options.rightLabel ?? 'Right',
                value: fmt(val),
              },
            ];
            if (typeof hl === 'number' && activeLayer) {
              tRows.push({ label: activeLayer.label, value: fmt(hl) });
            }
            if (typeof bm === 'number') {
              tRows.push({ label: options.benchmarkLabel ?? 'Benchmark', value: fmt(bm) });
            }
            const spec = options.formatTooltip
              ? options.formatTooltip(row, wing)
              : {
                  title: row.fullLabel ?? row.label,
                  swatchColor: swatch,
                  rows: tRows,
                };
            showTooltip(ev, spec);
          })
          .on('mouseenter', () => {
            hoveredKey = row.id;
            options.onHover?.(row.id);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', () => {
            if (selectedKeys.has(row.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([row.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
      };

      // Left wing bar
      const lw = xWing(Math.max(0, row.leftValue));
      const lRect = g
        .append('rect')
        .attr('class', 'dubois-gouache-mark')
        .attr('x', spineLeft - lw)
        .attr('y', y)
        .attr('width', lw)
        .attr('height', bh)
        .attr('fill', lFill)
        .attr('fill-opacity', 1)
        .attr('stroke', INK)
        .attr('stroke-width', 1);
      bindWing(lRect, 'left', lFill);

      // Right wing bar
      const rw = xWing(Math.max(0, row.rightValue));
      const rRect = g
        .append('rect')
        .attr('class', 'dubois-gouache-mark')
        .attr('x', spineRight)
        .attr('y', y)
        .attr('width', rw)
        .attr('height', bh)
        .attr('fill', rFill)
        .attr('fill-opacity', 1)
        .attr('stroke', INK)
        .attr('stroke-width', 1);
      bindWing(rRect, 'right', rFill);

      // Optional nested highlights
      if (activeLayer) {
        const lh = row.leftHighlights?.[activeLayer.id] ?? 0;
        const rh = row.rightHighlights?.[activeLayer.id] ?? 0;
        const innerHBar = Math.max(3, bh * 0.46);
        const iy = y + (bh - innerHBar) / 2;

        if (lh > 0) {
          const lhw = xWing(lh);
          g.append('rect')
            .attr('class', 'dubois-gouache-mark')
            .attr('x', spineLeft - lhw)
            .attr('y', iy)
            .attr('width', lhw)
            .attr('height', innerHBar)
            .attr('fill', hFill)
            .attr('fill-opacity', 1)
            .attr('stroke', INK)
            .attr('stroke-width', 1)
            .style('pointer-events', 'none');
        }
        if (rh > 0) {
          const rhw = xWing(rh);
          g.append('rect')
            .attr('class', 'dubois-gouache-mark')
            .attr('x', spineRight)
            .attr('y', iy)
            .attr('width', rhw)
            .attr('height', innerHBar)
            .attr('fill', hFill)
            .attr('fill-opacity', 1)
            .attr('stroke', INK)
            .attr('stroke-width', 1)
            .style('pointer-events', 'none');
        }
      }

      // Optional dashed vertical benchmark ticks
      if (typeof row.leftBenchmark === 'number') {
        const lx = spineLeft - xWing(Math.max(0, row.leftBenchmark));
        g.append('line')
          .attr('class', 'dubois-benchmark-tick')
          .attr('x1', lx)
          .attr('x2', lx)
          .attr('y1', y - 3)
          .attr('y2', y + bh + 3)
          .attr('stroke', INK)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2');
      }
      if (typeof row.rightBenchmark === 'number') {
        const rx = spineRight + xWing(Math.max(0, row.rightBenchmark));
        g.append('line')
          .attr('class', 'dubois-benchmark-tick')
          .attr('x1', rx)
          .attr('x2', rx)
          .attr('y1', y - 3)
          .attr('y2', y + bh + 3)
          .attr('stroke', INK)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2');
      }

      // Outside numeric labels
      if (tier !== 'micro') {
        if (row.leftValue > 0) {
          g.append('text')
            .attr('class', 'dubois-value-label')
            .attr('x', spineLeft - lw - 5)
            .attr('y', y + bh / 2 + 3.5)
            .attr('text-anchor', 'end')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 9.5)
            .attr('font-weight', 700)
            .attr('fill', INK)
            .text(fmt(row.leftValue));
        }
        if (row.rightValue > 0) {
          g.append('text')
            .attr('class', 'dubois-value-label')
            .attr('x', spineRight + rw + 5)
            .attr('y', y + bh / 2 + 3.5)
            .attr('text-anchor', 'start')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 9.5)
            .attr('font-weight', 700)
            .attr('fill', INK)
            .text(fmt(row.rightValue));
        }
      }
    }
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => render());
    ro.observe(svgWrap);
  }
  render();

  return {
    chartId,
    update(nextData: ButterflyData, nextOptions?: Partial<ButterflyOptions>): void {
      data = nextData;
      if (nextOptions) options = { ...options, ...nextOptions };
      render();
    },
    resize: render,
    getSvgElement: () => svg.node(),
    getNaturalDomain: () => naturalDomain,
    getEffectiveDomain: () => overrideDomain ?? naturalDomain,
    setDomain(domain: ScaleDomain | null): void {
      overrideDomain = domain;
      render();
    },
    setSelectedKeys(keys: readonly string[]): void {
      selectedKeys = new Set(keys);
      render();
    },
    setHoveredKey(key: string | null): void {
      hoveredKey = key;
      render();
    },
    getSharedState: () => ({
      expandedParents: Array.from(expandedParents),
      activeHighlightId,
    }),
    applySharedState(state: Partial<ButterflySharedState>): void {
      if (state.expandedParents) expandedParents = new Set(state.expandedParents);
      if (state.activeHighlightId !== undefined) activeHighlightId = state.activeHighlightId;
      render();
    },
    destroy(): void {
      ro?.disconnect();
      tooltipEl?.remove();
      tooltipEl = null;
      root.remove();
    },
  };
}

export const ButterflyChart = {
  id: 'butterfly',
  mount: mountButterfly,
} as const;
