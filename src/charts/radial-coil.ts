import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type RadialCoilChartId = string & { readonly __brand: 'RadialCoilChartId' };
export const asRadialCoilChartId = (id: string): RadialCoilChartId =>
  id as RadialCoilChartId;

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

export interface RadialCoilItem {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly benchmarkValue?: number;
  readonly color?: string;
}

export interface RadialCoilPanel {
  readonly id: string;
  readonly label: string;
  readonly order?: number;
  readonly items: readonly RadialCoilItem[];
}

export interface RadialCoilData {
  readonly panels: readonly RadialCoilPanel[];
}

export interface RadialCoilOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  /** Maximum angular sweep in degrees (default: 480 — iconic Du Bois wrapped spiral). */
  readonly maxSweepDeg?: number;
  readonly useSqrtSweep?: boolean;
  readonly benchmarkLabel?: string;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly palette?: readonly string[];
  readonly colorMap?: Readonly<Record<string, string>>;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (panel: RadialCoilPanel, item: RadialCoilItem) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
}

export interface RadialCoilChartInstance {
  readonly chartId: RadialCoilChartId;
  update(data: RadialCoilData, options?: Partial<RadialCoilOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  getNaturalPanelDomains(): ReadonlyMap<string, ScaleDomain>;
  setPanelDomains(domains: ReadonlyMap<string, ScaleDomain> | null): void;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  destroy(): void;
}

const INK = '#1A1615';
const CHARCOAL = '#52493E';
const UNFOCUSED = '#DED6C6';

const PALETTE_A: readonly string[] = [
  '#DC143C',
  '#FFD700',
  '#2B5B84',
  '#008055',
  '#E87722',
  '#753ABD',
  '#00A7B5',
  '#654321',
  '#D2B48C',
];

const FALLBACK_STYLE_ID = 'dubois-radial-coil-fallback-style';

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
 * Generates a flat-opaque Du Bois spiral ribbon polygon wrapping smoothly inward
 * as angle exceeds 360 degrees (true Archimedean coil ribbon).
 */
function buildCoilRibbonPath(
  outerR: number,
  bandThickness: number,
  endAngleRad: number,
  pitchPerTurn: number
): string {
  const steps = Math.max(12, Math.ceil((endAngleRad / (Math.PI * 2)) * 64));
  const outerPts: [number, number][] = [];
  const innerPts: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * endAngleRad - Math.PI / 2;
    const turns = (t * endAngleRad) / (Math.PI * 2);
    const rOut = Math.max(6, outerR - turns * pitchPerTurn);
    const rIn = Math.max(3, rOut - bandThickness);
    outerPts.push([Math.cos(angle) * rOut, Math.sin(angle) * rOut]);
    innerPts.push([Math.cos(angle) * rIn, Math.sin(angle) * rIn]);
  }

  innerPts.reverse();
  const allPts = [...outerPts, ...innerPts];
  if (allPts.length === 0) return '';
  const first = allPts[0]!;
  return (
    `M${first[0].toFixed(2)},${first[1].toFixed(2)}` +
    allPts
      .slice(1)
      .map((p) => `L${p[0].toFixed(2)},${p[1].toFixed(2)}`)
      .join('') +
    'Z'
  );
}

/**
 * Iconic W.E.B. Du Bois Wrapped Radial Coil / Spiral Bar Chart
 * (single or multi-panel) with per-panel scale sync and optional benchmark notches.
 */
