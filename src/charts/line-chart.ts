import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type LineChartId = string & { readonly __brand: 'LineChartId' };
export const asLineChartId = (id: string): LineChartId => id as LineChartId;

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

export interface LinePoint {
  readonly seriesId: string;
  readonly seriesLabel?: string;
  readonly x: number;
  readonly xLabel?: string;
  readonly value: number;
  /** Optional denominator: when provided, plotted Y = (value / denominator) * 100. */
  readonly denominator?: number;
  readonly baselineValue?: number;
  readonly color?: string;
}

export interface LineChartModeSpec {
  readonly id: string;
  readonly label: string;
  readonly points: readonly LinePoint[];
}

export interface LineChartData {
  readonly points: readonly LinePoint[];
  readonly modes?: readonly LineChartModeSpec[];
}

export interface LineChartOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly xAxisTitle?: string;
  readonly yAxisTitle?: string;
  readonly baselineLabel?: string;
  readonly yDomain?: readonly [number, number];
  readonly directLabels?: boolean;
  readonly showPoints?: boolean;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly initialModeId?: string;
  readonly palette?: readonly string[];
  readonly colorMap?: Readonly<Record<string, string>>;
  readonly formatX?: (x: number) => string;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (point: LinePoint, computedY: number) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onSharedStateChange?: (state: { readonly activeModeId?: string }) => void;
}

