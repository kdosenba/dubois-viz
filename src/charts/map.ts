import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type MapChartId = string & { readonly __brand: 'MapChartId' };
export const asMapChartId = (id: string): MapChartId => id as MapChartId;

export type ResponsiveSizeTier = 'expanded' | 'compact' | 'micro';
export type MapProjectionKind =
  | 'naturalEarth1'
  | 'mercator'
  | 'equalEarth'
  | 'albers'
  | 'identity';

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

export interface MapPolygon {
  readonly id: string;
  readonly label?: string;
  /** Array of closed linear rings of [longitude, latitude] coordinate pairs. */
  readonly rings: readonly (readonly (readonly [number, number])[])[];
}

export interface MapPoint {
  readonly id: string;
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
  readonly value: number;
  readonly secondaryValue?: number;
  readonly groupId?: string;
  readonly color?: string;
}

export interface MapFlow {
  readonly id: string;
  readonly fromLat: number;
  readonly fromLng: number;
  readonly toLat: number;
  readonly toLng: number;
  readonly magnitude: number;
  readonly fromLabel?: string;
  readonly toLabel?: string;
  readonly color?: string;
  readonly metadata?: Readonly<Record<string, string | number>>;
}

export interface MapCallout {
  readonly id: string;
  readonly targetLat: number;
  readonly targetLng: number;
  readonly anchorLat: number;
  readonly anchorLng: number;
  readonly label: string;
  readonly valueLabel?: string;
  readonly align?: 'start' | 'end';
}

export interface MapData {
  readonly polygons?: readonly MapPolygon[];
  /** Standard GeoJSON FeatureCollection (optional alternative to `polygons`). */
  readonly geoJson?: GeoJSON.FeatureCollection;
  /** Optional regionId -> numeric value map for choropleth shading. */
  readonly regionValues?: Readonly<Record<string, number>>;
  readonly points?: readonly MapPoint[];
  readonly flows?: readonly MapFlow[];
  readonly callouts?: readonly MapCallout[];
}

export interface MapOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly projection?: MapProjectionKind;
  readonly landColor?: string;
  readonly oceanColor?: string;
  readonly pointColor?: string;
  readonly secondaryPointColor?: string;
  readonly flowColor?: string;
  readonly pointLegendLabel?: string;
  readonly secondaryPointLegendLabel?: string;
  readonly flowLegendLabel?: string;
  readonly choroplethLegendLabel?: string;
  readonly minPointRadius?: number;
  readonly maxPointRadius?: number;
  readonly enableZoom?: boolean;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly formatValue?: (value: number) => string;
  readonly formatPointTooltip?: (point: MapPoint) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
  readonly onZoomChange?: (state: ZoomState) => void;
}

