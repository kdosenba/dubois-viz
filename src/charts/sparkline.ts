import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type SparklineChartId = string & { readonly __brand: 'SparklineChartId' };
export const asSparklineChartId = (id: string): SparklineChartId =>
  id as SparklineChartId;

export interface ScaleDomain {
  readonly min: number;
  readonly max: number;
}

export interface TimeWindow {
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface SparklineStep {
  readonly id: string;
  readonly label?: string;
}

export interface SparklineBand {
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
  readonly kind?: 'area' | 'line' | 'bar';
  readonly color?: string;
}

export interface SparklineEra {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly label?: string;
  readonly color?: string;
}

export interface SparklineMilestone {
  readonly stepIndex: number;
  readonly label: string;
  readonly color?: string;
}

export interface SparklineData {
  readonly steps: readonly SparklineStep[];
  readonly bands: readonly SparklineBand[];
  readonly eras?: readonly SparklineEra[];
  readonly milestones?: readonly SparklineMilestone[];
}

export interface SparklineOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly showLatestValue?: boolean;
  readonly palette?: readonly string[];
  readonly formatValue?: (value: number) => string;
}

export interface SparklineChartInstance {
  readonly chartId: SparklineChartId;
  update(data: SparklineData, options?: Partial<SparklineOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  getTimeWindow(): TimeWindow | null;
  setTimeWindow(window: TimeWindow | null): void;
  getStepCount(): number;
  destroy(): void;
}

const INK = '#1A1615';
const CHARCOAL = '#52493E';
const VELLUM = '#EAE2D3';
const CRIMSON = '#DC143C';

const PALETTE_A: readonly string[] = [
  '#DC143C',
  '#2B5B84',
  '#008055',
  '#E87722',
  '#753ABD',
  '#00A7B5',
];

const FALLBACK_STYLE_ID = 'dubois-sparkline-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-chart-root{inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;display:flex;flex-direction:column;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);position:relative;overflow:hidden;box-sizing:border-box}
    .dubois-chart-svg-wrap{flex:1 1 0%;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;position:relative}
    .dubois-chart-svg{inline-size:100%;block-size:100%;display:block;overflow:visible}
  `;
  document.head.appendChild(style);
}

function defaultFormat(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
}

/**
 * Compact 1..N-band Archival Sparkline supporting area, line, or bar bands,
 * shaded era spans, vertical milestone markers, and TimeWindowBus sync.
 */
export function mountSparkline(
  container: HTMLElement,
  initialData: SparklineData,
  initialOptions: SparklineOptions = {}
): SparklineChartInstance {
  ensureFallbackStyles();

  const chartId = asSparklineChartId(
    initialOptions.chartId ?? `sparkline-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: SparklineData = initialData;
  let options: SparklineOptions = { ...initialOptions };
  let overrideDomain: ScaleDomain | null = null;
  let timeWindow: TimeWindow | null = null;
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
    .attr('aria-label', options.ariaLabel ?? 'Multi-band archival sparkline');

  function render(): void {
    const rect = svgWrap.getBoundingClientRect();
    const width = Math.max(140, Math.round(rect.width || 280));
    const height = Math.max(70, Math.round(rect.height || 140));

    const totalSteps = data.steps.length;
    const allVals = data.bands.flatMap((b) => [...b.values]);
    naturalDomain = {
      min: Math.min(0, d3.min(allVals) ?? 0),
      max: Math.max(1, d3.max(allVals) ?? 1),
    };

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (totalSteps === 0 || data.bands.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 9)
        .attr('fill', CHARCOAL)
        .text('NO HISTORY');
      return;
    }

    const startIdx = timeWindow
      ? Math.max(0, Math.min(totalSteps - 1, timeWindow.startIndex))
      : 0;
    const endIdx = timeWindow
      ? Math.max(startIdx, Math.min(totalSteps - 1, timeWindow.endIndex))
      : totalSteps - 1;
    const visibleCount = endIdx - startIdx + 1;

    const margin = { top: 12, right: 8, bottom: 16, left: 6 };
    const innerW = Math.max(40, width - margin.left - margin.right);
    const innerH = Math.max(30, height - margin.top - margin.bottom);
    const gap = 10;
    const bandH = Math.max(14, (innerH - gap * (data.bands.length - 1)) / data.bands.length);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([startIdx, Math.max(startIdx + 1, endIdx)])
      .range([0, innerW]);

    // Shaded era spans
    if (data.eras) {
      for (const era of data.eras) {
        const s = Math.max(startIdx, era.startIndex);
        const e = Math.min(endIdx, era.endIndex);
        if (e < s) continue;
        const x0 = xScale(s);
        const x1 = xScale(e);
        g.append('rect')
          .attr('x', x0)
          .attr('y', 0)
          .attr('width', Math.max(1, x1 - x0))
          .attr('height', innerH)
          .attr('fill', era.color ?? VELLUM);
      }
    }