export interface LineChartInstance {
  readonly chartId: LineChartId;
  update(data: LineChartData, options?: Partial<LineChartOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
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
const UNFOCUSED = '#DED6C6';

const PALETTE_A: readonly string[] = [
  '#DC143C',
  '#2B5B84',
  '#008055',
  '#E87722',
  '#753ABD',
  '#00A7B5',
  '#654321',
  '#FFD700',
  '#D2B48C',
];

const FALLBACK_STYLE_ID = 'dubois-line-chart-fallback-style';

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
    .dubois-legend-swatch--dashed{inline-size:14px;block-size:0;border:none;border-block-start:2px dashed var(--dubois-ink,#1A1615)}
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

function computeY(pt: LinePoint): number {
  if (typeof pt.denominator === 'number' && pt.denominator > 0) {
    return (pt.value / pt.denominator) * 100;
  }
  return pt.value;
}

function defaultFormat(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
}

/**
 * Multi-series Du Bois Line Chart supporting time series, retention/survival
 * curves, cumulative distributions, dashed baseline comparisons, collision-free
 * direct right-margin labels, and optional mode switching.
 */
export function mountLineChart(
  container: HTMLElement,
  initialData: LineChartData,
  initialOptions: LineChartOptions = {}
): LineChartInstance {
  ensureFallbackStyles();

  const chartId = asLineChartId(
    initialOptions.chartId ?? `line-chart-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: LineChartData = initialData;
  let options: LineChartOptions = { ...initialOptions };
  let activeModeId: string | undefined =
    options.initialModeId ?? data.modes?.[0]?.id;
  let overrideDomain: ScaleDomain | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 100 };

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
    .attr('aria-label', options.ariaLabel ?? 'Multi-series line chart');

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

  function getActivePoints(): readonly LinePoint[] {
    if (data.modes && data.modes.length > 0) {
      return (data.modes.find((m) => m.id === activeModeId) ?? data.modes[0])?.points ?? [];
    }
    return data.points;
  }

  function render(): void {
    const rect = svgWrap.getBoundingClientRect();
    const width = Math.max(160, Math.round(rect.width || 640));
    const height = Math.max(120, Math.round(rect.height || 360));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const pts = getActivePoints();
    const grouped = d3.group(pts, (p) => p.seriesId);
    const seriesList = Array.from(grouped.entries()).map(([seriesId, rawPts], idx) => {
      const sorted = [...rawPts].sort((a, b) => a.x - b.x);
      const pal = options.palette ?? PALETTE_A;
      const color =
        sorted[0]?.color ??
        options.colorMap?.[seriesId] ??
        pal[idx % pal.length] ??
        PALETTE_A[0]!;
      return {
        seriesId,
        label: sorted[0]?.seriesLabel ?? seriesId,
        color,
        points: sorted,
      };
    });

    const isRatio = pts.some((p) => typeof p.denominator === 'number');
    const fmt = options.formatValue ?? (isRatio ? (v: number) => `${v.toFixed(0)}%` : defaultFormat);

    if (options.yDomain) {
      naturalDomain = { min: options.yDomain[0], max: options.yDomain[1] };
    } else {
      const allY = pts.flatMap((p) => {
        const y = computeY(p);
        return typeof p.baselineValue === 'number' ? [y, p.baselineValue] : [y];
      });
      const minY = d3.min(allY) ?? 0;
      const maxY = d3.max(allY) ?? 1;
      naturalDomain = {
        min: Math.min(0, minY),
        max: maxY > 0 ? maxY * 1.08 : 1,
      };
    }

    // Legend
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const hasBaseline = pts.some((p) => typeof p.baselineValue === 'number');
    if (options.showLegend !== false) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      if (data.modes && data.modes.length > 1) {
        const grp = document.createElement('div');
        grp.className = 'dubois-mode-group';
        for (const m of data.modes) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className =
            m.id === activeModeId ? 'dubois-mode-btn dubois-mode-btn--active' : 'dubois-mode-btn';
          btn.textContent = m.label;
          btn.addEventListener('click', () => {
            activeModeId = m.id;
            options.onSharedStateChange?.({ activeModeId });
            render();
          });
          grp.appendChild(btn);
        }
        strip.appendChild(grp);
      }

      for (const s of seriesList) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dubois-legend-item';
        btn.style.opacity =
          selectedKeys.size > 0 && !selectedKeys.has(s.seriesId) ? '0.45' : '1';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor = s.color;
        const tx = document.createElement('span');
        tx.textContent = s.label;
        btn.append(sw, tx);
        btn.addEventListener('click', () => {
          if (selectedKeys.has(s.seriesId) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([s.seriesId]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        });
        strip.appendChild(btn);
      }

      if (hasBaseline) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        item.style.cursor = 'default';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--dashed';
        const tx = document.createElement('span');
        tx.textContent = options.baselineLabel ?? 'Baseline';
        item.append(sw, tx);
        strip.appendChild(item);
      }

      legendTarget.appendChild(strip);
    }

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (pts.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const useDirectLabels = options.directLabels !== false && tier === 'expanded';
    const margin = {
      top: 16,
      right: useDirectLabels ? 128 : 18,
      bottom: options.xAxisTitle && tier !== 'micro' ? 46 : 30,
      left: options.yAxisTitle && tier !== 'micro' ? 58 : 44,
    };

    const innerW = Math.max(50, width - margin.left - margin.right);
    const innerH = Math.max(50, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(pts, (p) => p.x) as [number, number];
    const xScale = d3
      .scaleLinear()
      .domain(xExtent[0] === xExtent[1] ? [xExtent[0], xExtent[1] + 1] : xExtent)
      .range([0, innerW]);

    const eff = overrideDomain ?? naturalDomain;
    const yScale = d3.scaleLinear().domain([eff.min, eff.max]).range([innerH, 0]);

    // Gridlines & Y axis
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

    g.append('line')
      .attr('class', 'dubois-axis-spine')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', innerH)
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

    // X ticks (use explicit xLabels if present, else d3 ticks)
    const xLabelByVal = new Map<number, string>();
    for (const p of pts) {
      if (p.xLabel) xLabelByVal.set(p.x, p.xLabel);
    }
    const uniqueXs = Array.from(new Set(pts.map((p) => p.x))).sort((a, b) => a - b);
    const xTicks =
      uniqueXs.length <= 12
        ? uniqueXs
        : xScale.ticks(tier === 'micro' ? 3 : 6);

    g.selectAll('text.x-tick')
      .data(xTicks)
      .join('text')
      .attr('class', 'dubois-axis-tick-label')
      .attr('x', (d) => xScale(d))
      .attr('y', innerH + 15)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'Space Mono', monospace")
      .attr('font-size', tier === 'micro' ? 8.5 : 9.5)
      .attr('fill', CHARCOAL)
      .text((d) => xLabelByVal.get(d) ?? (options.formatX ? options.formatX(d) : String(d)));

    const lineGen = d3
      .line<LinePoint>()
      .x((p) => xScale(p.x))
      .y((p) => yScale(computeY(p)));

    const baselineGen = d3
      .line<LinePoint>()
      .defined((p) => typeof p.baselineValue === 'number')
      .x((p) => xScale(p.x))
      .y((p) => yScale(p.baselineValue ?? 0));

    const labelNodes: {
      seriesId: string;
      label: string;
      color: string;
      naturalY: number;
      resolvedY: number;
      anchorX: number;
      anchorY: number;
    }[] = [];

    for (const s of seriesList) {
      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(s.seriesId)) ||
        (hoveredKey !== null && hoveredKey !== s.seriesId);
      const strokeColor = isDimmed ? UNFOCUSED : s.color;

      // Dashed baseline curve (optional)
      if (s.points.some((p) => typeof p.baselineValue === 'number')) {
        g.append('path')
          .datum(s.points)
          .attr('d', baselineGen)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', 1.4)
          .attr('stroke-dasharray', '4,3')
          .attr('opacity', 0.75);
      }

      // Ink-cased solid gouache line
      g.append('path')
        .datum(s.points)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', INK)
        .attr('stroke-width', isDimmed ? 2 : 4)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

      g.append('path')
        .datum(s.points)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', isDimmed ? 1.2 : 2.3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .style('cursor', 'pointer')
        .on('click', () => {
          if (selectedKeys.has(s.seriesId) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([s.seriesId]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        });

      // Gouache vertex markers
      if (options.showPoints !== false && tier !== 'micro') {
        g.selectAll<SVGCircleElement, LinePoint>(`circle.pt-${s.seriesId.replace(/[^a-zA-Z0-9_-]/g, '')}`)
          .data(s.points)
          .join('circle')
          .attr('class', 'dubois-gouache-mark')
          .attr('cx', (p) => xScale(p.x))
          .attr('cy', (p) => yScale(computeY(p)))
          .attr('r', 3.5)
          .attr('fill', strokeColor)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent, pt: LinePoint) => {
            const cy = computeY(pt);
            const rows: { label: string; value: string }[] = [
              { label: 'X', value: pt.xLabel ?? (options.formatX ? options.formatX(pt.x) : String(pt.x)) },
              { label: 'Value', value: fmt(cy) },
            ];
            if (typeof pt.denominator === 'number') {
              rows.push({ label: 'Count / Base', value: `${defaultFormat(pt.value)} / ${defaultFormat(pt.denominator)}` });
            }
            if (typeof pt.baselineValue === 'number') {
              rows.push({ label: options.baselineLabel ?? 'Baseline', value: fmt(pt.baselineValue) });
            }
            const spec = options.formatTooltip
              ? options.formatTooltip(pt, cy)
              : { title: s.label, swatchColor: s.color, rows };
            showTooltip(ev, spec);
          })
          .on('mouseenter', () => {
            hoveredKey = s.seriesId;
            options.onHover?.(s.seriesId);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          });
      }

      const lastPt = s.points[s.points.length - 1];
      if (lastPt && useDirectLabels) {
        const yPos = yScale(computeY(lastPt));
        labelNodes.push({
          seriesId: s.seriesId,
          label: `${s.label} (${fmt(computeY(lastPt))})`,
          color: strokeColor,
          naturalY: yPos,
          resolvedY: yPos,
          anchorX: xScale(lastPt.x),
          anchorY: yPos,
        });
      }
    }

    // Collision-resolved right-margin direct labels
    if (useDirectLabels && labelNodes.length > 0) {
      labelNodes.sort((a, b) => a.naturalY - b.naturalY);
      const minGap = 14;
      for (let i = 1; i < labelNodes.length; i++) {
        const prev = labelNodes[i - 1]!;
        const curr = labelNodes[i]!;
        if (curr.resolvedY - prev.resolvedY < minGap) {
          curr.resolvedY = prev.resolvedY + minGap;
        }
      }
      for (const node of labelNodes) {
        g.append('line')
          .attr('x1', node.anchorX + 5)
          .attr('x2', innerW + 8)
          .attr('y1', node.anchorY)
          .attr('y2', node.resolvedY)
          .attr('stroke', GUIDELINE)
          .attr('stroke-width', 0.8);
        g.append('text')
          .attr('x', innerW + 12)
          .attr('y', node.resolvedY + 3.5)
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 9.5)
          .attr('font-weight', 700)
          .attr('fill', node.color === UNFOCUSED ? CHARCOAL : INK)
          .text(node.label);
      }
    }

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
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => render());
    ro.observe(svgWrap);
  }
  render();

  return {
    chartId,
    update(nextData: LineChartData, nextOptions?: Partial<LineChartOptions>): void {
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

export const LineChart = {
  id: 'line-chart',
  mount: mountLineChart,
} as const;
