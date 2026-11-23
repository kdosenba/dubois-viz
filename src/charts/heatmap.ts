import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type HeatmapChartId = string & { readonly __brand: 'HeatmapChartId' };
export const asHeatmapChartId = (id: string): HeatmapChartId =>
  id as HeatmapChartId;

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

export interface HeatmapCell {
  readonly rowId: string;
  readonly rowLabel?: string;
  readonly rowOrder?: number;
  readonly colId: string;
  readonly colLabel?: string;
  readonly colOrder?: number;
  readonly value: number;
  readonly color?: string;
}

export interface HeatmapData {
  readonly cells: readonly HeatmapCell[];
}

export interface HeatmapOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly markShape?: 'disc' | 'square' | 'rect';
  readonly colorMode?: 'single' | 'sequential';
  readonly fillColor?: string;
  readonly rowAxisTitle?: string;
  readonly colAxisTitle?: string;
  readonly valueLabel?: string;
  readonly showValues?: boolean;
  readonly showTooltip?: boolean;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (cell: HeatmapCell) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
}

export interface HeatmapChartInstance {
  readonly chartId: HeatmapChartId;
  update(data: HeatmapData, options?: Partial<HeatmapOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  destroy(): void;
}

const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const UNFOCUSED = '#DED6C6';
const CRIMSON = '#DC143C';

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

const FALLBACK_STYLE_ID = 'dubois-heatmap-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:visible}
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
 * Du Bois Matrix Heatmap supporting proportional gouache discs or crisp tiles
 * with India-ink outlines on an archival guideline grid.
 */
export function mountHeatmap(
  container: HTMLElement,
  initialData: HeatmapData,
  initialOptions: HeatmapOptions = {}
): HeatmapChartInstance {
  ensureFallbackStyles();

  const chartId = asHeatmapChartId(
    initialOptions.chartId ?? `heatmap-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: HeatmapData = initialData;
  let options: HeatmapOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 1 };

  const root = document.createElement('div');
  root.className = 'dubois-chart-root';
  root.dataset['chartId'] = chartId;
  const svgWrap = document.createElement('div');
  svgWrap.className = 'dubois-chart-svg-wrap';
  root.appendChild(svgWrap);
  container.innerHTML = '';
  container.appendChild(root);

  const svg = d3
    .select(svgWrap)
    .append('svg')
    .attr('class', 'dubois-chart-svg')
    .attr('role', 'img')
    .attr('aria-label', options.ariaLabel ?? 'Matrix heatmap');

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
    const width = Math.max(160, Math.round(rect.width || 620));
    const height = Math.max(140, Math.round(rect.height || 380));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const cells = data.cells;
    const maxVal = d3.max(cells, (c) => Math.max(0, c.value)) ?? 1;
    naturalDomain = { min: 0, max: maxVal > 0 ? maxVal : 1 };

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (cells.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const rowMeta = new Map<string, { label: string; order: number }>();
    const colMeta = new Map<string, { label: string; order: number }>();
    cells.forEach((c, idx) => {
      if (!rowMeta.has(c.rowId)) {
        rowMeta.set(c.rowId, { label: c.rowLabel ?? c.rowId, order: c.rowOrder ?? idx });
      }
      if (!colMeta.has(c.colId)) {
        colMeta.set(c.colId, { label: c.colLabel ?? c.colId, order: c.colOrder ?? idx });
      }
    });

    const rows = Array.from(rowMeta.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, m]) => ({ id, label: m.label }));
    const cols = Array.from(colMeta.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, m]) => ({ id, label: m.label }));

    const margin = {
      top: options.colAxisTitle && tier !== 'micro' ? 44 : 28,
      right: 16,
      bottom: 16,
      left: tier === 'micro' ? 58 : options.rowAxisTitle ? 112 : 92,
    };

    const innerW = Math.max(60, width - margin.left - margin.right);
    const innerH = Math.max(60, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xBand = d3.scaleBand<string>().domain(cols.map((c) => c.id)).range([0, innerW]).padding(0.08);
    const yBand = d3.scaleBand<string>().domain(rows.map((r) => r.id)).range([0, innerH]).padding(0.08);

    const eff = overrideDomain ?? naturalDomain;
    const maxRadius = Math.max(3, Math.min(xBand.bandwidth(), yBand.bandwidth()) * 0.44);
    const rScale = d3.scaleSqrt().domain([0, eff.max]).range([0, maxRadius]);
    const fmt = options.formatValue ?? defaultFormat;
    const shape = options.markShape ?? 'disc';
    const baseFill = options.fillColor ?? CRIMSON;

    const seqScale = d3.scaleQuantize<string>().domain([0, eff.max]).range([...PALETTE_B]);

    // Dashed gridlines
    for (const r of rows) {
      const cy = (yBand(r.id) ?? 0) + yBand.bandwidth() / 2;
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', cy)
        .attr('y2', cy)
        .attr('stroke', GUIDELINE)
        .attr('stroke-opacity', 0.28)
        .attr('stroke-dasharray', '3,3');
      g.append('text')
        .attr('x', -8)
        .attr('y', cy + 3.5)
        .attr('text-anchor', 'end')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : 10)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text(r.label);
    }

    for (const c of cols) {
      const cx = (xBand(c.id) ?? 0) + xBand.bandwidth() / 2;
      g.append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', GUIDELINE)
        .attr('stroke-opacity', 0.28)
        .attr('stroke-dasharray', '3,3');
      g.append('text')
        .attr('x', cx)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 8.5 : 10)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text(c.label);
    }

    if (options.colAxisTitle && tier !== 'micro') {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', -28)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('fill', CHARCOAL)
        .text(options.colAxisTitle.toUpperCase());
    }
    if (options.rowAxisTitle && tier !== 'micro') {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -margin.left + 14)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .attr('fill', CHARCOAL)
        .text(options.rowAxisTitle.toUpperCase());
    }

    for (const cell of cells) {
      if (cell.value <= 0) continue;
      const x = xBand(cell.colId);
      const y = yBand(cell.rowId);
      if (x === undefined || y === undefined) continue;
      const cx = x + xBand.bandwidth() / 2;
      const cy = y + yBand.bandwidth() / 2;
      const cellKey = `${cell.rowId}::${cell.colId}`;

      const isDimmed =
        (selectedKeys.size > 0 &&
          !selectedKeys.has(cellKey) &&
          !selectedKeys.has(cell.rowId) &&
          !selectedKeys.has(cell.colId)) ||
        (hoveredKey !== null &&
          hoveredKey !== cellKey &&
          hoveredKey !== cell.rowId &&
          hoveredKey !== cell.colId);

      const rawColor =
        cell.color ?? (options.colorMode === 'sequential' ? seqScale(cell.value) : baseFill);
      const fill = isDimmed ? UNFOCUSED : rawColor;

      const onMove = (ev: MouseEvent): void => {
        const spec = options.formatTooltip
          ? options.formatTooltip(cell)
          : {
              title: `${rowMeta.get(cell.rowId)?.label ?? cell.rowId} × ${colMeta.get(cell.colId)?.label ?? cell.colId}`,
              swatchColor: rawColor,
              rows: [{ label: options.valueLabel ?? 'Value', value: fmt(cell.value) }],
            };
        showTooltip(ev, spec);
      };

      const onClick = (): void => {
        if (selectedKeys.has(cellKey) && selectedKeys.size === 1) selectedKeys.clear();
        else selectedKeys = new Set([cellKey]);
        options.onSelect?.(Array.from(selectedKeys));
        render();
      };

      if (shape === 'disc') {
        const r = rScale(cell.value);
        g.append('circle')
          .attr('class', 'dubois-gouache-mark')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', fill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1.1)
          .style('cursor', 'pointer')
          .on('mousemove', onMove)
          .on('mouseenter', () => {
            hoveredKey = cellKey;
            options.onHover?.(cellKey);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', onClick);
      } else {
        const size = shape === 'square' ? rScale(cell.value) * 1.9 : 0;
        const w = shape === 'square' ? size : xBand.bandwidth();
        const h = shape === 'square' ? size : yBand.bandwidth();
        g.append('rect')
          .attr('class', 'dubois-gouache-mark')
          .attr('x', cx - w / 2)
          .attr('y', cy - h / 2)
          .attr('width', w)
          .attr('height', h)
          .attr('fill', fill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', onMove)
          .on('mouseenter', () => {
            hoveredKey = cellKey;
            options.onHover?.(cellKey);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', onClick);
      }

      if (options.showValues !== false && tier === 'expanded' && maxRadius >= 14) {
        g.append('text')
          .attr('x', cx)
          .attr('y', cy + 3.5)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 9)
          .attr('font-weight', 700)
          .attr('fill', fill === '#FFD700' || fill === '#FAE053' || fill === '#DBE442' || fill === UNFOCUSED ? INK : '#F4EFE6')
          .style('pointer-events', 'none')
          .text(fmt(cell.value));
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
    update(nextData: HeatmapData, nextOptions?: Partial<HeatmapOptions>): void {
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

export const HeatmapChart = {
  id: 'heatmap',
  mount: mountHeatmap,
} as const;