export function mountRadialCoil(
  container: HTMLElement,
  initialData: RadialCoilData,
  initialOptions: RadialCoilOptions = {}
): RadialCoilChartInstance {
  ensureFallbackStyles();

  const chartId = asRadialCoilChartId(
    initialOptions.chartId ?? `radial-coil-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: RadialCoilData = initialData;
  let options: RadialCoilOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let overridePanelDomains: ReadonlyMap<string, ScaleDomain> | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 1 };
  let naturalPanelDomains = new Map<string, ScaleDomain>();

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
    .attr('aria-label', options.ariaLabel ?? 'Du Bois radial coil chart');

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

    const panels = [...data.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const pal = options.palette ?? PALETTE_A;
    const fmt = options.formatValue ?? defaultFormat;
    const maxSweepRad = ((options.maxSweepDeg ?? 480) * Math.PI) / 180;

    let globalMax = 0;
    naturalPanelDomains = new Map();
    const categoryOrder = new Map<string, { label: string; color: string }>();

    panels.forEach((p) => {
      let pMax = 0;
      p.items.forEach((item, idx) => {
        pMax = Math.max(pMax, item.value, item.benchmarkValue ?? 0);
        if (!categoryOrder.has(item.id)) {
          categoryOrder.set(item.id, {
            label: item.label,
            color:
              item.color ??
              options.colorMap?.[item.id] ??
              pal[categoryOrder.size % pal.length] ??
              PALETTE_A[idx % PALETTE_A.length]!,
          });
        }
      });
      naturalPanelDomains.set(p.id, { min: 0, max: pMax > 0 ? pMax : 1 });
      globalMax = Math.max(globalMax, pMax);
    });
    naturalDomain = { min: 0, max: globalMax > 0 ? globalMax : 1 };

    // Legend
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const hasBenchmark = panels.some((p) =>
      p.items.some((it) => typeof it.benchmarkValue === 'number')
    );

    if (options.showLegend !== false && categoryOrder.size > 0) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      for (const [id, meta] of categoryOrder) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dubois-legend-item';
        btn.style.opacity = selectedKeys.size > 0 && !selectedKeys.has(id) ? '0.45' : '1';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor = meta.color;
        const tx = document.createElement('span');
        tx.textContent = meta.label;
        btn.append(sw, tx);
        btn.addEventListener('click', () => {
          if (selectedKeys.has(id) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([id]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        });
        strip.appendChild(btn);
      }

      if (hasBenchmark) {
        const item = document.createElement('span');
        item.className = 'dubois-legend-item';
        item.style.cursor = 'default';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch dubois-legend-swatch--dashed';
        const tx = document.createElement('span');
        tx.textContent = options.benchmarkLabel ?? 'Benchmark';
        item.append(sw, tx);
        strip.appendChild(item);
      }

      legendTarget.appendChild(strip);
    }

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (panels.length === 0) return;

    const cols = panels.length <= 3 ? panels.length : Math.ceil(Math.sqrt(panels.length));
    const rowsCount = Math.ceil(panels.length / cols);
    const cellW = width / cols;
    const cellH = height / rowsCount;

    panels.forEach((panel, pIdx) => {
      const col = pIdx % cols;
      const row = Math.floor(pIdx / cols);
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2 + (panels.length > 1 ? 10 : 0);

      const panelDom =
        overridePanelDomains?.get(panel.id) ??
        overrideDomain ??
        naturalPanelDomains.get(panel.id) ??
        naturalDomain;

      const sweepScale = (options.useSqrtSweep ? d3.scaleSqrt() : d3.scaleLinear())
        .domain([0, Math.max(1e-6, panelDom.max)])
        .range([0.08, maxSweepRad]);

      const maxR = Math.max(26, Math.min(cellW, cellH - 28) * 0.44);
      const count = Math.max(1, panel.items.length);
      const ringGap = Math.max(2, maxR * 0.03);
      const bandThickness = Math.max(5, Math.min(18, (maxR * 0.62) / count - ringGap));
      const pitchPerTurn = (bandThickness + ringGap) * count + 6;

      const pg = svg.append('g').attr('transform', `translate(${cx},${cy})`);

      if (panels.length > 1 || panel.label) {
        pg.append('text')
          .attr('x', 0)
          .attr('y', -maxR - 10)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Inter', sans-serif")
          .attr('font-size', tier === 'micro' ? 9 : 11)
          .attr('font-weight', 800)
          .attr('fill', INK)
          .text(panel.label.toUpperCase());
      }

      // Origin 12 o'clock reference axis
      pg.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', -maxR - 2)
        .attr('y2', -maxR + count * (bandThickness + ringGap) + 2)
        .attr('stroke', INK)
        .attr('stroke-width', 1.2);

      panel.items.forEach((item, idx) => {
        const outerR = maxR - idx * (bandThickness + ringGap);
        if (outerR <= 8) return;

        const isDimmed =
          (selectedKeys.size > 0 && !selectedKeys.has(item.id)) ||
          (hoveredKey !== null && hoveredKey !== item.id);

        const rawColor =
          item.color ?? categoryOrder.get(item.id)?.color ?? pal[idx % pal.length]!;
        const fill = isDimmed ? UNFOCUSED : rawColor;
        const endRad = sweepScale(Math.max(0, item.value));
        const dPath = buildCoilRibbonPath(outerR, bandThickness, endRad, pitchPerTurn);

        pg.append('path')
          .attr('class', 'dubois-gouache-mark')
          .attr('d', dPath)
          .attr('fill', fill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent) => {
            const rows: { label: string; value: string }[] = [
              { label: 'Value', value: fmt(item.value) },
            ];
            if (typeof item.benchmarkValue === 'number') {
              rows.push({
                label: options.benchmarkLabel ?? 'Benchmark',
                value: fmt(item.benchmarkValue),
              });
            }
            const spec = options.formatTooltip
              ? options.formatTooltip(panel, item)
              : {
                  title: `${panel.label} · ${item.label}`,
                  swatchColor: rawColor,
                  rows,
                };
            showTooltip(ev, spec);
          })
          .on('mouseenter', () => {
            hoveredKey = item.id;
            options.onHover?.(item.id);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', () => {
            if (selectedKeys.has(item.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([item.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });

        // Optional benchmark radial notch
        if (typeof item.benchmarkValue === 'number' && item.benchmarkValue > 0) {
          const bRad = sweepScale(item.benchmarkValue);
          const bAngle = bRad - Math.PI / 2;
          const bTurns = bRad / (Math.PI * 2);
          const bOut = Math.max(6, outerR - bTurns * pitchPerTurn);
          const bIn = Math.max(3, bOut - bandThickness);
          pg.append('line')
            .attr('class', 'dubois-benchmark-tick')
            .attr('x1', Math.cos(bAngle) * (bIn - 2))
            .attr('y1', Math.sin(bAngle) * (bIn - 2))
            .attr('x2', Math.cos(bAngle) * (bOut + 2))
            .attr('y2', Math.sin(bAngle) * (bOut + 2))
            .attr('stroke', INK)
            .attr('stroke-width', 1.6)
            .attr('stroke-dasharray', '2,2');
        }

        // Crisp value label next to 12 o'clock origin
        if (tier === 'expanded' && bandThickness >= 8) {
          pg.append('text')
            .attr('x', -6)
            .attr('y', -(outerR - bandThickness / 2) + 3)
            .attr('text-anchor', 'end')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 8.5)
            .attr('font-weight', 700)
            .attr('fill', CHARCOAL)
            .text(fmt(item.value));
        }
      });
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
    update(nextData: RadialCoilData, nextOptions?: Partial<RadialCoilOptions>): void {
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
    getNaturalPanelDomains: () => naturalPanelDomains,
    setPanelDomains(domains: ReadonlyMap<string, ScaleDomain> | null): void {
      overridePanelDomains = domains;
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

export const RadialCoilChart = {
  id: 'radial-coil',
  mount: mountRadialCoil,
} as const;
