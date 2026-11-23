import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type StackedAreaChartId = string & {
  readonly __brand: 'StackedAreaChartId';
};
export const asStackedAreaChartId = (id: string): StackedAreaChartId =>
  id as StackedAreaChartId;

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

export interface StackedAreaStep {
  readonly id: string;
  readonly index: number;
  readonly label: string;
  readonly groupId?: string;
  readonly groupLabel?: string;
}

export interface StackedAreaSeries {
  readonly id: string;
  readonly label: string;
  /** Optional entry step index for cohort / long-tail series. */
  readonly originStepIndex?: number;
  readonly groupId?: string;
  readonly color?: string;
}

export interface StackedAreaPoint {
  readonly stepIndex: number;
  readonly seriesId: string;
  readonly value: number;
}

export interface StackedAreaData {
  readonly steps: readonly StackedAreaStep[];
  readonly series: readonly StackedAreaSeries[];
  readonly points: readonly StackedAreaPoint[];
}

export interface StackedAreaOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly showSumLine?: boolean;
  readonly sumLineLabel?: string;
  readonly sumLineColor?: string;
  readonly xAxisTitle?: string;
  readonly yAxisTitle?: string;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly enableBrushZoom?: boolean;
  readonly palette?: readonly string[];
  readonly colorMap?: Readonly<Record<string, string>>;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (
    series: StackedAreaSeries,
    step: StackedAreaStep,
    value: number,
    stepTotal: number
  ) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onTimeWindowChange?: (window: TimeWindow | null) => void;
}

export interface StackedAreaChartInstance {
  readonly chartId: StackedAreaChartId;
  update(data: StackedAreaData, options?: Partial<StackedAreaOptions>): void;
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
  destroy(): void;
}

const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const PARCHMENT = '#F4EFE6';
const UNFOCUSED = '#DED6C6';

const PALETTE_A: readonly string[] = [
  '#DC143C',
  '#2B5B84',
  '#008055',
  '#FFD700',
  '#E87722',
  '#753ABD',
  '#00A7B5',
  '#654321',
  '#D2B48C',
];

