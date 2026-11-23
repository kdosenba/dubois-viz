import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type RadialDynamoChartId = string & {
  readonly __brand: 'RadialDynamoChartId';
};
export const asRadialDynamoChartId = (id: string): RadialDynamoChartId =>
  id as RadialDynamoChartId;

export type ResponsiveSizeTier = 'expanded' | 'compact' | 'micro';

export interface ScaleDomain {
  readonly min: number;
  readonly max: number;
}

export interface ZoomState {
  readonly scale: number;
}

export interface TooltipSpec {
  readonly title: string;
  readonly swatchColor?: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}

export interface DynamoCoreSpec {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly baselineValue?: number;
  readonly horizonValue?: number;
  readonly horizonLabel?: string;
  readonly subtitle?: string;
  readonly color?: string;
}

export interface DynamoRingSegment {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface DynamoPetalLayer {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface DynamoEventBadge {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly color?: string;
}

export interface DynamoPetal {
  readonly id: string;
  readonly label: string;
  readonly startAngleDeg?: number;
  readonly endAngleDeg?: number;
  readonly layers: readonly DynamoPetalLayer[];
  readonly badges?: readonly DynamoEventBadge[];
}

export interface DynamoRadialTick {
  readonly angleDeg: number;
  readonly label: string;
}

export interface DynamoSatellite {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly value: number;
  readonly anchorAngleDeg?: number;
  readonly color?: string;
  readonly ringTier?: number;
  readonly flowValue?: number;
  readonly flowLabel?: string;
  readonly petals?: readonly { readonly layers: readonly DynamoPetalLayer[] }[];
}

export interface RadialDynamoData {
  readonly core: DynamoCoreSpec;
  readonly innerRing?: readonly DynamoRingSegment[];
  readonly petals: readonly DynamoPetal[];
  readonly radialTicks?: readonly DynamoRadialTick[];
  readonly satellites?: readonly DynamoSatellite[];
}

export interface RadialDynamoOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly showHorizonRing?: boolean;
  readonly showLabels?: boolean;
  readonly enableZoom?: boolean;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly palette?: readonly string[];
  readonly formatValue?: (value: number) => string;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onZoomChange?: (state: ZoomState) => void;
}

export interface RadialDynamoChartInstance {
  readonly chartId: RadialDynamoChartId;
  update(data: RadialDynamoData, options?: Partial<RadialDynamoOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  getZoomState(): ZoomState;
  setZoomState(state: ZoomState | null): void;
  resetZoom(): void;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  destroy(): void;
}

const INK = '#1A1615';
const CHARCOAL = '#52493E';
const GUIDELINE = '#8C7A6B';
const PARCHMENT = '#F4EFE6';
const VELLUM = '#EAE2D3';
const WARM_TAN = '#D2B48C';
const UNFOCUSED = '#DED6C6';
const COBALT = '#2B5B84';
const EMERALD = '#008055';
const CRIMSON = '#DC143C';

const PALETTE_A: readonly string[] = [
  '#2B5B84',
  '#00A7B5',
  '#008055',
  '#DC143C',
  '#FFD700',
  '#E87722',
  '#753ABD',
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

const FALLBACK_STYLE_ID = 'dubois-radial-dynamo-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:hidden}
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

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Computes the linear radial span (in data units) so that core, inner ring,
 * petals, and satellites share ONE Single-Variable Linear Radial Scale—making
 * side-by-side comparison across Focus / Compare / Atlas grids geometrically honest.
 */
function computeLinearSpan(data: RadialDynamoData): number {
  const coreSpan = Math.max(0, data.core.value);
  const ringSpan = data.innerRing
    ? d3.sum(data.innerRing, (s) => Math.max(0, s.value)) * 0.28
    : 0;
  const maxPetal =
    d3.max(data.petals, (p) => d3.sum(p.layers, (l) => Math.max(0, l.value))) ?? 0;
  const maxSat = data.satellites
    ? d3.max(
        data.satellites,
        (s) =>
          Math.max(0, s.value) +
          (s.petals
            ? d3.max(s.petals, (p) => d3.sum(p.layers, (l) => Math.max(0, l.value))) ?? 0
            : 0)
      ) ?? 0
    : 0;

  const base = coreSpan + ringSpan + maxPetal;
  const withSat = data.satellites && data.satellites.length > 0 ? base + maxSat * 1.45 + coreSpan * 0.4 : base;
  return Math.max(1, withSat * 1.12);
}

/**
 * Domain-agnostic Du Bois Radial Dynamo & Satellite Petal Chart.
 * Every visual layer (horizon ring, segmented inner ring, stacked polar petals,
 * event badges, radial axis ticks, orbiting satellites & flow arcs) is optional
 * and shares a strict Single-Variable Linear Radial Scale.
 */
export function mountRadialDynamo(
  container: HTMLElement,
  initialData: RadialDynamoData,
  initialOptions: RadialDynamoOptions = {}
): RadialDynamoChartInstance {
  ensureFallbackStyles();

  const chartId = asRadialDynamoChartId(
    initialOptions.chartId ?? `radial-dynamo-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: RadialDynamoData = initialData;
  let options: RadialDynamoOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: computeLinearSpan(data) };
  let currentZoomScale = 1;

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
    .attr('aria-label', options.ariaLabel ?? 'Radial dynamo chart');

  let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
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
    const width = Math.max(180, Math.round(rect.width || 620));
    const height = Math.max(180, Math.round(rect.height || 440));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    naturalDomain = { min: 0, max: computeLinearSpan(data) };
    const effectiveMax = (overrideDomain ?? naturalDomain).max;

    const pal = options.palette ?? PALETTE_A;
    const fmt = options.formatValue ?? defaultFormat;
    const showLabels = options.showLabels ?? tier !== 'micro';

    // Build layer color catalog from petals
    const layerMeta = new Map<string, { label: string; color: string }>();
    for (const p of data.petals) {
      p.layers.forEach((l, idx) => {
        if (!layerMeta.has(l.id)) {
          layerMeta.set(l.id, {
            label: l.label,
            color: l.color ?? pal[layerMeta.size % pal.length] ?? PALETTE_A[idx % PALETTE_A.length]!,
          });
        }
      });
    }

    // Legend
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';
    if (options.showLegend !== false && layerMeta.size > 0) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';
      for (const meta of layerMeta.values()) {
        const el = document.createElement('span');
        el.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = 'dubois-legend-swatch';
        sw.style.backgroundColor = meta.color;
        const tx = document.createElement('span');
        tx.textContent = meta.label;
        el.append(sw, tx);
        strip.appendChild(el);
      }
      legendTarget.appendChild(strip);
    }

    const postRect = svgWrap.getBoundingClientRect();
    const finalW = Math.max(180, Math.round(postRect.width || width));
    const finalH = Math.max(160, Math.round(postRect.height || height));
    const maxPxR = Math.max(44, Math.min(finalW, finalH) * 0.37);
    const pxPerUnit = maxPxR / Math.max(1e-6, effectiveMax);
    const rOf = (val: number): number => Math.max(0, val) * pxPerUnit;

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${finalW} ${finalH}`);

    const zoomRoot = svg.append('g').attr('class', 'dubois-dynamo-zoom');
    const scene = zoomRoot
      .append('g')
      .attr('transform', `translate(${finalW / 2},${finalH / 2})`);

    const coreR = Math.max(tier === 'micro' ? 10 : 18, rOf(data.core.value));
    const innerRingThick =
      data.innerRing && data.innerRing.length > 0
        ? Math.max(6, Math.min(18, rOf(d3.sum(data.innerRing, (s) => s.value) * 0.25)))
        : 0;
    const petalBaseR = coreR + innerRingThick;

    // 0. Optional Horizon / Ceiling Ring (auto-placed in the widest open angular gap)
    if (options.showHorizonRing !== false && typeof data.core.horizonValue === 'number' && data.core.horizonValue > 0) {
      const hR = Math.min(maxPxR * 0.94, Math.max(petalBaseR + 12, rOf(data.core.horizonValue)));
      scene
        .append('circle')
        .attr('r', hR)
        .attr('fill', 'none')
        .attr('stroke', GUIDELINE)
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '6,4');
      if (showLabels && data.core.horizonLabel && tier === 'expanded') {
        const occupied = [
          ...(data.radialTicks?.map((t) => ((t.angleDeg % 360) + 360) % 360) ?? []),
          ...(data.satellites?.map((s, idx) => (((s.anchorAngleDeg ?? (idx / Math.max(1, data.satellites!.length)) * 360 + 20) % 360) + 360) % 360) ?? []),
        ].sort((a, b) => a - b);
        let bestMidDeg = 315;
        if (occupied.length >= 2) {
          let maxGap = -1;
          for (let i = 0; i < occupied.length; i++) {
            const a = occupied[i]!;
            const b = i + 1 < occupied.length ? occupied[i + 1]! : occupied[0]! + 360;
            const gap = b - a;
            if (gap > maxGap) {
              maxGap = gap;
              bestMidDeg = (a + gap / 2) % 360;
            }
          }
        }
        const labelRad = degToRad(bestMidDeg) - Math.PI / 2;
        const cosA = Math.cos(labelRad);
        const sinA = Math.sin(labelRad);
        scene
          .append('text')
          .attr('x', cosA * (hR + 6))
          .attr('y', sinA * (hR + 6) + 3)
          .attr('text-anchor', cosA > 0.2 ? 'start' : cosA < -0.2 ? 'end' : 'middle')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 8)
          .attr('fill', CHARCOAL)
          .text(`${data.core.horizonLabel.toUpperCase()}: ${fmt(data.core.horizonValue)}`);
      }
    }

