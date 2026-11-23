import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type RatioPyramidsChartId = string & {
  readonly __brand: 'RatioPyramidsChartId';
};
export const asRatioPyramidsChartId = (id: string): RatioPyramidsChartId =>
  id as RatioPyramidsChartId;

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

export interface RatioPyramidTier {
  readonly tierId: string;
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface RatioPyramidPanel {
  readonly id: string;
  readonly label: string;
  readonly order?: number;
  /** Ordered top-to-bottom (2..N tiers). */
  readonly tiers: readonly RatioPyramidTier[];
}

export interface RatioPyramidsData {
  readonly panels: readonly RatioPyramidPanel[];
}

export interface RatioPyramidsOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly showRatios?: boolean;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly palette?: readonly string[];
  readonly neckColors?: readonly string[];
  readonly formatValue?: (value: number) => string;
  readonly formatRatio?: (upper: number, lower: number) => string;
  readonly formatTooltip?: (panel: RatioPyramidPanel, tier: RatioPyramidTier) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
}

export interface RatioPyramidsChartInstance {
  readonly chartId: RatioPyramidsChartId;
  update(data: RatioPyramidsData, options?: Partial<RatioPyramidsOptions>): void;
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
const PARCHMENT = '#F4EFE6';
const UNFOCUSED = '#DED6C6';

const DEFAULT_TIER_COLORS: readonly string[] = [
  '#FFD700',
  '#DC143C',
  '#2B5B84',
  '#008055',
  '#E87722',
  '#753ABD',
];

const DEFAULT_NECK_COLORS: readonly string[] = ['#EAE2D3', '#D2B48C'];

const FALLBACK_STYLE_ID = 'dubois-ratio-pyramids-fallback-style';

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

function defaultRatio(upper: number, lower: number): string {
  if (upper <= 0) return '—';
  const r = lower / upper;
  return r >= 10 ? `1 : ${Math.round(r)}` : `1 : ${r.toFixed(1)}`;
}

/**
 * Proportional N-Tier Ratio Pyramids connected by trapezoidal archival necks
 * displaying exact tier-to-tier ratios (`1 : N`).
 */
export function mountRatioPyramids(
  container: HTMLElement,
  initialData: RatioPyramidsData,
  initialOptions: RatioPyramidsOptions = {}
): RatioPyramidsChartInstance {
  ensureFallbackStyles();

  const chartId = asRatioPyramidsChartId(
    initialOptions.chartId ?? `ratio-pyramids-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: RatioPyramidsData = initialData;
  let options: RatioPyramidsOptions = { ...initialOptions };
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
    .attr('aria-label', options.ariaLabel ?? 'Proportional ratio pyramids');

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
    const height = Math.max(140, Math.round(rect.height || 360));
    const tierSize: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const panels = [...data.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const maxVal =
      d3.max(panels.flatMap((p) => p.tiers.map((t) => Math.max(0, t.value)))) ?? 1;
    naturalDomain = { min: 0, max: maxVal > 0 ? maxVal : 1 };

    const pal = options.palette ?? DEFAULT_TIER_COLORS;
    const necks = options.neckColors ?? DEFAULT_NECK_COLORS;
    const fmt = options.formatValue ?? defaultFormat;
    const fmtRatio = options.formatRatio ?? defaultRatio;

    // Legend built from first panel's tiers
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const sampleTiers = panels[0]?.tiers ?? [];
    if (options.showLegend !== false && sampleTiers.length > 0) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';
      sampleTiers.forEach((t, idx) => {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor = t.color ?? pal[idx % pal.length] ?? DEFAULT_TIER_COLORS[0]!;
        const tx = document.createElement('span');
        tx.textContent = t.label;
        item.append(sw, tx);
        strip.appendChild(item);
      });
      legendTarget.appendChild(strip);
    }

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (panels.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO DATA AVAILABLE');
      return;
    }

    const margin = { top: 30, right: 16, bottom: 16, left: 16 };
    const innerW = Math.max(80, width - margin.left - margin.right);
    const innerH = Math.max(80, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const panelGap = tierSize === 'micro' ? 8 : 22;
    const panelW = Math.max(48, (innerW - panelGap * (panels.length - 1)) / panels.length);
    const maxBarW = panelW * 0.92;
    const eff = overrideDomain ?? naturalDomain;
    const widthScale = d3.scaleSqrt().domain([0, eff.max]).range([18, maxBarW]);

    panels.forEach((panel, pIdx) => {
      const cx = pIdx * (panelW + panelGap) + panelW / 2;
      const tierCount = panel.tiers.length;
      if (tierCount === 0) return;

      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(panel.id)) ||
        (hoveredKey !== null && hoveredKey !== panel.id);

      // Panel title
      g.append('text')
        .attr('x', cx)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Inter', sans-serif")
        .attr('font-size', tierSize === 'micro' ? 9 : 11)
        .attr('font-weight', 800)
        .attr('fill', INK)
        .text(panel.label.toUpperCase());

      const neckCount = Math.max(0, tierCount - 1);
      const totalUnits = tierCount * 1.15 + neckCount * 0.85;
      const tierH = (innerH / totalUnits) * 1.15;
      const neckH = (innerH / totalUnits) * 0.85;

      const geometries = panel.tiers.map((t, idx) => {
        const w = t.value > 0 ? widthScale(t.value) : 14;
        const y = idx * (tierH + neckH);
        const color = t.color ?? pal[idx % pal.length] ?? DEFAULT_TIER_COLORS[0]!;
        return { tier: t, w, y, color };
      });

      // Trapezoidal necks connecting consecutive tiers
      for (let i = 0; i < geometries.length - 1; i++) {
        const upper = geometries[i]!;
        const lower = geometries[i + 1]!;
        const y0 = upper.y + tierH;
        const y1 = lower.y;
        const pts = [
          [cx - upper.w / 2, y0],
          [cx + upper.w / 2, y0],
          [cx + lower.w / 2, y1],
          [cx - lower.w / 2, y1],
        ]
          .map((pt) => pt.join(','))
          .join(' ');

        g.append('polygon')
          .attr('class', 'dubois-gouache-mark')
          .attr('points', pts)
          .attr('fill', isDimmed ? UNFOCUSED : necks[i % necks.length] ?? '#EAE2D3')
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1);

        if (options.showRatios !== false && neckH >= 14) {
          g.append('text')
            .attr('x', cx)
            .attr('y', (y0 + y1) / 2 + 3.5)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', tierSize === 'micro' ? 8 : 9.5)
            .attr('font-weight', 700)
            .attr('fill', INK)
            .text(fmtRatio(upper.tier.value, lower.tier.value));
        }
      }

      // Proportional tier rectangles
      for (const geom of geometries) {
        const fill = isDimmed ? UNFOCUSED : geom.color;
        const isLight = fill === '#FFD700' || fill === '#D2B48C' || fill === UNFOCUSED;

        g.append('rect')
          .attr('class', 'dubois-gouache-mark')
          .attr('x', cx - geom.w / 2)
          .attr('y', geom.y)
          .attr('width', geom.w)
          .attr('height', tierH)
          .attr('fill', fill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1.1)
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent) => {
            const spec = options.formatTooltip
              ? options.formatTooltip(panel, geom.tier)
              : {
                  title: `${panel.label} · ${geom.tier.label}`,
                  swatchColor: geom.color,
                  rows: [{ label: 'Count', value: fmt(geom.tier.value) }],
                };
            showTooltip(ev, spec);
          })
          .on('mouseenter', () => {
            hoveredKey = panel.id;
            options.onHover?.(panel.id);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', () => {
            if (selectedKeys.has(panel.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([panel.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });

        if (tierH >= 16) {
          g.append('text')
            .attr('x', cx)
            .attr('y', geom.y + tierH / 2 + 3.5)
            .attr('text-anchor', 'middle')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', tierSize === 'micro' ? 8.5 : 10)
            .attr('font-weight', 700)
            .attr('fill', isLight ? INK : PARCHMENT)
            .style('pointer-events', 'none')
            .text(fmt(geom.tier.value));
        }
      }
    });
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => render());
    ro.observe(svgWrap);
  }
  render();

  return {
    chartId,
    update(nextData: RatioPyramidsData, nextOptions?: Partial<RatioPyramidsOptions>): void {
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

export const RatioPyramidsChart = {
  id: 'ratio-pyramids',
  mount: mountRatioPyramids,
} as const;