    const pal = options.palette ?? PALETTE_A;
    const fmt = options.formatValue ?? defaultFormat;

    data.bands.forEach((band, bIdx) => {
      const yOffset = bIdx * (bandH + gap);
      const slice = band.values.slice(startIdx, endIdx + 1);
      const bandMax = overrideDomain?.max ?? Math.max(1, d3.max(band.values) ?? 1);
      const yScale = d3.scaleLinear().domain([0, bandMax]).range([bandH, 10]);
      const color = band.color ?? pal[bIdx % pal.length] ?? PALETTE_A[0]!;
      const kind = band.kind ?? 'area';

      const bg = g.append('g').attr('transform', `translate(0,${yOffset})`);

      // Band baseline
      bg.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', bandH)
        .attr('y2', bandH)
        .attr('stroke', INK)
        .attr('stroke-width', 0.9);

      if (kind === 'bar') {
        const bw = Math.max(1.5, innerW / Math.max(1, visibleCount) - 1);
        slice.forEach((v, i) => {
          const x = xScale(startIdx + i) - bw / 2;
          const y = yScale(Math.max(0, v));
          bg.append('rect')
            .attr('x', Math.max(0, x))
            .attr('y', y)
            .attr('width', bw)
            .attr('height', Math.max(0, bandH - y))
            .attr('fill', color)
            .attr('stroke', INK)
            .attr('stroke-width', 0.6);
        });
      } else {
        if (kind === 'area') {
          const areaGen = d3
            .area<number>()
            .x((_, i) => xScale(startIdx + i))
            .y0(bandH)
            .y1((v) => yScale(Math.max(0, v)));
          bg.append('path')
            .datum(slice)
            .attr('d', areaGen)
            .attr('fill', color)
            .attr('fill-opacity', 1)
            .attr('stroke', INK)
            .attr('stroke-width', 1);
        } else {
          const lineGen = d3
            .line<number>()
            .x((_, i) => xScale(startIdx + i))
            .y((v) => yScale(Math.max(0, v)));
          bg.append('path')
            .datum(slice)
            .attr('d', lineGen)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.8);
        }
      }

      // Band header label + latest value
      bg.append('text')
        .attr('x', 2)
        .attr('y', 7)
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 8)
        .attr('font-weight', 700)
        .attr('fill', INK)
        .text(band.label.toUpperCase());

      if (options.showLatestValue !== false && slice.length > 0) {
        const latest = slice[slice.length - 1] ?? 0;
        bg.append('text')
          .attr('x', innerW - 2)
          .attr('y', 7)
          .attr('text-anchor', 'end')
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 8.5)
          .attr('font-weight', 700)
          .attr('fill', INK)
          .text(fmt(latest));
      }
    });

    // Vertical milestone lines
    if (data.milestones) {
      for (const m of data.milestones) {
        if (m.stepIndex < startIdx || m.stepIndex > endIdx) continue;
        const mx = xScale(m.stepIndex);
        g.append('line')
          .attr('x1', mx)
          .attr('x2', mx)
          .attr('y1', 0)
          .attr('y2', innerH)
          .attr('stroke', m.color ?? CRIMSON)
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '3,2');
        g.append('text')
          .attr('x', mx + 3)
          .attr('y', -2)
          .attr('font-family', "'Space Mono', monospace")
          .attr('font-size', 7.5)
          .attr('font-weight', 700)
          .attr('fill', m.color ?? CRIMSON)
          .text(m.label.toUpperCase());
      }
    }

    // Start & end X labels
    const firstStep = data.steps[startIdx];
    const lastStep = data.steps[endIdx];
    if (firstStep?.label) {
      g.append('text')
        .attr('x', 0)
        .attr('y', innerH + 12)
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 8)
        .attr('fill', CHARCOAL)
        .text(firstStep.label);
    }
    if (lastStep?.label && endIdx > startIdx) {
      g.append('text')
        .attr('x', innerW)
        .attr('y', innerH + 12)
        .attr('text-anchor', 'end')
        .attr('font-family', "'Space Mono', monospace")
        .attr('font-size', 8)
        .attr('fill', CHARCOAL)
        .text(lastStep.label);
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
    update(nextData: SparklineData, nextOptions?: Partial<SparklineOptions>): void {
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
    destroy(): void {
      ro?.disconnect();
      root.remove();
    },
  };
}

export const SparklineChart = {
  id: 'sparkline',
  mount: mountSparkline,
} as const;