export interface MapChartInstance {
  readonly chartId: MapChartId;
  update(data: MapData, options?: Partial<MapOptions>): void;
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
const PARCHMENT = '#F4EFE6';
const VELLUM = '#EAE2D3';
const WARM_TAN = '#D2B48C';
const UNFOCUSED = '#DED6C6';
const CRIMSON = '#DC143C';
const COBALT = '#2B5B84';
const GOLD = '#FFD700';

const CHOROPLETH_RAMP: readonly string[] = [
  '#EAE2D3',
  '#F6E89E',
  '#F5C16C',
  '#EE5340',
  '#DC143C',
  '#A50050',
];

const FALLBACK_STYLE_ID = 'dubois-map-fallback-style';

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
    .dubois-legend-swatch--dot{inline-size:10px;block-size:10px;border-radius:50%}
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

function normalizeFeatureWinding(
  feature: GeoJSON.Feature,
  isSpherical: boolean
): GeoJSON.Feature {
  if (!isSpherical || !feature.geometry) return feature;
  if (d3.geoArea(feature) <= 2 * Math.PI) return feature;

  if (feature.geometry.type === 'Polygon') {
    return {
      ...feature,
      geometry: {
        type: 'Polygon',
        coordinates: feature.geometry.coordinates.map((ring) => [...ring].reverse()),
      },
    };
  }
  if (feature.geometry.type === 'MultiPolygon') {
    return {
      ...feature,
      geometry: {
        type: 'MultiPolygon',
        coordinates: feature.geometry.coordinates.map((poly) =>
          poly.map((ring) => [...ring].reverse())
        ),
      },
    };
  }
  return feature;
}

function polygonsToGeoJson(polygons: readonly MapPolygon[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: polygons.map((p) => ({
      type: 'Feature',
      id: p.id,
      properties: { id: p.id, label: p.label ?? p.id },
      geometry: {
        type: 'Polygon',
        coordinates: p.rings.map((ring) => ring.map(([lng, lat]) => [lng, lat])),
      },
    })),
  };
}

function createProjection(kind: MapProjectionKind): d3.GeoProjection {
  switch (kind) {
    case 'mercator':
      return d3.geoMercator();
    case 'equalEarth':
      return d3.geoEqualEarth();
    case 'albers':
      return d3.geoAlbers();
    case 'identity':
      return d3.geoIdentity().reflectY(true) as unknown as d3.GeoProjection;
    case 'naturalEarth1':
    default:
      return d3.geoNaturalEarth1();
  }
}

/**
 * Domain-agnostic Du Bois Map supporting GeoJSON or polygon arrays, any D3
 * projection, choropleth shading, proportional symbols, curved flow arcs,
 * marginal callouts, and interactive 2D zoom/pan.
 */
export function mountMap(
  container: HTMLElement,
  initialData: MapData,
  initialOptions: MapOptions = {}
): MapChartInstance {
  ensureFallbackStyles();

  const chartId = asMapChartId(
    initialOptions.chartId ?? `map-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: MapData = initialData;
  let options: MapOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;
  let naturalDomain: ScaleDomain = { min: 0, max: 1 };
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
    .attr('aria-label', options.ariaLabel ?? 'Archival map');

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
    const width = Math.max(180, Math.round(rect.width || 680));
    const height = Math.max(150, Math.round(rect.height || 400));
    const tier: ResponsiveSizeTier =
      options.sizeTierOverride ??
      (width < 280 ? 'micro' : width < 520 ? 'compact' : 'expanded');

    const points = data.points ?? [];
    const flows = data.flows ?? [];
    const callouts = data.callouts ?? [];
    const regionValues = data.regionValues ?? {};
    const fmt = options.formatValue ?? defaultFormat;

    const maxPointVal = d3.max(points, (p) => Math.max(p.value, p.secondaryValue ?? 0)) ?? 1;
    naturalDomain = { min: 0, max: maxPointVal > 0 ? maxPointVal : 1 };

    const projKind = options.projection ?? 'naturalEarth1';
    const isSpherical = projKind !== 'identity';
    const rawFc: GeoJSON.FeatureCollection = data.geoJson
      ? data.geoJson
      : data.polygons
        ? polygonsToGeoJson(data.polygons)
        : { type: 'FeatureCollection', features: [] };
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: rawFc.features.map((f) => normalizeFeatureWinding(f, isSpherical)),
    };

    // Legend (rendered BEFORE measuring svgWrap so viewBox matches exact post-legend dimensions)
    const legendTarget = options.externalLegendEl ?? legendWrap;
    legendWrap.innerHTML = '';
    if (options.externalLegendEl) options.externalLegendEl.innerHTML = '';

    const pointFill = options.pointColor ?? CRIMSON;
    const secondaryFill = options.secondaryPointColor ?? GOLD;
    const flowStroke = options.flowColor ?? COBALT;

    if (options.showLegend !== false && (points.length > 0 || flows.length > 0 || Object.keys(regionValues).length > 0)) {
      const strip = document.createElement('div');
      strip.className = 'dubois-legend-strip';

      const addItem = (color: string, label: string, dot = false): void => {
        const el = document.createElement('span');
        el.className = 'dubois-legend-item';
        const sw = document.createElement('span');
        sw.className = dot ? 'dubois-legend-swatch dubois-legend-swatch--dot' : 'dubois-legend-swatch';
        sw.style.backgroundColor = color;
        const tx = document.createElement('span');
        tx.textContent = label;
        el.append(sw, tx);
        strip.appendChild(el);
      };

      if (Object.keys(regionValues).length > 0) {
        addItem(CRIMSON, options.choroplethLegendLabel ?? 'Region Intensity');
      }
      if (points.length > 0) {
        addItem(pointFill, options.pointLegendLabel ?? 'Primary Metric', true);
      }
      if (points.some((p) => typeof p.secondaryValue === 'number' && p.secondaryValue > 0)) {
        addItem(secondaryFill, options.secondaryPointLegendLabel ?? 'Secondary Subset', true);
      }
      if (flows.length > 0) {
        addItem(flowStroke, options.flowLegendLabel ?? 'Directed Flow');
      }
      legendTarget.appendChild(strip);
    }

    const postRect = svgWrap.getBoundingClientRect();
    const finalW = Math.max(180, Math.round(postRect.width || width));
    const finalH = Math.max(150, Math.round(postRect.height || height));

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${finalW} ${finalH}`);

    // Build fit target combining geography + points + flows
    const fitFeatures: GeoJSON.Feature[] = [...fc.features];
    for (const pt of points) {
      fitFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
      });
    }
    for (const fl of flows) {
      fitFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'MultiPoint',
          coordinates: [
            [fl.fromLng, fl.fromLat],
            [fl.toLng, fl.toLat],
          ],
        },
      });
    }

    if (fitFeatures.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'dubois-axis-tick-label')
        .text('NO GEOGRAPHY OR POINTS PROVIDED');
      return;
    }

    const pad = tier === 'micro' ? 10 : 28;
    const projection = createProjection(projKind);
    projection.fitExtent(
      [
        [pad, pad],
        [finalW - pad, finalH - pad],
      ],
      { type: 'FeatureCollection', features: fitFeatures }
    );
    const geoPath = d3.geoPath(projection);

    // Arrowhead marker
    const defs = svg.append('defs');
    const markerId = `${chartId}-arrow`;
    defs
      .append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 1 L 10 5 L 0 9 z')
      .attr('fill', flowStroke)
      .attr('stroke', INK)
      .attr('stroke-width', 0.6);

    // Background canvas
    svg
      .append('rect')
      .attr('width', finalW)
      .attr('height', finalH)
      .attr('fill', options.oceanColor ?? PARCHMENT);

    const scene = svg.append('g').attr('class', 'dubois-map-scene');

    // Choropleth color scale
    const regVals = Object.values(regionValues).filter((v) => Number.isFinite(v));
    const regMax = d3.max(regVals) ?? 1;
    const regMin = d3.min(regVals) ?? 0;
    const choroScale = d3
      .scaleQuantize<string>()
      .domain([regMin, regMax > regMin ? regMax : regMin + 1])
      .range([...CHOROPLETH_RAMP]);

    // 1. Geography polygons
    const landFill = options.landColor ?? VELLUM;
    scene
      .append('g')
      .selectAll<SVGPathElement, GeoJSON.Feature>('path')
      .data(fc.features)
      .join('path')
      .attr('class', 'dubois-gouache-mark')
      .attr('d', (feat) => geoPath(feat) ?? '')
      .attr('fill', (feat) => {
        const fid = String(feat.id ?? (feat.properties as Record<string, unknown> | null)?.['id'] ?? '');
        const rv = regionValues[fid];
        const isDimmed =
          selectedKeys.size > 0 && fid.length > 0 && !selectedKeys.has(fid);
        if (isDimmed) return UNFOCUSED;
        return typeof rv === 'number' ? choroScale(rv) : landFill;
      })
      .attr('fill-opacity', 1)
      .attr('stroke', INK)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mousemove', (ev: MouseEvent, feat) => {
        const props = (feat.properties ?? {}) as Record<string, unknown>;
        const fid = String(feat.id ?? props['id'] ?? '');
        const label = String(props['label'] ?? props['name'] ?? fid);
        const rv = regionValues[fid];
        if (!label && rv === undefined) return;
        const rows: { label: string; value: string }[] = [];
        if (typeof rv === 'number') {
          rows.push({ label: options.choroplethLegendLabel ?? 'Value', value: fmt(rv) });
        }
        showTooltip(ev, {
          title: label || 'Region',
          swatchColor: typeof rv === 'number' ? choroScale(rv) : WARM_TAN,
          rows: rows.length > 0 ? rows : [{ label: 'Region ID', value: fid || '—' }],
        });
      })
      .on('mouseleave', hideTooltip)
      .on('click', (_ev: MouseEvent, feat) => {
        const fid = String(feat.id ?? (feat.properties as Record<string, unknown> | null)?.['id'] ?? '');
        if (!fid) return;
        if (selectedKeys.has(fid) && selectedKeys.size === 1) selectedKeys.clear();
        else selectedKeys = new Set([fid]);
        options.onSelect?.(Array.from(selectedKeys));
        render();
      });

    // 2. Curved directed flow arcs
    if (flows.length > 0) {
      const maxFlow = d3.max(flows, (f) => Math.max(0, f.magnitude)) ?? 1;
      const strokeScale = d3.scaleSqrt().domain([0, maxFlow]).range([1.2, 5]);

      for (const fl of flows) {
        const p0 = projection([fl.fromLng, fl.fromLat]);
        const p1 = projection([fl.toLng, fl.toLat]);
        if (!p0 || !p1) continue;
        const mx = (p0[0] + p1[0]) / 2;
        const my = (p0[1] + p1[1]) / 2;
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const dist = Math.hypot(dx, dy);
        if (dist < 2) continue;
        const cx = mx - (dy / dist) * Math.min(44, dist * 0.22);
        const cy = my + (dx / dist) * Math.min(44, dist * 0.22);
        const dPath = `M${p0[0]},${p0[1]} Q${cx},${cy} ${p1[0]},${p1[1]}`;
        const col = fl.color ?? flowStroke;

        scene
          .append('path')
          .attr('d', dPath)
          .attr('fill', 'none')
          .attr('stroke', col)
          .attr('stroke-width', strokeScale(fl.magnitude))
          .attr('marker-end', `url(#${markerId})`)
          .style('cursor', 'pointer')
          .on('mousemove', (ev: MouseEvent) => {
            const rows: { label: string; value: string }[] = [
              { label: 'Magnitude', value: fmt(fl.magnitude) },
            ];
            if (fl.metadata) {
              for (const [k, v] of Object.entries(fl.metadata)) {
                rows.push({ label: k, value: typeof v === 'number' ? fmt(v) : v });
              }
            }
            showTooltip(ev, {
              title: `${fl.fromLabel ?? 'Origin'} → ${fl.toLabel ?? 'Destination'}`,
              swatchColor: col,
              rows,
            });
          })
          .on('mouseleave', hideTooltip);
      }
    }

    // 3. Proportional symbols
    const eff = overrideDomain ?? naturalDomain;
    const rScale = d3
      .scaleSqrt()
      .domain([0, eff.max])
      .range([options.minPointRadius ?? 3, options.maxPointRadius ?? (tier === 'micro' ? 12 : 24)]);

    const sortedPoints = [...points].sort((a, b) => b.value - a.value);
    for (const pt of sortedPoints) {
      if (pt.value <= 0) continue;
      const xy = projection([pt.lng, pt.lat]);
      if (!xy) continue;

      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(pt.id) && !(pt.groupId && selectedKeys.has(pt.groupId))) ||
        (hoveredKey !== null && hoveredKey !== pt.id && hoveredKey !== pt.groupId);

      const rawFill = pt.color ?? pointFill;
      const r = rScale(pt.value);

      scene
        .append('circle')
        .attr('class', 'dubois-gouache-mark')
        .attr('cx', xy[0])
        .attr('cy', xy[1])
        .attr('r', r)
        .attr('fill', isDimmed ? UNFOCUSED : rawFill)
        .attr('fill-opacity', 1)
        .attr('stroke', INK)
        .attr('stroke-width', 1.1)
        .style('cursor', 'pointer')
        .on('mousemove', (ev: MouseEvent) => {
          const rows: { label: string; value: string }[] = [
            { label: options.pointLegendLabel ?? 'Value', value: fmt(pt.value) },
          ];
          if (typeof pt.secondaryValue === 'number') {
            rows.push({
              label: options.secondaryPointLegendLabel ?? 'Subset',
              value: fmt(pt.secondaryValue),
            });
          }
          const spec = options.formatPointTooltip
            ? options.formatPointTooltip(pt)
            : { title: pt.label, swatchColor: rawFill, rows };
          showTooltip(ev, spec);
        })
        .on('mouseenter', () => {
          hoveredKey = pt.id;
          options.onHover?.(pt.id);
        })
        .on('mouseleave', () => {
          hoveredKey = null;
          options.onHover?.(null);
          hideTooltip();
        })
        .on('click', () => {
          if (selectedKeys.has(pt.id) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([pt.id]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        });

      if (typeof pt.secondaryValue === 'number' && pt.secondaryValue > 0) {
        scene
          .append('circle')
          .attr('class', 'dubois-gouache-mark')
          .attr('cx', xy[0])
          .attr('cy', xy[1])
          .attr('r', Math.min(r * 0.85, rScale(pt.secondaryValue)))
          .attr('fill', isDimmed ? UNFOCUSED : secondaryFill)
          .attr('fill-opacity', 1)
          .attr('stroke', INK)
          .attr('stroke-width', 0.9)
          .style('pointer-events', 'none');
      }
    }

    // 4. Marginal archival callouts (viewport-clamped so labels never clip off SVG edges)
    if (tier === 'expanded' && callouts.length > 0) {
      for (const co of callouts) {
        const target = projection([co.targetLng, co.targetLat]);
        const rawAnchor = projection([co.anchorLng, co.anchorLat]);
        if (!target || !rawAnchor) continue;
        const text = co.valueLabel ? `${co.label} (${co.valueLabel})` : co.label;
        const estTextW = text.length * 6.2;
        const ax = Math.max(10, Math.min(finalW - 10, rawAnchor[0]));
        const ay = Math.max(14, Math.min(finalH - 10, rawAnchor[1]));
        let align: 'start' | 'end' = co.align ?? 'start';
        if (align === 'end' && ax - estTextW < 6) align = 'start';
        if (align === 'start' && ax + estTextW > finalW - 6) align = 'end';

        scene
          .append('line')
          .attr('x1', target[0])
          .attr('y1', target[1])
          .attr('x2', ax)
          .attr('y2', ay)
          .attr('stroke', INK)
          .attr('stroke-width', 0.9)
          .attr('stroke-dasharray', '2,2');
        scene
          .append('text')
          .attr('x', ax + (align === 'end' ? -4 : 4))
          .attr('y', ay + 3)
          .attr('text-anchor', align)
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 9.5)
          .attr('font-weight', 700)
          .attr('fill', INK)
          .text(text);
      }
    }

    // 5. Optional D3 2D zoom & pan
    if (options.enableZoom !== false) {
      zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 6])
        .on('zoom', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          scene.attr('transform', ev.transform.toString());
          currentZoomScale = ev.transform.k;
          options.onZoomChange?.({ scale: currentZoomScale });
        });
      svg.call(zoomBehavior);
      if (currentZoomScale !== 1) {
        svg.call(zoomBehavior.scaleTo, currentZoomScale);
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
    update(nextData: MapData, nextOptions?: Partial<MapOptions>): void {
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
      currentZoomScale = state ? Math.max(1, Math.min(6, state.scale)) : 1;
      if (zoomBehavior) {
        svg.call(zoomBehavior.scaleTo, currentZoomScale);
      }
    },
    resetZoom(): void {
      currentZoomScale = 1;
      if (zoomBehavior) {
        svg.call(zoomBehavior.transform, d3.zoomIdentity);
      }
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

export const MapChart = {
  id: 'map',
  mount: mountMap,
} as const;
