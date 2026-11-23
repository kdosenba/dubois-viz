import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type HistogramChartId = string & { readonly __brand: 'HistogramChartId' };
export const asHistogramChartId = (id: string): HistogramChartId =>
  id as HistogramChartId;

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

export interface HistogramBin {
  readonly value: number;
  readonly label?: string;
  readonly count: number;
  readonly benchmarkCount?: number;
  readonly color?: string;
}

export interface HistogramData {
  readonly bins: readonly HistogramBin[];
}

export interface HistogramAnchorConfig {
  readonly value: number;
  readonly preLabel?: string;
  readonly anchorLabel?: string;
  readonly postLabel?: string;
  readonly preColor?: string;
  readonly anchorColor?: string;
  readonly postColor?: string;
}

export interface HistogramOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly xAxisTitle?: string;
  readonly yAxisTitle?: string;
  readonly barColor?: string;
  readonly benchmarkLabel?: string;
  readonly anchor?: HistogramAnchorConfig;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (bin: HistogramBin) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
}

export interface HistogramChartInstance {
  readonly chartId: HistogramChartId;
  update(data: HistogramData, options?: Partial<HistogramOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  destroy(): void;
}

// ============================================================================
// Canonical Du Bois Tokens & Fallback Styles
// ============================================================================
const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const VELLUM = '#EAE2D3';
const UNFOCUSED = '#DED6C6';
const EMERALD = '#008055';
const GOLD = '#FFD700';
const COBALT = '#2B5B84';

const FALLBACK_STYLE_ID = 'dubois-histogram-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:visible}
    .dubois-legend-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 14px;padding:4px 8px;font-family:var(--dubois-font-mono,monospace);font-size:10px;text-transform:uppercase;color:var(--dubois-ink,#1A1615)}
    .dubois-legend-item{display:inline-flex;align-items:center;gap:5px}
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
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
}

/**
 * Du Bois Histogram supporting both standard distributions and optional
 * 3-zone pre / anchor / post diverging highlight around any numeric anchor.
 */
export function mountHistogram(
  container: HTMLElement,
  initialData: HistogramData,
  initialOptions: HistogramOptions = {}
): HistogramChartInstance {
  ensureFallbackStyles();

  const chartId = asHistogramChartId(
    initialOptions.chartId ?? `histogram-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: HistogramData = initialData;
  let options: HistogramOptions = { ...initialOptions };
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
    .attr('aria-label', options.ariaLabel ?? 'Histogram');

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
    const width = Math.max(160, Math.round(rect.width || 640));
    const height = Math.max(120, Math.round(rect.height || 360));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const bins = [...data.bins].sort((a, b) => a.value - b.value);
    const fmt = options.formatValue ?? defaultFormat;
    const anchor = options.anchor;
    const preColor = anchor?.preColor ?? EMERALD;
    const anchorColor = anchor?.anchorColor ?? GOLD;
    const postColor = anchor?.postColor ?? COBALT;
    const baseColor = options.barColor ?? COBALT;

    const maxCount =
      d3.max(bins, (b) => Math.max(b.count, b.benchmarkCount ?? 0)) ?? 1;
    naturalDomain = { min: 0, max: maxCount > 0 ? maxCount * 1.15 : 1 };

    // Legend
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const hasBenchmark = bins.some((b) => typeof b.benchmarkCount === 'number');
    if (options.showLegend !== false && (anchor || hasBenchmark)) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      const addLegend = (color: string, label: string, dashed = false): void => {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = dashed
          ? 'dubois-legend-swatch dubois-legend-swatch--dashed'
          : 'dubois-legend-swatch';
        if (!dashed) sw.style.backgroundColor = color;
        const tx = document.createElement('span');
        tx.textContent = label;
        item.append(sw, tx);
        strip.appendChild(item);
      };

      if (anchor) {
        addLegend(preColor, anchor.preLabel ?? `Below ${anchor.value}`);
        addLegend(anchorColor, anchor.anchorLabel ?? `Anchor (${anchor.value})`);
        addLegend(postColor, anchor.postLabel ?? `Above ${anchor.value}`);
      }
      if (hasBenchmark) {
        addLegend(INK, options.benchmarkLabel ?? 'Benchmark', true);
      }
      legendTarget.appendChild(strip);
    }

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (bins.length === 0) {
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
      top: 16,
      right: 16,
      bottom: options.xAxisTitle && tier !== 'micro' ? 46 : 30,
      left: options.yAxisTitle && tier !== 'micro' ? 56 : 42,
    };

    const innerW = Math.max(50, width - margin.left - margin.right);
    const innerH = Math.max(50, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const keys = bins.map((b) => String(b.value));
    const xBand = d3.scaleBand<string>().domain(keys).range([0, innerW]).padding(0.14);
    const eff = overrideDomain ?? naturalDomain;
    const yScale = d3.scaleLinear().domain([eff.min, eff.max]).nice(4).range([innerH, 0]);

    // Optional pre-anchor aged vellum zone wash
    if (anchor) {
      const preBins = bins.filter((b) => b.value < anchor.value);
      const lastPre = preBins[preBins.length - 1];
      if (lastPre) {
        const lastX = xBand(String(lastPre.value));
        if (lastX !== undefined) {
          g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', lastX + xBand.bandwidth() + xBand.step() * xBand.paddingInner() * 0.5)
            .attr('height', innerH)
            .attr('fill', VELLUM);
        }
      }
    }

    const ticks = yScale.ticks(tier === 'micro' ? 3 : 5);
    g.selectAll('line.grid')
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
      .data(ticks)
      .join('text')
      .attr('class', 'dubois-axis-tick-label')
      .attr('x', -7)
      .attr('y', (d) => yScale(d) + 3.5)
      .attr('text-anchor', 'end')
      .attr('font-family', "'Space Mono', monospace")
      .attr('font-size', tier === 'micro' ? 8.5 : 10)
      .attr('fill', CHARCOAL)
      .text((d) => fmt(d));

    const total = d3.sum(bins, (b) => Math.max(0, b.count));

    bins.forEach((bin) => {
      const key = String(bin.value);
      const bx = xBand(key);
      if (bx === undefined) return;
      const bw = xBand.bandwidth();
      const topY = yScale(Math.max(0, bin.count));
      const barH = Math.max(0, innerH - topY);

      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(key)) ||
        (hoveredKey !== null && hoveredKey !== key);

      const zoneColor = bin.color
        ? bin.color
        : anchor
          ? bin.value < anchor.value
            ? preColor
            : bin.value === anchor.value
              ? anchorColor
              : postColor
          : baseColor;

      g.append('rect')
        .attr('class', 'dubois-gouache-mark')
        .attr('x', bx)
        .attr('y', topY)
        .attr('width', bw)
        .attr('height', barH)
        .attr('fill', isDimmed ? UNFOCUSED : zoneColor)
        .attr('fill-opacity', 1)
        .attr('stroke', INK)
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mousemove', (ev: MouseEvent) => {
          const share = total > 0 ? `${((bin.count / total) * 100).toFixed(1)}%` : '0%';
          const rows: { label: string; value: string }[] = [
            { label: 'Count', value: fmt(bin.count) },
            { label: 'Share', value: share },
          ];
          if (typeof bin.benchmarkCount === 'number') {
            rows.push({ label: options.benchmarkLabel ?? 'Benchmark', value: fmt(bin.benchmarkCount) });
          }
          const spec = options.formatTooltip
            ? options.formatTooltip(bin)
            : {
                title: bin.label ?? String(bin.value),
                swatchColor: zoneColor,
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

      if (typeof bin.benchmarkCount === 'number') {
        const by = yScale(bin.benchmarkCount);
        g.append('line')
          .attr('class', 'dubois-benchmark-cap')
          .attr('x1', bx - 2)
          .attr('x2', bx + bw + 2)
          .attr('y1', by)
          .attr('y2', by)
          .attr('stroke', INK)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,2');
      }

      if (tier === 'expanded' && bins.length <= 20 && bin.count > 0) {
        const highestY = Math.min(
          topY,
          typeof bin.benchmarkCount === 'number' ? yScale(bin.benchmarkCount) : topY
        );
        g.append('text')
          .attr('class', 'dubois-value-label')
          .attr('x', bx + bw / 2)
          .attr('y', Math.max(8, highestY - 6))
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 9.5)
          .attr('font-weight', 700)
          .attr('fill', INK)
          .text(fmt(bin.count));
      }

      g.append('text')
        .attr('class', 'dubois-axis-tick-label')
        .attr('x', bx + bw / 2)
        .attr('y', innerH + 15)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : 9.5)
        .attr('font-weight', anchor && bin.value === anchor.value ? 700 : 400)
        .attr('fill', anchor && bin.value === anchor.value ? INK : CHARCOAL)
        .text(bin.label ?? String(bin.value));
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
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => render());
    ro.observe(svgWrap);
  }
  render();

  return {
    chartId,
    update(nextData: HistogramData, nextOptions?: Partial<HistogramOptions>): void {
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
    destroy(): void {
      ro?.disconnect();
      tooltipEl?.remove();
      tooltipEl = null;
      root.remove();
    },
  };
}

export const HistogramChart = {
  id: 'histogram',
  mount: mountHistogram,
} as const;