    // 1. Optional Radial Axis Ticks
    if (data.radialTicks && data.radialTicks.length > 0) {
      const tickOuterR = maxPxR * 0.88;
      for (const tick of data.radialTicks) {
        const rad = degToRad(tick.angleDeg) - Math.PI / 2;
        scene
          .append('line')
          .attr('x1', Math.cos(rad) * petalBaseR)
          .attr('y1', Math.sin(rad) * petalBaseR)
          .attr('x2', Math.cos(rad) * tickOuterR)
          .attr('y2', Math.sin(rad) * tickOuterR)
          .attr('stroke', GUIDELINE)
          .attr('stroke-opacity', 0.45)
          .attr('stroke-dasharray', '3,3');

        if (showLabels) {
          const lx = Math.cos(rad) * (tickOuterR + 10);
          const ly = Math.sin(rad) * (tickOuterR + 10);
          scene
            .append('text')
            .attr('x', lx)
            .attr('y', ly + 3)
            .attr('text-anchor', Math.cos(rad) > 0.2 ? 'start' : Math.cos(rad) < -0.2 ? 'end' : 'middle')
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 8.5)
            .attr('font-weight', 700)
            .attr('fill', CHARCOAL)
            .text(tick.label);
        }
      }
    }

    // 2. Stacked Polar Petals (d3.arc)
    const petalCount = Math.max(1, data.petals.length);
    const stepDeg = 360 / petalCount;
    let maxPetalTipR = petalBaseR;