const FALLBACK_STYLE_ID = 'dubois-stacked-area-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:visible}
    .dubois-legend-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 14px;padding:4px 8px;font-family:var(--dubois-font-mono,monospace);font-size:10px;text-transform:uppercase;color:var(--dubois-ink,#1A1615)}
    .dubois-legend-item{display:inline-flex;align-items:center;gap:5px;background:transparent;border:none;padding:1px 3px;font:inherit;text-transform:inherit;color:inherit;cursor:pointer}
    .dubois-legend-swatch{inline-size:11px;block-size:11px;border:1px solid var(--dubois-ink,#1A1615);display:inline-block}
    .dubois-legend-swatch--line{inline-size:14px;block-size:3px;border:0.5px solid var(--dubois-ink,#1A1615)}
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

/**
 * Du Bois Stacked Area & Cohort Long-Tail Chart.
 * Renders flat-opaque stacked gouache ribbons (handling staggered cohort entry
 * and zero-value gaps cleanly), clickable period-group brackets, click-to-focus
 * neutral vellum dimming, optional total sum line, and step-snapped brush-zoom.
 */
export function mountStackedArea(
  container: HTMLElement,
  initialData: StackedAreaData,
  initialOptions: StackedAreaOptions = {}
): StackedAreaChartInstance {
  ensureFallbackStyles();

  const chartId = asStackedAreaChartId(
    initialOptions.chartId ?? `stacked-area-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: StackedAreaData = initialData;
  let options: StackedAreaOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let timeWindow: TimeWindow | null = null;
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
    .attr('aria-label', options.ariaLabel ?? 'Stacked area chart');

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

  function render(): void {
    const rect = svgWrap.getBoundingClientRect();
    const width = Math.max(160, Math.round(rect.width || 660));
    const height = Math.max(130, Math.round(rect.height || 360));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const allSteps = [...data.steps].sort((a, b) => a.index - b.index);
    const seriesList = [...data.series].sort(
      (a, b) => (a.originStepIndex ?? 0) - (b.originStepIndex ?? 0)
    );
    const pal = options.palette ?? PALETTE_A;
    const fmt = options.formatValue ?? defaultFormat;

    // Color map by groupId (if grouped cohorts) or seriesId
    const groupColorMap = new Map<string, string>();
    for (const s of seriesList) {
      if (s.groupId && !groupColorMap.has(s.groupId)) {
        groupColorMap.set(
          s.groupId,
          s.color ??
            options.colorMap?.[s.groupId] ??
            pal[groupColorMap.size % pal.length] ??
            PALETTE_A[0]!
        );
      }
    }

    const resolveSeriesColor = (s: StackedAreaSeries, idx: number): string => {
      if (s.color) return s.color;
      if (options.colorMap?.[s.id]) return options.colorMap[s.id]!;
      if (s.groupId && groupColorMap.has(s.groupId)) {
        return groupColorMap.get(s.groupId)!;
      }
      return pal[idx % pal.length] ?? PALETTE_A[0]!;
    };

    // Build step -> series value lookup
    const valueLookup = new Map<string, number>();
    for (const p of data.points) {
      const k = `${p.stepIndex}::${p.seriesId}`;
      valueLookup.set(k, (valueLookup.get(k) ?? 0) + Math.max(0, p.value));
    }

    // Compute natural domain across full timeline
    let maxStepSum = 0;
    const totalsByStep = new Map<number, number>();
    for (const step of allSteps) {
      let sum = 0;
      for (const s of seriesList) {
        sum += valueLookup.get(`${step.index}::${s.id}`) ?? 0;
      }
      totalsByStep.set(step.index, sum);
      maxStepSum = Math.max(maxStepSum, sum);
    }
    naturalDomain = { min: 0, max: maxStepSum > 0 ? maxStepSum * 1.1 : 1 };

    const startIdx = timeWindow
      ? Math.max(0, Math.min(allSteps.length - 1, timeWindow.startIndex))
      : 0;
    const endIdx = timeWindow
      ? Math.max(startIdx, Math.min(allSteps.length - 1, timeWindow.endIndex))
      : Math.max(0, allSteps.length - 1);
    const visibleSteps = allSteps.slice(startIdx, endIdx + 1);

    // Legend (groups if grouped, otherwise series)
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    if (options.showLegend !== false) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      if (groupColorMap.size > 0) {
        const groupLabels = new Map<string, string>();
        for (const st of allSteps) {
          if (st.groupId && st.groupLabel) groupLabels.set(st.groupId, st.groupLabel);
        }
        for (const [gid, color] of groupColorMap) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dubois-legend-item';
          btn.style.opacity = selectedKeys.size > 0 && !selectedKeys.has(gid) ? '0.45' : '1';
          const sw = document.createElement('span');
          sw.className = 'dubois-legend-swatch';
          sw.style.backgroundColor = color;
          const tx = document.createElement('span');
          tx.textContent = groupLabels.get(gid) ?? gid;
          btn.append(sw, tx);
          btn.addEventListener('click', () => {
            if (selectedKeys.has(gid) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([gid]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
          strip.appendChild(btn);
        }
      } else {
        seriesList.forEach((s, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dubois-legend-item';
          btn.style.opacity = selectedKeys.size > 0 && !selectedKeys.has(s.id) ? '0.45' : '1';
          const sw = document.createElement('span');
          sw.className = 'dubois-legend-swatch';
          sw.style.backgroundColor = resolveSeriesColor(s, idx);
          const tx = document.createElement('span');
          tx.textContent = s.label;
          btn.append(sw, tx);
          btn.addEventListener('click', () => {
            if (selectedKeys.has(s.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([s.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
          strip.appendChild(btn);
        });
      }

      if (options.showSumLine !== false) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        item.style.cursor = 'default';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--line';
        sw.style.backgroundColor = options.sumLineColor ?? INK;
        const tx = document.createElement('span');
        tx.textContent = options.sumLineLabel ?? 'Total Sum';
        item.append(sw, tx);
        strip.appendChild(item);
      }

      legendTarget.appendChild(strip);
    }

    const postRect = svgWrap.getBoundingClientRect();
    const finalW = Math.max(160, Math.round(postRect.width || width));
    const finalH = Math.max(48, Math.round(postRect.height || height));

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${finalW} ${finalH}`);

    if (visibleSteps.length === 0 || seriesList.length === 0) {
      svg
        .append('text')
        .attr('x', finalW / 2)
        .attr('y', finalH / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const hasStepGroups = visibleSteps.some((s) => Boolean(s.groupLabel));
    const margin = {
      top: hasStepGroups ? 30 : 16,
      right: 18,
      bottom: options.xAxisTitle && tier !== 'micro' ? 46 : 30,
      left: options.yAxisTitle && tier !== 'micro' ? 58 : 44,
    };

    const innerW = Math.max(50, finalW - margin.left - margin.right);
    const innerH = Math.max(50, finalH - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scalePoint<number>()
      .domain(visibleSteps.map((s) => s.index))
      .range([0, innerW])
      .padding(0.2);

    const eff = overrideDomain ?? naturalDomain;
    const yScale = d3.scaleLinear().domain([eff.min, eff.max]).nice(4).range([innerH, 0]);

    // Guidelines & axes
    const yTicks = yScale.ticks(tier === 'micro' ? 3 : 5);
    g.selectAll('line.grid-y')
      .data(yTicks)
      .join('line')
      .attr('class', 'dubois-guideline-rule')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', GUIDELINE)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '3,3');

    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    g.selectAll('text.y-tick')
      .data(yTicks)
      .join('text')
      .attr('class', 'dubois-axis-tick-label')
      .attr('x', -7)
      .attr('y', (d) => yScale(d) + 3.5)
      .attr('text-anchor', 'end')
      .attr('font-family', "'Space Mono', monospace")
      .attr('font-size', tier === 'micro' ? 8.5 : 10)
      .attr('fill', CHARCOAL)
      .text((d) => fmt(d));

    // Optional period-group brackets at top
    if (hasStepGroups) {
      const spans = new Map<string, { label: string; minX: number; maxX: number; color: string }>();
      for (const st of visibleSteps) {
        if (!st.groupId) continue;
        const px = xScale(st.index);
        if (px === undefined) continue;
        const existing = spans.get(st.groupId);
        const color = groupColorMap.get(st.groupId) ?? INK;
        if (!existing) {
          spans.set(st.groupId, { label: st.groupLabel ?? st.groupId, minX: px, maxX: px, color });
        } else {
          existing.minX = Math.min(existing.minX, px);
          existing.maxX = Math.max(existing.maxX, px);
        }
      }
      for (const [gid, sp] of spans) {
        const midX = (sp.minX + sp.maxX) / 2;
        const grp = g
          .append('g')
          .style('cursor', 'pointer')
          .on('click', () => {
            if (selectedKeys.has(gid) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([gid]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
        grp
          .append('line')
          .attr('x1', sp.minX)
          .attr('x2', sp.maxX)
          .attr('y1', -8)
          .attr('y2', -8)
          .attr('stroke', sp.color)
          .attr('stroke-width', 2.5);
        grp
          .append('text')
          .attr('x', midX)
          .attr('y', -14)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Inter', sans-serif")
          .attr('font-size', tier === 'micro' ? 8 : 9.5)
          .attr('font-weight', 800)
          .attr('fill', INK)
          .text(sp.label.toUpperCase());
      }
    }

    // Build D3 stack table across visible steps
    interface StackRow {
      readonly step: StackedAreaStep;
      readonly values: Readonly<Record<string, number>>;
    }
    const rows: StackRow[] = visibleSteps.map((step) => {
      const vals: Record<string, number> = {};
      for (const s of seriesList) {
        vals[s.id] = valueLookup.get(`${step.index}::${s.id}`) ?? 0;
      }
      return { step, values: vals };
    });

    const stackGen = d3
      .stack<StackRow, string>()
      .keys(seriesList.map((s) => s.id))
      .value((row, key) => row.values[key] ?? 0);

    const stackedLayers = stackGen(rows);

    const areaGen = d3
      .area<d3.SeriesPoint<StackRow>>()
      .defined((d) => d[1] - d[0] > 0)
      .x((d) => xScale(d.data.step.index) ?? 0)
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    const seriesById = new Map(seriesList.map((s) => [s.id, s]));

    stackedLayers.forEach((layer, idx) => {
      const series = seriesById.get(layer.key);
      if (!series) return;
      const rawColor = resolveSeriesColor(series, idx);

      const isFocused =
        selectedKeys.size === 0 ||
        selectedKeys.has(series.id) ||
        (series.groupId !== undefined && selectedKeys.has(series.groupId));
      const isHovered =
        hoveredKey === null ||
        hoveredKey === series.id ||
        hoveredKey === series.groupId;

      const fill = isFocused && isHovered ? rawColor : UNFOCUSED;

      g.append('path')
        .datum(layer)
        .attr('class', 'dubois-gouache-mark')
        .attr('d', areaGen)
        .attr('fill', fill)
        .attr('fill-opacity', 1)
        .attr('stroke', INK)
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mousemove', (ev: MouseEvent) => {
          const [mx] = d3.pointer(ev, g.node());
          let nearest = visibleSteps[0]!;
          let bestDist = Infinity;
          for (const st of visibleSteps) {
            const d = Math.abs((xScale(st.index) ?? 0) - mx);
            if (d < bestDist) {
              bestDist = d;
              nearest = st;
            }
          }
          const val = valueLookup.get(`${nearest.index}::${series.id}`) ?? 0;
          const total = totalsByStep.get(nearest.index) ?? 0;
          const share = total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%';
          const spec = options.formatTooltip
            ? options.formatTooltip(series, nearest, val, total)
            : {
                title: `${series.label} · ${nearest.label}`,
                swatchColor: rawColor,
                rows: [
                  { label: 'Value', value: fmt(val) },
                  { label: 'Step Total', value: fmt(total) },
                  { label: 'Share', value: share },
                ],
              };
          showTooltip(ev, spec);
        })
        .on('mouseenter', () => {
          hoveredKey = series.id;
          options.onHover?.(series.id);
        })
        .on('mouseleave', () => {
          hoveredKey = null;
          options.onHover?.(null);
          hideTooltip();
        })
        .on('click', () => {
          if (selectedKeys.has(series.id) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([series.id]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        });
    });

    // Optional Sum Overlay Line
    if (options.showSumLine !== false) {
      const sumLine = d3
        .line<StackedAreaStep>()
        .x((s) => xScale(s.index) ?? 0)
        .y((s) => yScale(totalsByStep.get(s.index) ?? 0));

      g.append('path')
        .datum(visibleSteps)
        .attr('d', sumLine)
        .attr('fill', 'none')
        .attr('stroke', PARCHMENT)
        .attr('stroke-width', 4)
        .style('pointer-events', 'none');

      g.append('path')
        .datum(visibleSteps)
        .attr('d', sumLine)
        .attr('fill', 'none')
        .attr('stroke', options.sumLineColor ?? INK)
        .attr('stroke-width', 2)
        .style('pointer-events', 'none');
    }

    // X-axis spine & tick labels
    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', innerH)
      .attr('y2', innerH)
      .attr('stroke', INK)
      .attr('stroke-width', 1.2);

    const maxTicks = Math.max(2, Math.floor(innerW / (tier === 'micro' ? 42 : 58)));
    const stride = Math.max(1, Math.ceil(visibleSteps.length / maxTicks));
    visibleSteps.forEach((st, idx) => {
      if (idx % stride !== 0 && idx !== visibleSteps.length - 1) return;
      g.append('text')
        .attr('class', 'dubois-axis-tick-label')
        .attr('x', xScale(st.index) ?? 0)
        .attr('y', innerH + 15)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : 9.5)
        .attr('fill', CHARCOAL)
        .text(st.label);
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

    // Optional discrete step-snapped brush-zoom
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

      const brushG = g.append('g').call(brush);
      brushG.select('.overlay').style('cursor', 'crosshair');
      brushG.on('dblclick', () => {
        timeWindow = null;
        options.onTimeWindowChange?.(null);
        render();
      });
    }

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
    update(nextData: StackedAreaData, nextOptions?: Partial<StackedAreaOptions>): void {
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
    getTimeWindow: () => timeWindow,
    setTimeWindow(window: TimeWindow | null): void {
      timeWindow = window;
      render();
    },
    getStepCount: () => data.steps.length,
    setSelectedKeys(keys: readonly string[]): void {
      selectedKeys = new Set(keys);
      render();
    },
    setHoveredKey(key: string | null): void {
      hoveredKey = key;
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

export const StackedAreaChart = {
  id: 'stacked-area',
  mount: mountStackedArea,
} as const;
