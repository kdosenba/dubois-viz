import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type ColumnsChartId = string & { readonly __brand: 'ColumnsChartId' };
export const asColumnsChartId = (id: string): ColumnsChartId =>
  id as ColumnsChartId;

export type ResponsiveSizeTier = 'expanded' | 'compact' | 'micro';

export interface ScaleDomain {
  readonly min: number;
  readonly max: number;
}

export interface TimeWindow {
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface TooltipSpec {
  readonly title: string;
  readonly swatchColor?: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}

export interface ColumnGroup {
  readonly id: string;
  readonly label: string;
  readonly colorMode?: 'solid' | 'sequential';
  readonly color?: string;
}

export interface ColumnDatum {
  readonly stepId: string;
  readonly stepLabel: string;
  readonly stepOrder?: number;
  readonly groupId?: string;
  readonly seriesId?: string;
  readonly seriesLabel?: string;
  readonly value: number;
  readonly nestedValue?: number;
  readonly benchmarkValue?: number;
  readonly lineOverlayValue?: number;
  readonly color?: string;
}

export interface ColumnsModeSpec {
  readonly id: string;
  readonly label: string;
  readonly bars: readonly ColumnDatum[];
}

export interface ColumnsData {
  readonly bars: readonly ColumnDatum[];
  readonly groups?: readonly ColumnGroup[];
  readonly modes?: readonly ColumnsModeSpec[];
}

export interface ColumnsOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly layout?: 'grouped' | 'stacked';
  readonly colorMode?: 'categorical' | 'sequential';
  readonly showLegend?: boolean;
  readonly legendPosition?: 'top' | 'bottom';
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly showValueLabels?: boolean;
  readonly xAxisTitle?: string;
  readonly yAxisTitle?: string;
  readonly nestedLabel?: string;
  readonly nestedColor?: string;
  readonly benchmarkLabel?: string;
  readonly lineOverlayLabel?: string;
  readonly lineOverlayColor?: string;
  readonly referenceLine?: { readonly value: number; readonly label?: string };
  readonly initialModeId?: string;
  readonly enableBrushZoom?: boolean;
  readonly palette?: readonly string[];
  readonly colorMap?: Readonly<Record<string, string>>;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (datum: ColumnDatum) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onTimeWindowChange?: (window: TimeWindow | null) => void;
  readonly onSharedStateChange?: (state: { readonly activeModeId?: string }) => void;
}