    data.petals.forEach((petal, pIdx) => {
      const a0 = degToRad(petal.startAngleDeg ?? pIdx * stepDeg);
      const a1 = degToRad(petal.endAngleDeg ?? (pIdx + 1) * stepDeg);
      const padRad = Math.min(0.03, (a1 - a0) * 0.08);
      let runningR = petalBaseR;

      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(petal.id)) ||
        (hoveredKey !== null && hoveredKey !== petal.id);

      const totalVal = d3.sum(petal.layers, (l) => Math.max(0, l.value));

      petal.layers.forEach((layer, lIdx) => {
        if (layer.value <= 0) return;
        const r0 = runningR;
        const r1 = r0 + rOf(layer.value);
        runningR = r1;
        maxPetalTipR = Math.max(maxPetalTipR, r1);

        const rawColor =
          layer.color ?? layerMeta.get(layer.id)?.color ?? pal[lIdx % pal.length]!;
        const arc = d3
          .arc<unknown>()
          .innerRadius(r0)
          .outerRadius(r1)
          .startAngle(a0 + padRad)
          .endAngle(a1 - padRad);

        scene
          .append('path')
          .attr('class', 'dubois-gouache-mark')
          .attr('d', arc({}) ?? '')
          .attr('fill', isDimmed ? UNFOCUSED : rawColor)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent) => {
            showTooltip(ev, {
              title: `${petal.label} · ${layer.label}`,
              swatchColor: rawColor,
              rows: [
                { label: layer.label, value: fmt(layer.value) },
                { label: 'Petal Total', value: fmt(totalVal) },
              ],
            });
          })
          .on('mouseenter', () => {
            hoveredKey = petal.id;
            options.onHover?.(petal.id);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', () => {
            if (selectedKeys.has(petal.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([petal.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });
      });

      // Optional event badges perched at outer petal tip
      if (petal.badges && petal.badges.length > 0 && tier !== 'micro') {
        const midAngle = (a0 + a1) / 2 - Math.PI / 2;
        petal.badges.forEach((badge, bIdx) => {
          if (badge.count <= 0) return;
          const br = runningR + 8 + bIdx * 10;
          const bx = Math.cos(midAngle) * br;
          const by = Math.sin(midAngle) * br;
          const bCol = badge.color ?? CRIMSON;
          scene
            .append('circle')
            .attr('class', 'dubois-gouache-mark')
            .attr('cx', bx)
            .attr('cy', by)
            .attr('r', 4)
            .attr('fill', bCol)
            .attr('stroke', INK)
            .attr('stroke-width', 1)
            .on('mousemove', (ev: MouseEvent) => {
              showTooltip(ev, {
                title: `${petal.label} · ${badge.label}`,
                swatchColor: bCol,
                rows: [{ label: 'Count', value: fmt(badge.count) }],
              });
            })
            .on('mouseleave', hideTooltip);
        });
      }
    });

    // 3. Optional Segmented Inner Composition Ring (Palette B)
    if (data.innerRing && data.innerRing.length > 0 && innerRingThick > 0) {
      const pie = d3
        .pie<DynamoRingSegment>()
        .value((d) => Math.max(0, d.value))
        .sort(null);
      const ringArc = d3
        .arc<d3.PieArcDatum<DynamoRingSegment>>()
        .innerRadius(coreR)
        .outerRadius(coreR + innerRingThick);

      const arcs = pie([...data.innerRing]);
      arcs.forEach((arcDatum, idx) => {
        const seg = arcDatum.data;
        const fill =
          seg.color ??
          PALETTE_B[
            Math.min(
              PALETTE_B.length - 1,
              Math.round((idx / Math.max(1, arcs.length - 1)) * (PALETTE_B.length - 1))
            )
          ]!;
        scene
          .append('path')
          .attr('class', 'dubois-gouache-mark')
          .attr('d', ringArc(arcDatum) ?? '')
          .attr('fill', fill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 0.9)
          .on('mousemove', (ev: MouseEvent) => {
            showTooltip(ev, {
              title: seg.label,
              swatchColor: fill,
              rows: [{ label: 'Value', value: fmt(seg.value) }],
            });
          })
          .on('mouseleave', hideTooltip);
      });
    }

    // 4. Core Circle (with optional baseline delta)
    const coreFill = data.core.color ?? WARM_TAN;
    scene
      .append('circle')
      .attr('class', 'dubois-gouache-mark')
      .attr('r', coreR)
      .attr('fill', coreFill)
      .attr('fill-opacity', 1)
      .attr('stroke', INK)
      .attr('stroke-width', 1.4)
      .style('cursor', 'pointer')
      .on('mousemove', (ev: MouseEvent) => {
        const rows: { label: string; value: string }[] = [
          { label: 'Core Value', value: fmt(data.core.value) },
        ];
        if (typeof data.core.baselineValue === 'number') {
          const delta = data.core.value - data.core.baselineValue;
          rows.push({
            label: 'Change vs Baseline',
            value: `${delta >= 0 ? '+' : ''}${fmt(delta)}`,
          });
        }
        showTooltip(ev, {
          title: data.core.label,
          swatchColor: coreFill,
          rows,
        });
      })
      .on('mouseleave', hideTooltip);

    if (coreR >= 16) {
      scene
        .append('text')
        .attr('x', 0)
        .attr('y', typeof data.core.baselineValue === 'number' ? -2 : 4)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', tier === 'micro' ? 9 : 11)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .style('pointer-events', 'none')
        .text(fmt(data.core.value));

      if (typeof data.core.baselineValue === 'number' && coreR >= 22) {
        const delta = data.core.value - data.core.baselineValue;
        scene
          .append('text')
          .attr('x', 0)
          .attr('y', 11)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 8.5)
          .attr('font-weight', 700)
          .attr('fill', delta >= 0 ? EMERALD : CRIMSON)
          .style('pointer-events', 'none')
          .text(`${delta >= 0 ? '+' : ''}${fmt(delta)}`);
      }
    }

    // 5. Optional Orbiting Satellites & Flow Connectors
    if (data.satellites && data.satellites.length > 0) {
      const satCount = data.satellites.length;
      const baseOrbitR = Math.max(maxPetalTipR + 28, coreR * 2.1);

      data.satellites.forEach((sat, sIdx) => {
        const angleDeg = sat.anchorAngleDeg ?? (sIdx / satCount) * 360 + 20;
        const rad = degToRad(angleDeg) - Math.PI / 2;
        const orbitR = baseOrbitR + (sat.ringTier ?? 0) * 32;
        const sx = Math.cos(rad) * orbitR;
        const sy = Math.sin(rad) * orbitR;
        const satR = Math.max(6, Math.min(22, rOf(sat.value)));
        const satColor = sat.color ?? (sat.ringTier ? '#753ABD' : EMERALD);
        const isDimmed =
          (selectedKeys.size > 0 && !selectedKeys.has(sat.id)) ||
          (hoveredKey !== null && hoveredKey !== sat.id);

        // Flow connector line from core/petal edge to satellite
        scene
          .append('line')
          .attr('x1', Math.cos(rad) * petalBaseR)
          .attr('y1', Math.sin(rad) * petalBaseR)
          .attr('x2', sx)
          .attr('y2', sy)
          .attr('stroke', isDimmed ? UNFOCUSED : satColor)
          .attr('stroke-width', typeof sat.flowValue === 'number' ? Math.max(1.2, Math.min(4, Math.sqrt(sat.flowValue))) : 1)
          .attr('stroke-dasharray', typeof sat.flowValue === 'number' ? null : '3,2');

        const satG = scene
          .append('g')
          .attr('transform', `translate(${sx},${sy})`)
          .style('cursor', 'pointer');

        // Optional mini-petals around satellite
        if (sat.petals && sat.petals.length > 0) {
          const spStep = (Math.PI * 2) / sat.petals.length;
          sat.petals.forEach((sp, spIdx) => {
            let sr = satR;
            sp.layers.forEach((sl) => {
              if (sl.value <= 0) return;
              const nextR = sr + rOf(sl.value);
              const miniArc = d3
                .arc<unknown>()
                .innerRadius(sr)
                .outerRadius(nextR)
                .startAngle(spIdx * spStep)
                .endAngle((spIdx + 1) * spStep - 0.04);
              satG
                .append('path')
                .attr('class', 'dubois-gouache-mark')
                .attr('d', miniArc({}) ?? '')
                .attr('fill', isDimmed ? UNFOCUSED : sl.color ?? satColor)
                .attr('stroke', INK)
                .attr('stroke-width', 0.8);
              sr = nextR;
            });
          });
        }

        satG
          .append('circle')
          .attr('class', 'dubois-gouache-mark')
          .attr('r', satR)
          .attr('fill', isDimmed ? UNFOCUSED : satColor)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 1.1)
          .on('mousemove', (ev: MouseEvent) => {
            const rows: { label: string; value: string }[] = [
              { label: 'Value', value: fmt(sat.value) },
            ];
            if (sat.group) rows.push({ label: 'Group', value: sat.group });
            if (typeof sat.flowValue === 'number') {
              rows.push({
                label: sat.flowLabel ?? 'Flow',
                value: fmt(sat.flowValue),
              });
            }
            showTooltip(ev, { title: sat.label, swatchColor: satColor, rows });
          })
          .on('mouseenter', () => {
            hoveredKey = sat.id;
            options.onHover?.(sat.id);
          })
          .on('mouseleave', () => {
            hoveredKey = null;
            options.onHover?.(null);
            hideTooltip();
          })
          .on('click', () => {
            if (selectedKeys.has(sat.id) && selectedKeys.size === 1) selectedKeys.clear();
            else selectedKeys = new Set([sat.id]);
            options.onSelect?.(Array.from(selectedKeys));
            render();
          });

        if (showLabels) {
          const rawLx = Math.cos(rad) * (satR + 9);
          const rawLy = Math.sin(rad) * (satR + 9) + 3;
          let anchor: 'start' | 'end' | 'middle' =
            Math.cos(rad) > 0.25 ? 'start' : Math.cos(rad) < -0.25 ? 'end' : 'middle';
          const absX = sx + rawLx;
          const halfW = finalW / 2 - 8;
          const estW = sat.label.length * 5.2;
          if (anchor === 'end' && absX - estW < -halfW) anchor = 'start';
          if (anchor === 'start' && absX + estW > halfW) anchor = 'end';
          const lx = anchor === 'start' && rawLx < 0 ? 0 : anchor === 'end' && rawLx > 0 ? 0 : rawLx;
          const ly = lx === 0 ? satR + 11 : rawLy;
          satG
            .append('text')
            .attr('x', lx)
            .attr('y', ly)
            .attr('text-anchor', lx === 0 ? 'middle' : anchor)
            .attr('font-family', "'Space Mono', monospace")
            .attr('font-size', 8.5)
            .attr('font-weight', 700)
            .attr('fill', INK)
            .text(sat.label);
        }
      });
    }

    // 6. Optional 2D Zoom & Pan
    if (options.enableZoom !== false) {
      zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 5])
        .on('zoom', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          zoomRoot.attr('transform', ev.transform.toString());
          currentZoomScale = ev.transform.k;
          options.onZoomChange?.({ scale: currentZoomScale });
        });
      svg.call(zoomBehavior);
      if (currentZoomScale !== 1) {
        svg.call(zoomBehavior.scaleTo, currentZoomScale);
      }
    }

    // Keep subtle unused constants referenced cleanly if tree-shaken
    void PARCHMENT;
    void VELLUM;
    void COBALT;
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => render());
    ro.observe(svgWrap);
  }
  render();

  return {
    chartId,
    update(nextData: RadialDynamoData, nextOptions?: Partial<RadialDynamoOptions>): void {
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
    getZoomState: () => ({ scale: currentZoomScale }),
    setZoomState(state: ZoomState | null): void {
      currentZoomScale = state ? Math.max(0.6, Math.min(5, state.scale)) : 1;
      if (zoomBehavior) svg.call(zoomBehavior.scaleTo, currentZoomScale);
    },
    resetZoom(): void {
      currentZoomScale = 1;
      if (zoomBehavior) svg.call(zoomBehavior.transform, d3.zoomIdentity);
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

export const RadialDynamoChart = {
  id: 'radial-dynamo',
  mount: mountRadialDynamo,
} as const;