export interface ColumnsChartInstance {
  readonly chartId: ColumnsChartId;
  update(data: ColumnsData, options?: Partial<ColumnsOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  getTimeWindow(): TimeWindow | null;
  setTimeWindow(window: TimeWindow | null): void;
  getStepCount(): number;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  getSharedState(): { readonly activeModeId?: string };
  applySharedState(state: Partial<{ readonly activeModeId?: string }>): void;
  destroy(): void;
}

// ============================================================================
// Canonical Du Bois Palette Tokens & Fallback CSS
// ============================================================================
const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const PARCHMENT = '#F4EFE6';
const UNFOCUSED = '#DED6C6';
const CRIMSON = '#DC143C';
const GOLD = '#FFD700';

const PALETTE_A: readonly string[] = [
  '#2B5B84',
  '#DC143C',
  '#008055',
  '#FFD700',
  '#E87722',
  '#753ABD',
  '#00A7B5',
  '#654321',
  '#D2B48C',
];

const PALETTE_B: readonly string[] = [
  '#A50050',
  '#DC143C',
  '#EE5340',
  '#FFA400',
  '#FFCD00',
  '#FAE053',
  '#DBE442',
  '#8FD14F',
  '#00A651',
  '#007A5E',
  '#00A7B5',
  '#2B5B84',
  '#6638B6',
  '#AF3BC9',
];

const FALLBACK_STYLE_ID = 'dubois-columns-fallback-style';

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
    .dubois-legend-swatch{inline-size:11px;block-size:11px;border:1px solid var(--dubois-ink,#1A1615);display:inline-block}
    .dubois-legend-swatch--dashed{inline-size:14px;block-size:0;border:none;border-block-start:2px dashed var(--dubois-ink,#1A1615)}
    .dubois-legend-swatch--line{inline-size:14px;block-size:3px;border:0.5px solid var(--dubois-ink,#1A1615)}
    .dubois-mode-group{display:inline-flex;border:1px solid var(--dubois-ink,#1A1615);background:var(--dubois-vellum,#EAE2D3)}
    .dubois-mode-btn{appearance:none;border:none;background:transparent;color:var(--dubois-charcoal,#52493E);font-family:var(--dubois-font-mono,monospace);font-size:9.5px;font-weight:700;text-transform:uppercase;padding:2px 8px;cursor:pointer}
    .dubois-mode-btn+.dubois-mode-btn{border-inline-start:1px solid var(--dubois-ink,#1A1615)}
    .dubois-mode-btn--active{background:var(--dubois-ink,#1A1615);color:var(--dubois-parchment,#F4EFE6)}
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

function sampleSequential(index: number, total: number): string {
  if (total <= 1) return PALETTE_B[0] ?? CRIMSON;
  const scaled = Math.round((index / (total - 1)) * (PALETTE_B.length - 1));
  return PALETTE_B[Math.max(0, Math.min(PALETTE_B.length - 1, scaled))] ?? CRIMSON;
}

function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
}

interface StepEntry {
  readonly stepId: string;
  readonly stepLabel: string;
  readonly stepOrder: number;
  readonly groupId?: string;
}

/**
 * Unified Du Bois Column Chart supporting single, grouped, and stacked columns,
 * Palette A or B sequential coloring, X-axis group brackets, inner highlight bars,
 * combo line overlay, benchmark caps, ceiling reference lines, mode switcher,
 * and step-snapped brush-zoom synchronization.
 */
export function mountColumns(
  container: HTMLElement,
  initialData: ColumnsData,
  initialOptions: ColumnsOptions = {}
): ColumnsChartInstance {
  ensureFallbackStyles();

  const chartId = asColumnsChartId(
    initialOptions.chartId ?? `columns-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: ColumnsData = initialData;
  let options: ColumnsOptions = { ...initialOptions };
  let activeModeId: string | undefined =
    options.initialModeId ?? data.modes?.[0]?.id;
  let overrideDomain: ScaleDomain | null = null;
  let timeWindow: TimeWindow | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 1 };

  const root = document.createElement('div');
  root.className = 'dubois-chart-root';
  root.dataset['chartId'] = chartId;

  const topLegendEl = document.createElement('div');
  const svgWrap = document.createElement('div');
  svgWrap.className = 'dubois-chart-svg-wrap';
  const bottomLegendEl = document.createElement('div');

  root.append(topLegendEl, svgWrap, bottomLegendEl);
  container.innerHTML = '';
  container.appendChild(root);

  const svg = d3
    .select(svgWrap)
    .append('svg')
    .attr('class', 'dubois-chart-svg')
    .attr('role', 'img')
    .attr('aria-label', options.ariaLabel ?? 'Column chart');

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
    const x = Math.min(ev.clientX + 14, window.innerWidth - 260);
    const y = Math.min(ev.clientY + 14, window.innerHeight - 140);
    tooltipEl.style.left = `${Math.max(8, x)}px`;
    tooltipEl.style.top = `${Math.max(8, y)}px`;
  }

  function hideTooltip(): void {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function getActiveBars(): readonly ColumnDatum[] {
    if (data.modes && data.modes.length > 0) {
      const match = data.modes.find((m) => m.id === activeModeId) ?? data.modes[0];
      if (match) return match.bars;
    }
    return data.bars;
  }

  function getOrderedSteps(bars: readonly ColumnDatum[]): readonly StepEntry[] {
    const map = new Map<string, StepEntry>();
    bars.forEach((b, idx) => {
      if (!map.has(b.stepId)) {
        map.set(b.stepId, {
          stepId: b.stepId,
          stepLabel: b.stepLabel,
          stepOrder: b.stepOrder ?? idx,
          groupId: b.groupId,
        });
      }
    });
    const groupOrder = new Map<string, number>();
    data.groups?.forEach((g, idx) => groupOrder.set(g.id, idx));

    return Array.from(map.values()).sort((a, b) => {
      if (groupOrder.size > 0 && a.groupId !== b.groupId) {
        const ga = a.groupId ? groupOrder.get(a.groupId) ?? 999 : 999;
        const gb = b.groupId ? groupOrder.get(b.groupId) ?? 999 : 999;
        if (ga !== gb) return ga - gb;
      }
      return a.stepOrder - b.stepOrder;
    });
  }

  function resolveSeriesColor(
    seriesId: string,
    seriesIndex: number,
    seriesCount: number,
    explicitColor?: string,
    stepGroupId?: string,
    stepIndexInGroup = 0,
    groupSize = 1
  ): string {
    if (explicitColor) return explicitColor;
    if (options.colorMap?.[seriesId]) return options.colorMap[seriesId]!;
    if (seriesCount <= 1 && stepGroupId && data.groups) {
      const grp = data.groups.find((g) => g.id === stepGroupId);
      if (grp) {
        if (grp.colorMode === 'sequential') {
          return sampleSequential(stepIndexInGroup, groupSize);
        }
        if (grp.color) return grp.color;
      }
    }
    if (options.colorMode === 'sequential') {
      return sampleSequential(seriesIndex, seriesCount);
    }
    const pal = options.palette ?? PALETTE_A;
    return pal[seriesIndex % pal.length] ?? PALETTE_A[0]!;
  }

  function computeNaturalDomain(bars: readonly ColumnDatum[]): ScaleDomain {
    const layout = options.layout ?? 'grouped';
    let maxVal = 0;

    if (layout === 'stacked') {
      const sums = new Map<string, number>();
      for (const b of bars) {
        sums.set(b.stepId, (sums.get(b.stepId) ?? 0) + Math.max(0, b.value));
        if (typeof b.benchmarkValue === 'number') maxVal = Math.max(maxVal, b.benchmarkValue);
        if (typeof b.lineOverlayValue === 'number') maxVal = Math.max(maxVal, b.lineOverlayValue);
      }
      for (const s of sums.values()) maxVal = Math.max(maxVal, s);
    } else {
      for (const b of bars) {
        maxVal = Math.max(
          maxVal,
          b.value,
          b.nestedValue ?? 0,
          b.benchmarkValue ?? 0,
          b.lineOverlayValue ?? 0
        );
      }
    }

    if (options.referenceLine) {
      maxVal = Math.max(maxVal, options.referenceLine.value);
    }
    return { min: 0, max: maxVal > 0 ? maxVal * 1.12 : 1 };
  }

  function render(): void {
    const rect = svgWrap.getBoundingClientRect();
    const width = Math.max(120, Math.round(rect.width || 640));
    const height = Math.max(120, Math.round(rect.height || 360));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    root.classList.toggle('dubois-chart-root--micro', tier === 'micro');
    root.classList.toggle('dubois-chart-root--compact', tier === 'compact');

    const activeBars = getActiveBars();
    const allSteps = getOrderedSteps(activeBars);
    naturalDomain = computeNaturalDomain(activeBars);

    const startIdx = timeWindow
      ? Math.max(0, Math.min(allSteps.length - 1, timeWindow.startIndex))
      : 0;
    const endIdx = timeWindow
      ? Math.max(startIdx, Math.min(allSteps.length - 1, timeWindow.endIndex))
      : Math.max(0, allSteps.length - 1);
    const visibleSteps = allSteps.slice(startIdx, endIdx + 1);
    const visibleStepIds = new Set(visibleSteps.map((s) => s.stepId));
    const visibleBars = activeBars.filter((b) => visibleStepIds.has(b.stepId));

    const seriesMeta = new Map<string, { label: string; color?: string }>();
    for (const b of activeBars) {
      const sid = b.seriesId ?? '__default__';
      if (!seriesMeta.has(sid)) {
        seriesMeta.set(sid, { label: b.seriesLabel ?? sid, color: b.color });
      }
    }
    const seriesIds = Array.from(seriesMeta.keys());
    const layout = options.layout ?? 'grouped';
    const fmt = options.formatValue ?? defaultFormat;

    // Legend & optional Mode Switcher
    const legendTarget =
      options.externalLegendEl ??
      (options.legendPosition === 'bottom' ? bottomLegendEl : topLegendEl);
    topLegendEl.innerHTML = '';
    bottomLegendEl.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const hasNested = activeBars.some((b) => typeof b.nestedValue === 'number' && b.nestedValue > 0);
    const hasBenchmark = activeBars.some((b) => typeof b.benchmarkValue === 'number');
    const hasLine = activeBars.some((b) => typeof b.lineOverlayValue === 'number');
    const hasModes = Boolean(data.modes && data.modes.length > 1);

    if (options.showLegend !== false && (seriesIds.length > 1 || hasNested || hasBenchmark || hasLine || hasModes || (data.groups && data.groups.length > 0))) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      if (hasModes && data.modes) {
        const modeGroup = document.createElement('div');
        modeGroup.className = 'dubois-mode-group';
        for (const m of data.modes) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className =
            m.id === activeModeId
              ? 'dubois-mode-btn dubois-mode-btn--active'
              : 'dubois-mode-btn';
          btn.textContent = m.label;
          btn.addEventListener('click', () => {
            activeModeId = m.id;
            options.onSharedStateChange?.({ activeModeId });
            render();
          });
          modeGroup.appendChild(btn);
        }
        strip.appendChild(modeGroup);
      }

      if (data.groups && data.groups.length > 0 && seriesIds.length <= 1) {
        data.groups.forEach((g, idx) => {
          const item = document.createElement('span');
          item.className = 'dubois-legend-item';
          const sw = document.createElement('span');
          sw.className = 'dubois-legend-swatch';
          sw.style.backgroundColor =
            g.color ?? (g.colorMode === 'sequential' ? PALETTE_B[0]! : PALETTE_A[idx % PALETTE_A.length]!);
          const lbl = document.createElement('span');
          lbl.textContent = g.label;
          item.append(sw, lbl);
          strip.appendChild(item);
        });
      } else if (seriesIds.length > 1) {
        seriesIds.forEach((sid, idx) => {
          const meta = seriesMeta.get(sid);
          const item = document.createElement('button');
          item.type = 'button';
          item.className =
            selectedKeys.size > 0 && !selectedKeys.has(sid)
              ? 'dubois-legend-item dubois-legend-item--interactive dubois-legend-item--inactive'
              : 'dubois-legend-item dubois-legend-item--interactive';
          const sw = document.createElement('span');
          sw.className = 'dubois-legend-swatch';
          sw.style.backgroundColor = resolveSeriesColor(sid, idx, seriesIds.length, meta?.color);
          const lbl = document.createElement('span');
          lbl.textContent = meta?.label ?? sid;
          item.append(sw, lbl);
          item.addEventListener('click', () => {
            if (selectedKeys.has(sid) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([sid]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
          strip.appendChild(item);
        });
      }

      if (hasNested) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor = options.nestedColor ?? GOLD;
        const lbl = document.createElement('span');
        lbl.textContent = options.nestedLabel ?? 'Highlighted Subset';
        item.append(sw, lbl);
        strip.appendChild(item);
      }

      if (hasLine) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--line';
        sw.style.backgroundColor = options.lineOverlayColor ?? CRIMSON;
        const lbl = document.createElement('span');
        lbl.textContent = options.lineOverlayLabel ?? 'Overlay Trend';
        item.append(sw, lbl);
        strip.appendChild(item);
      }

      if (hasBenchmark) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--dashed';
        const lbl = document.createElement('span');
        lbl.textContent = options.benchmarkLabel ?? 'Benchmark';
        item.append(sw, lbl);
        strip.appendChild(item);
      }

      legendTarget.appendChild(strip);
    }

    // Re-measure svgWrap AFTER legend renders so viewBox matches exact pixel aspect ratio
    const postRect = svgWrap.getBoundingClientRect();
    const finalW = Math.max(120, Math.round(postRect.width || width));
    const finalH = Math.max(48, Math.round(postRect.height || height));

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${finalW} ${finalH}`);

    if (visibleSteps.length === 0) {
      svg
        .append('text')
        .attr('x', finalW / 2)
        .attr('y', finalH / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const hasGroups = Boolean(data.groups && data.groups.length > 0);
    const margin = {
      top: (hasGroups ? 30 : 14) + (options.referenceLine ? 6 : 0),
      right: tier === 'micro' ? 10 : 18,
      bottom: tier === 'micro' ? 24 : options.xAxisTitle ? 48 : 34,
      left: tier === 'micro' ? 32 : options.yAxisTitle ? 58 : 44,
    };

    const innerW = Math.max(40, finalW - margin.left - margin.right);
    const innerH = Math.max(40, finalH - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xBand = d3
      .scaleBand<string>()
      .domain(visibleSteps.map((s) => s.stepId))
      .range([0, innerW])
      .padding(visibleSteps.length > 24 ? 0.14 : 0.24);

    const effective = overrideDomain ?? naturalDomain;
    const yScale = d3
      .scaleLinear()
      .domain([effective.min, effective.max])
      .nice(4)
      .range([innerH, 0]);

    // Subtle horizontal dashed guidelines
    const ticks = yScale.ticks(tier === 'micro' ? 3 : 5);
    g.append('g')
      .selectAll('line')
      .data(ticks)
      .join('line')
      .attr('class', 'dubois-guideline-rule')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', GUIDELINE)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '3,3');

    // Y-axis ticks & spine
    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    g.append('g')
      .selectAll('text')
      .data(ticks)
      .join('text')
      .attr('class', 'dubois-axis-tick-label')
      .attr('x', -6)
      .attr('y', (d) => yScale(d) + 3.5)
      .attr('text-anchor', 'end')
      .attr('font-family', "'Space Mono', monospace")
      .attr('font-size', tier === 'micro' ? 8.5 : 10)
      .attr('fill', CHARCOAL)
      .text((d) => fmt(d));

    // Group brackets & vertical dividers
    const groupStepCounts = new Map<string, number>();
    const groupStepIndices = new Map<string, number>();
    if (hasGroups && data.groups) {
      const spans = new Map<string, { minX: number; maxX: number; label: string }>();
      for (const s of visibleSteps) {
        if (!s.groupId) continue;
        groupStepCounts.set(s.groupId, (groupStepCounts.get(s.groupId) ?? 0) + 1);
        const sx = xBand(s.stepId);
        if (sx === undefined) continue;
        const cur = spans.get(s.groupId);
        const grp = data.groups.find((gr) => gr.id === s.groupId);
        const right = sx + xBand.bandwidth();
        if (!cur) {
          spans.set(s.groupId, { minX: sx, maxX: right, label: grp?.label ?? s.groupId });
        } else {
          cur.minX = Math.min(cur.minX, sx);
          cur.maxX = Math.max(cur.maxX, right);
        }
      }

      const spanEntries = Array.from(spans.values());
      spanEntries.forEach((sp, i) => {
        if (i > 0) {
          const prev = spanEntries[i - 1]!;
          const divX = (prev.maxX + sp.minX) / 2;
          g.append('line')
            .attr('x1', divX)
            .attr('x2', divX)
            .attr('y1', -18)
            .attr('y2', innerH)
            .attr('stroke', GUIDELINE)
            .attr('stroke-dasharray', '3,3')
            .attr('stroke-width', 1);
        }
        g.append('line')
          .attr('x1', sp.minX)
          .attr('x2', sp.maxX)
          .attr('y1', -8)
          .attr('y2', -8)
          .attr('stroke', INK)
          .attr('stroke-width', 1.2);
        g.append('text')
          .attr('x', (sp.minX + sp.maxX) / 2)
          .attr('y', -13)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Inter', sans-serif")
          .attr('font-size', tier === 'micro' ? 8 : 9.5)
          .attr('font-weight', 800)
          .attr('fill', INK)
          .text(sp.label.toUpperCase());
      });
    }

    // Build lookup by stepId -> bars
    const barsByStep = d3.group(visibleBars, (b) => b.stepId);
    const xInner = d3
      .scaleBand<string>()
      .domain(seriesIds)
      .range([0, xBand.bandwidth()])
      .padding(seriesIds.length > 1 ? 0.08 : 0);

    const barsLayer = g.append('g');
    const benchmarkLayer = g.append('g').attr('class', 'dubois-prior-layer');
    const labelsLayer = g.append('g');

    visibleSteps.forEach((step) => {
      const stepBars = barsByStep.get(step.stepId) ?? [];
      const stepLineOverlay = stepBars.find(
        (b) => typeof b.lineOverlayValue === 'number'
      )?.lineOverlayValue;
      const baseX = xBand(step.stepId);
      if (baseX === undefined) return;

      let groupIdx = 0;
      let groupSize = 1;
      if (step.groupId) {
        groupIdx = groupStepIndices.get(step.groupId) ?? 0;
        groupStepIndices.set(step.groupId, groupIdx + 1);
        groupSize = groupStepCounts.get(step.groupId) ?? 1;
      }

      if (layout === 'stacked') {
        let runningY = 0;
        let stepBenchmark: number | undefined;

        seriesIds.forEach((sid, sIdx) => {
          const datum = stepBars.find((b) => (b.seriesId ?? '__default__') === sid);
          if (!datum || datum.value <= 0) return;
          if (typeof datum.benchmarkValue === 'number') {
            stepBenchmark = (stepBenchmark ?? 0) + datum.benchmarkValue;
          }
          const y0 = runningY;
          runningY += datum.value;
          const topY = yScale(runningY);
          const botY = yScale(y0);
          const barH = Math.max(0, botY - topY);

          const isDimmed =
            (selectedKeys.size > 0 && !selectedKeys.has(sid) && !selectedKeys.has(step.stepId)) ||
            (hoveredKey !== null && hoveredKey !== sid && hoveredKey !== step.stepId);

          const rawColor = resolveSeriesColor(
            sid,
            sIdx,
            seriesIds.length,
            datum.color,
            step.groupId,
            groupIdx,
            groupSize
          );

          barsLayer
            .append('rect')
            .attr('class', 'dubois-gouache-mark')
            .attr('x', baseX)
            .attr('y', topY)
            .attr('width', xBand.bandwidth())
            .attr('height', barH)
            .attr('fill', isDimmed ? UNFOCUSED : rawColor)
            .attr('fill-opacity', 1)
            .attr('stroke', INK)
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mousemove', (ev: MouseEvent) => {
              const spec = options.formatTooltip
                ? options.formatTooltip(datum)
                : {
                    title: `${step.stepLabel}${seriesIds.length > 1 ? ` · ${datum.seriesLabel ?? sid}` : ''}`,
                    swatchColor: rawColor,
                    rows: [
                      { label: 'Value', value: fmt(datum.value) },
                      { label: 'Step Total', value: fmt(runningY) },
                    ],
                  };
              showTooltip(ev, spec);
            })
            .on('mouseenter', () => {
              hoveredKey = sid;
              options.onHover?.(sid);
            })
            .on('mouseleave', () => {
              hoveredKey = null;
              options.onHover?.(null);
              hideTooltip();
            })
            .on('click', () => {
              const targetKey = seriesIds.length > 1 ? sid : step.stepId;
              if (selectedKeys.has(targetKey) && selectedKeys.size === 1) selectedKeys.clear();
              else selectedKeys = new Set([targetKey]);
              options.onSelect?.(Array.from(selectedKeys));
              render();
            });
        });

        if (typeof stepBenchmark === 'number') {
          const by = yScale(stepBenchmark);
          benchmarkLayer
            .append('line')
            .attr('class', 'dubois-benchmark-cap')
            .attr('x1', baseX - 2)
            .attr('x2', baseX + xBand.bandwidth() + 2)
            .attr('y1', by)
            .attr('y2', by)
            .attr('stroke', INK)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,2');
        }

        if (options.showValueLabels !== false && tier === 'expanded' && visibleSteps.length <= 20 && runningY > 0) {
          labelsLayer
            .append('text')
            .attr('class', 'dubois-value-label')
            .attr('x', baseX + xBand.bandwidth() / 2)
            .attr('y', yScale(runningY) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 9.5)
            .attr('font-weight', 700)
            .attr('fill', INK)
            .text(fmt(runningY));
        }
      } else {
        seriesIds.forEach((sid, sIdx) => {
          const datum = stepBars.find((b) => (b.seriesId ?? '__default__') === sid);
          if (!datum) return;
          const bx = baseX + (xInner(sid) ?? 0);
          const bw = xInner.bandwidth();
          const topY = yScale(Math.max(0, datum.value));
          const botY = yScale(0);
          const barH = Math.max(0, botY - topY);

          const key = seriesIds.length > 1 ? sid : step.stepId;
          const isDimmed =
            (selectedKeys.size > 0 && !selectedKeys.has(key)) ||
            (hoveredKey !== null && hoveredKey !== key);

          const rawColor = resolveSeriesColor(
            sid,
            sIdx,
            seriesIds.length,
            datum.color,
            step.groupId,
            groupIdx,
            groupSize
          );

          barsLayer
            .append('rect')
            .attr('class', 'dubois-gouache-mark')
            .attr('x', bx)
            .attr('y', topY)
            .attr('width', bw)
            .attr('height', barH)
            .attr('fill', isDimmed ? UNFOCUSED : rawColor)
            .attr('fill-opacity', 1)
            .attr('stroke', INK)
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mousemove', (ev: MouseEvent) => {
              const rows: { label: string; value: string }[] = [
                { label: 'Value', value: fmt(datum.value) },
              ];
              if (typeof datum.nestedValue === 'number') {
                rows.push({
                  label: options.nestedLabel ?? 'Subset',
                  value: fmt(datum.nestedValue),
                });
              }
              if (typeof datum.benchmarkValue === 'number') {
                rows.push({
                  label: options.benchmarkLabel ?? 'Benchmark',
                  value: fmt(datum.benchmarkValue),
                });
              }
              const spec = options.formatTooltip
                ? options.formatTooltip(datum)
                : {
                    title: `${step.stepLabel}${seriesIds.length > 1 ? ` · ${datum.seriesLabel ?? sid}` : ''}`,
                    swatchColor: rawColor,
                    rows,
                  };
              showTooltip(ev, spec);
            })
            .on('mouseenter', () => {
              hoveredKey = key;
              options.onHover?.(key);
            })
            .on('mouseleave', () => {
              hoveredKey = null;
              options.onHover?.(null);
              hideTooltip();
            })
            .on('click', () => {
              if (selectedKeys.has(key) && selectedKeys.size === 1) selectedKeys.clear();
              else selectedKeys = new Set([key]);
              options.onSelect?.(Array.from(selectedKeys));
              render();
            });

          // Optional inner nested bar
          if (typeof datum.nestedValue === 'number' && datum.nestedValue > 0) {
            const nw = Math.max(3, bw * 0.46);
            const nx = bx + (bw - nw) / 2;
            const ny = yScale(datum.nestedValue);
            barsLayer
              .append('rect')
              .attr('class', 'dubois-gouache-mark')
              .attr('x', nx)
              .attr('y', ny)
              .attr('width', nw)
              .attr('height', Math.max(0, botY - ny))
              .attr('fill', options.nestedColor ?? GOLD)
              .attr('fill-opacity', 1)
              .attr('stroke', INK)
              .attr('stroke-width', 1)
              .style('pointer-events', 'none');
          }

          // Optional dashed horizontal benchmark cap
          if (typeof datum.benchmarkValue === 'number') {
            const by = yScale(datum.benchmarkValue);
            benchmarkLayer
              .append('line')
              .attr('class', 'dubois-benchmark-cap')
              .attr('x1', bx - 2)
              .attr('x2', bx + bw + 2)
              .attr('y1', by)
              .attr('y2', by)
              .attr('stroke', INK)
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '3,2');
          }

          if (
            options.showValueLabels !== false &&
            tier === 'expanded' &&
            visibleSteps.length * seriesIds.length <= 24 &&
            datum.value > 0
          ) {
            const benchY =
              typeof datum.benchmarkValue === 'number' ? yScale(datum.benchmarkValue) : topY;
            let labelY = Math.min(topY, benchY) - 6;
            if (typeof stepLineOverlay === 'number') {
              const lineY = yScale(stepLineOverlay);
              if (Math.abs(labelY - lineY) < 12) {
                labelY = Math.min(labelY, lineY - 9);
              }
            }
            labelsLayer
              .append('text')
              .attr('class', 'dubois-value-label')
              .attr('x', bx + bw / 2)
              .attr('y', Math.max(9, labelY))
              .attr('text-anchor', 'middle')
              .attr('font-family', "'Space Mono', monospace")
              .attr('font-size', 9.5)
              .attr('font-weight', 700)
              .attr('fill', INK)
              .text(fmt(datum.value));
          }
        });
      }
    });

    // Optional combo line overlay
    if (hasLine) {
      const linePts: { x: number; y: number }[] = [];
      for (const s of visibleSteps) {
        const sBars = barsByStep.get(s.stepId) ?? [];
        const withLine = sBars.find((b) => typeof b.lineOverlayValue === 'number');
        const sx = xBand(s.stepId);
        if (withLine && typeof withLine.lineOverlayValue === 'number' && sx !== undefined) {
          linePts.push({
            x: sx + xBand.bandwidth() / 2,
            y: yScale(withLine.lineOverlayValue),
          });
        }
      }
      if (linePts.length > 0) {
        const lineColor = options.lineOverlayColor ?? CRIMSON;
        const gen = d3
          .line<{ x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y);
        g.append('path')
          .datum(linePts)
          .attr('d', gen)
          .attr('fill', 'none')
          .attr('stroke', INK)
          .attr('stroke-width', 3.6);
        g.append('path')
          .datum(linePts)
          .attr('d', gen)
          .attr('fill', 'none')
          .attr('stroke', lineColor)
          .attr('stroke-width', 2);
        g.selectAll('circle.dubois-line-dot')
          .data(linePts)
          .join('circle')
          .attr('class', 'dubois-gouache-mark')
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y)
          .attr('r', 3.5)
          .attr('fill', lineColor)
          .attr('stroke', INK)
          .attr('stroke-width', 1);
      }
    }

    // Optional horizontal reference / ceiling line
    if (options.referenceLine) {
      const ry = yScale(options.referenceLine.value);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', ry)
        .attr('y2', ry)
        .attr('stroke', CRIMSON)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,3');
      if (options.referenceLine.label) {
        g.append('text')
          .attr('x', innerW - 4)
          .attr('y', ry - 5)
          .attr('text-anchor', 'end')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 9.5)
          .attr('font-weight', 700)
          .attr('fill', CRIMSON)
          .text(options.referenceLine.label.toUpperCase());
      }
    }

    // X-axis spine & tick labels (smart stride to prevent overlap)
    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', innerH)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    const maxLabels = Math.max(2, Math.floor(innerW / (tier === 'micro' ? 42 : 52)));
    const stride = Math.max(1, Math.ceil(visibleSteps.length / maxLabels));
    visibleSteps.forEach((s, idx) => {
      if (idx % stride !== 0 && idx !== visibleSteps.length - 1) return;
      const sx = xBand(s.stepId);
      if (sx === undefined) return;
      g.append('text')
        .attr('class', 'dubois-axis-tick-label')
        .attr('x', sx + xBand.bandwidth() / 2)
        .attr('y', innerH + 14)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : 9.5)
        .attr('fill', CHARCOAL)
        .text(s.stepLabel);
    });

    if (options.xAxisTitle && tier !== 'micro') {
      g.append('text')
        .attr('class', 'dubois-axis-title')
        .attr('x', innerW / 2)
        .attr('y', innerH + 34)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text(options.xAxisTitle.toUpperCase());
    }

    if (options.yAxisTitle && tier !== 'micro') {
      g.append('text')
        .attr('class', 'dubois-axis-title')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -margin.left + 14)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text(options.yAxisTitle.toUpperCase());
    }

    // Optional step-snapped horizontal brush zoom
    if (options.enableBrushZoom && allSteps.length > 3) {
      const brush = d3
        .brushX()
        .extent([
          [0, 0],
          [innerW, innerH],
        ])
        .on('end', (ev: d3.D3BrushEvent<unknown>) => {
          if (!ev.selection) return;
          const [px0, px1] = ev.selection as [number, number];
          if (px1 - px0 < 8) return;
          const localStart = Math.max(
            0,
            Math.floor((px0 / innerW) * visibleSteps.length)
          );
          const localEnd = Math.min(
            visibleSteps.length - 1,
            Math.floor((px1 / innerW) * visibleSteps.length)
          );
          if (localEnd > localStart) {
            timeWindow = {
              startIndex: startIdx + localStart,
              endIndex: startIdx + localEnd,
            };
            options.onTimeWindowChange?.(timeWindow);
            render();
          }
        });

      const brushG = g.append('g').attr('class', 'dubois-brush-layer').call(brush);
      brushG.select('.overlay').style('cursor', 'crosshair');
      brushG.on('dblclick', () => {
        timeWindow = null;
        options.onTimeWindowChange?.(null);
        render();
      });
    }

    // Reset zoom indicator pill if zoomed
    if (timeWindow !== null) {
      const badge = g
        .append('g')
        .style('cursor', 'pointer')
        .on('click', () => {
          timeWindow = null;
          options.onTimeWindowChange?.(null);
          render();
        });
      badge
        .append('rect')
        .attr('x', innerW - 88)
        .attr('y', -16)
        .attr('width', 88)
        .attr('height', 15)
        .attr('fill', PARCHMENT)
        .attr('stroke', INK)
        .attr('stroke-width', 1);
      badge
        .append('text')
        .attr('x', innerW - 44)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 8.5)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text('RESET ZOOM ×');
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
    update(nextData: ColumnsData, nextOptions?: Partial<ColumnsOptions>): void {
      data = nextData;
      if (nextOptions) options = { ...options, ...nextOptions };
      if (data.modes && !data.modes.some((m) => m.id === activeModeId)) {
        activeModeId = data.modes[0]?.id;
      }
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
    getTimeWindow: () => timeWindow,
    setTimeWindow(window: TimeWindow | null): void {
      timeWindow = window;
      render();
    },
    getStepCount: () => getOrderedSteps(getActiveBars()).length,
    setSelectedKeys(keys: readonly string[]): void {
      selectedKeys = new Set(keys);
      render();
    },
    setHoveredKey(key: string | null): void {
      hoveredKey = key;
      render();
    },
    getSharedState: () => ({ activeModeId }),
    applySharedState(state: Partial<{ readonly activeModeId?: string }>): void {
      if (state.activeModeId !== undefined) {
        activeModeId = state.activeModeId;
        render();
      }
    },
    destroy(): void {
      ro?.disconnect();
      tooltipEl?.remove();
      tooltipEl = null;
      root.remove();
    },
  };
}

export const ColumnsChart = {
  id: 'columns',
  mount: mountColumns,
} as const;
