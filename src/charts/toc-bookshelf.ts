import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type TocBookshelfChartId = string & {
  readonly __brand: 'TocBookshelfChartId';
};
export const asTocBookshelfChartId = (id: string): TocBookshelfChartId =>
  id as TocBookshelfChartId;

export type BuiltInChartThumbnail =
  | 'columns'
  | 'butterfly'
  | 'line-chart'
  | 'stacked-area'
  | 'histogram'
  | 'heatmap'
  | 'table'
  | 'ratio-pyramids'
  | 'radial-coil'
  | 'radial-dynamo'
  | 'sparkline'
  | 'map';

export interface BookshelfVolume {
  readonly id: string;
  readonly numeral: string;
  readonly shortTitle: string;
  readonly title: string;
  readonly color: string;
  readonly epigraph?: string;
}

export interface BookshelfPlateEntry {
  readonly id: string;
  readonly number: number;
  readonly numeral: string;
  readonly title: string;
  readonly volumeIds: readonly string[];
  readonly thumbnail?: BuiltInChartThumbnail;
  readonly badge?: string;
  readonly note?: string;
}

export interface TocBookshelfData {
  readonly volumes: readonly BookshelfVolume[];
  readonly items: readonly BookshelfPlateEntry[];
}

export interface TocBookshelfOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly initialVolumeId?: string;
  readonly renderThumbnail?: (
    svg: d3.Selection<SVGSVGElement, undefined, null, undefined>,
    item: BookshelfPlateEntry
  ) => void;
  readonly onSelectVolume?: (volumeId: string) => void;
  readonly onSelectItem?: (item: BookshelfPlateEntry) => void;
}

export interface TocBookshelfChartInstance {
  readonly chartId: TocBookshelfChartId;
  update(data: TocBookshelfData, options?: Partial<TocBookshelfOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  setSelectedKeys(keys: readonly string[]): void;
  setActiveVolume(volumeId: string): void;
  destroy(): void;
}

const INK = '#1A1615';
const PARCHMENT = '#F4EFE6';
const CRIMSON = '#DC143C';
const COBALT = '#2B5B84';
const EMERALD = '#008055';
const GOLD = '#FFD700';
const OCHRE = '#E87722';

const FALLBACK_STYLE_ID = 'dubois-toc-bookshelf-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-bookshelf-root{inline-size:100%;block-size:100%;display:flex;flex-direction:column;gap:12px;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);padding:8px 12px;overflow:auto;box-sizing:border-box}
    .dubois-bookshelf-rack{display:flex;flex-wrap:wrap;align-items:stretch;justify-content:center;gap:10px;border-block-end:2px solid var(--dubois-ink,#1A1615);padding-block-end:10px}
    .dubois-bookshelf-spine{appearance:none;border:1.5px solid var(--dubois-ink,#1A1615);padding:8px 14px;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-inline-size:130px;text-align:left;font-family:var(--dubois-font-mono,monospace);transition:transform 120ms ease}
    .dubois-bookshelf-spine:hover{transform:translateY(-2px)}
    .dubois-bookshelf-spine.is-active{box-shadow:4px 4px 0 var(--dubois-ink,#1A1615);transform:translateY(-3px)}
    .dubois-bookshelf-epigraph{text-align:center;font-family:var(--dubois-font-serif,Georgia,serif);font-style:italic;font-size:14px;color:var(--dubois-charcoal,#52493E);margin:0 auto;max-inline-size:680px}
    .dubois-bookshelf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:12px;align-content:start}
    .dubois-bookshelf-card{appearance:none;background:var(--dubois-parchment,#F4EFE6);border:1.5px solid var(--dubois-ink,#1A1615);padding:10px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:6px;transition:box-shadow 120ms ease,transform 120ms ease}
    .dubois-bookshelf-card:hover,.dubois-bookshelf-card.is-selected{box-shadow:4px 4px 0 var(--dubois-ink,#1A1615);transform:translate(-1px,-1px)}
    .dubois-bookshelf-card-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--dubois-font-mono,monospace);font-size:9.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dubois-charcoal,#52493E)}
    .dubois-bookshelf-card-badge{padding:1px 5px;background:var(--dubois-vellum,#EAE2D3);border:1px solid var(--dubois-ink,#1A1615);color:var(--dubois-ink,#1A1615);font-size:8.5px}
    .dubois-bookshelf-card-title{font-family:var(--dubois-font-title,sans-serif);font-weight:800;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:var(--dubois-ink,#1A1615);line-height:1.25}
    .dubois-bookshelf-thumb{inline-size:100%;block-size:68px;display:block;background:var(--dubois-vellum,#EAE2D3);border:1px solid var(--dubois-ink,#1A1615)}
    .dubois-bookshelf-card-note{font-family:var(--dubois-font-serif,Georgia,serif);font-style:italic;font-size:12px;color:var(--dubois-charcoal,#52493E);line-height:1.3}
  `;
  document.head.appendChild(style);
}

function drawBuiltInThumbnail(
  svg: d3.Selection<SVGSVGElement, undefined, null, undefined>,
  kind: BuiltInChartThumbnail
): void {
  svg.attr('viewBox', '0 0 120 56');
  const mark = (fill: string): { fill: string; stroke: string; 'stroke-width': number } => ({
    fill,
    stroke: INK,
    'stroke-width': 0.9,
  });

  switch (kind) {
    case 'butterfly': {
      svg.append('line').attr('x1', 54).attr('x2', 54).attr('y1', 6).attr('y2', 50).attr('stroke', INK);
      svg.append('line').attr('x1', 66).attr('x2', 66).attr('y1', 6).attr('y2', 50).attr('stroke', INK);
      [34, 24, 40, 18].forEach((w, i) => {
        const y = 9 + i * 10;
        svg.append('rect').attr('x', 54 - w).attr('y', y).attr('width', w).attr('height', 7).attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
        svg.append('rect').attr('x', 66).attr('y', y).attr('width', w * 0.85).attr('height', 7).attr('fill', COBALT).attr('stroke', INK).attr('stroke-width', 0.8);
      });
      break;
    }
    case 'line-chart': {
      const p1 = 'M10,44 L36,30 L64,26 L92,18 L110,14';
      const p2 = 'M10,14 L36,24 L64,34 L92,40 L110,44';
      svg.append('path').attr('d', p1).attr('fill', 'none').attr('stroke', CRIMSON).attr('stroke-width', 2);
      svg.append('path').attr('d', p2).attr('fill', 'none').attr('stroke', COBALT).attr('stroke-width', 2);
      break;
    }
    case 'stacked-area': {
      svg.append('path').attr('d', 'M8,48 L36,34 L72,26 L112,18 L112,48 Z').attr('fill', COBALT).attr('stroke', INK).attr('stroke-width', 0.8);
      svg.append('path').attr('d', 'M36,34 L72,18 L112,10 L112,18 L72,26 Z').attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
      svg.append('path').attr('d', 'M72,18 L112,6 L112,10 Z').attr('fill', GOLD).attr('stroke', INK).attr('stroke-width', 0.8);
      break;
    }
    case 'histogram': {
      const hs = [10, 18, 38, 28, 16, 10];
      const cs = [EMERALD, EMERALD, GOLD, COBALT, COBALT, COBALT];
      hs.forEach((h, i) => {
        svg.append('rect').attr('x', 12 + i * 16).attr('y', 48 - h).attr('width', 14).attr('height', h).attr('fill', cs[i]!).attr('stroke', INK).attr('stroke-width', 0.8);
      });
      break;
    }
    case 'heatmap': {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const rad = 2.5 + ((r * 2 + c) % 4) * 1.4;
          svg.append('circle').attr('cx', 20 + c * 20).attr('cy', 12 + r * 16).attr('r', rad).attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
        }
      }
      break;
    }
    case 'table': {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const filled = (r + c) % 2 === 0;
          svg.append('rect').attr('x', 14 + c * 15).attr('y', 8 + r * 10).attr('width', 12).attr('height', 7).attr('fill', filled ? EMERALD : PARCHMENT).attr('stroke', INK).attr('stroke-width', 0.7);
        }
      }
      break;
    }
    case 'ratio-pyramids': {
      [34, 86].forEach((cx) => {
        svg.append('rect').attr('x', cx - 7).attr('y', 8).attr('width', 14).attr('height', 9).attr('fill', GOLD).attr('stroke', INK).attr('stroke-width', 0.8);
        svg.append('rect').attr('x', cx - 14).attr('y', 23).attr('width', 28).attr('height', 9).attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
        svg.append('rect').attr('x', cx - 22).attr('y', 38).attr('width', 44).attr('height', 9).attr('fill', COBALT).attr('stroke', INK).attr('stroke-width', 0.8);
      });
      break;
    }
    case 'radial-coil': {
      const arc = d3.arc<unknown>().innerRadius(15).outerRadius(21).startAngle(0).endAngle(4.4);
      const arc2 = d3.arc<unknown>().innerRadius(8).outerRadius(13).startAngle(0).endAngle(3.2);
      const g = svg.append('g').attr('transform', 'translate(60,28)');
      g.append('path').attr('d', arc({}) ?? '').attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
      g.append('path').attr('d', arc2({}) ?? '').attr('fill', GOLD).attr('stroke', INK).attr('stroke-width', 0.8);
      break;
    }
    case 'radial-dynamo': {
      const g = svg.append('g').attr('transform', 'translate(60,28)');
      for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3;
        const a = d3.arc<unknown>().innerRadius(8).outerRadius(15 + (i % 3) * 4).startAngle(a0).endAngle(a0 + 0.85);
        g.append('path').attr('d', a({}) ?? '').attr('fill', i % 2 === 0 ? COBALT : EMERALD).attr('stroke', INK).attr('stroke-width', 0.8);
      }
      g.append('circle').attr('r', 8).attr('fill', GOLD).attr('stroke', INK).attr('stroke-width', 0.9);
      break;
    }
    case 'sparkline': {
      [18, 34, 48].forEach((y, i) => {
        const cols = [CRIMSON, COBALT, EMERALD];
        svg.append('path').attr('d', `M8,${y} L34,${y - 6} L62,${y - 4} L90,${y - 10} L112,${y - 8} L112,${y} Z`).attr('fill', cols[i]!).attr('stroke', INK).attr('stroke-width', 0.7);
      });
      break;
    }
    case 'map': {
      svg.append('path').attr('d', 'M14,22 L42,10 L76,14 L106,24 L94,44 L54,46 L22,38 Z').attr('fill', PARCHMENT).attr('stroke', INK).attr('stroke-width', 0.9);
      svg.append('circle').attr('cx', 44).attr('cy', 26).attr('r', 6).attr('fill', CRIMSON).attr('stroke', INK).attr('stroke-width', 0.8);
      svg.append('circle').attr('cx', 78).attr('cy', 28).attr('r', 4.5).attr('fill', GOLD).attr('stroke', INK).attr('stroke-width', 0.8);
      svg.append('path').attr('d', 'M44,26 Q60,14 78,28').attr('fill', 'none').attr('stroke', COBALT).attr('stroke-width', 1.4);
      break;
    }
    case 'columns':
    default: {
      const hs = [18, 30, 24, 40, 34];
      const cs = [COBALT, CRIMSON, EMERALD, GOLD, OCHRE];
      hs.forEach((h, i) => {
        const m = mark(cs[i]!);
        svg.append('rect').attr('x', 14 + i * 19).attr('y', 48 - h).attr('width', 14).attr('height', h).attr('fill', m.fill).attr('stroke', m.stroke).attr('stroke-width', m['stroke-width']);
      });
      break;
    }
  }
}

/**
 * Visual Archival Table of Contents / Volume Bookshelf with built-in miniature
 * SVG previews for all 12 data chart types and a custom thumbnail hook.
 */
export function mountTocBookshelf(
  container: HTMLElement,
  initialData: TocBookshelfData,
  initialOptions: TocBookshelfOptions = {}
): TocBookshelfChartInstance {
  ensureFallbackStyles();

  const chartId = asTocBookshelfChartId(
    initialOptions.chartId ?? `toc-bookshelf-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: TocBookshelfData = initialData;
  let options: TocBookshelfOptions = { ...initialOptions };
  let activeVolumeId: string =
    options.initialVolumeId ?? data.volumes[0]?.id ?? '';
  let selectedKeys = new Set<string>();

  const root = document.createElement('div');
  root.className = 'dubois-bookshelf-root';
  root.dataset['chartId'] = chartId;
  root.setAttribute('aria-label', options.ariaLabel ?? 'Archival table of contents');
  container.innerHTML = '';
  container.appendChild(root);

  function render(): void {
    root.innerHTML = '';

    // 1. Volume bookshelf rack
    if (data.volumes.length > 0) {
      const rack = document.createElement('div');
      rack.className = 'dubois-bookshelf-rack';

      for (const vol of data.volumes) {
        const isActive = vol.id === activeVolumeId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isActive
          ? 'dubois-bookshelf-spine is-active'
          : 'dubois-bookshelf-spine';
        btn.style.backgroundColor = vol.color;
        const isLight =
          vol.color.toUpperCase() === '#FFD700' ||
          vol.color.toUpperCase() === '#D2B48C' ||
          vol.color.toUpperCase() === '#EAE2D3' ||
          vol.color.toUpperCase() === '#F4EFE6';
        btn.style.color = isLight ? INK : PARCHMENT;

        const num = document.createElement('span');
        num.style.fontSize = '9px';
        num.style.opacity = '0.85';
        num.textContent = `VOL. ${vol.numeral}`;

        const title = document.createElement('span');
        title.style.fontWeight = '700';
        title.style.fontSize = '11px';
        title.textContent = vol.shortTitle.toUpperCase();

        btn.append(num, title);
        btn.addEventListener('click', () => {
          activeVolumeId = vol.id;
          options.onSelectVolume?.(vol.id);
          render();
        });
        rack.appendChild(btn);
      }
      root.appendChild(rack);

      const activeVol = data.volumes.find((v) => v.id === activeVolumeId);
      if (activeVol?.epigraph) {
        const epi = document.createElement('p');
        epi.className = 'dubois-bookshelf-epigraph';
        epi.textContent = activeVol.epigraph;
        root.appendChild(epi);
      }
    }

    // 2. Filtered endpaper plate cards
    const visibleItems = activeVolumeId
      ? data.items.filter((item) => item.volumeIds.includes(activeVolumeId))
      : data.items;

    const grid = document.createElement('div');
    grid.className = 'dubois-bookshelf-grid';

    for (const item of visibleItems) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = selectedKeys.has(item.id)
        ? 'dubois-bookshelf-card is-selected'
        : 'dubois-bookshelf-card';

      const head = document.createElement('div');
      head.className = 'dubois-bookshelf-card-head';
      const numEl = document.createElement('span');
      numEl.textContent = `PLATE ${item.numeral}`;
      head.appendChild(numEl);
      if (item.badge) {
        const b = document.createElement('span');
        b.className = 'dubois-bookshelf-card-badge';
        b.textContent = item.badge;
        head.appendChild(b);
      }

      const thumbSvg = d3
        .create('svg')
        .attr('class', 'dubois-bookshelf-thumb')
        .attr('aria-hidden', 'true');

      if (options.renderThumbnail) {
        options.renderThumbnail(thumbSvg, item);
      } else {
        drawBuiltInThumbnail(thumbSvg, item.thumbnail ?? 'columns');
      }

      const title = document.createElement('div');
      title.className = 'dubois-bookshelf-card-title';
      title.textContent = item.title;

      card.append(head, thumbSvg.node()!, title);

      if (item.note) {
        const note = document.createElement('div');
        note.className = 'dubois-bookshelf-card-note';
        note.textContent = item.note;
        card.appendChild(note);
      }

      card.addEventListener('click', () => {
        selectedKeys = new Set([item.id]);
        options.onSelectItem?.(item);
        render();
      });

      grid.appendChild(card);
    }

    root.appendChild(grid);
  }

  render();

  return {
    chartId,
    update(nextData: TocBookshelfData, nextOptions?: Partial<TocBookshelfOptions>): void {
      data = nextData;
      if (nextOptions) options = { ...options, ...nextOptions };
      if (!data.volumes.some((v) => v.id === activeVolumeId)) {
        activeVolumeId = data.volumes[0]?.id ?? '';
      }
      render();
    },
    resize: render,
    getSvgElement: () => null,
    setSelectedKeys(keys: readonly string[]): void {
      selectedKeys = new Set(keys);
      render();
    },
    setActiveVolume(volumeId: string): void {
      activeVolumeId = volumeId;
      render();
    },
    destroy(): void {
      root.remove();
    },
  };
}

export const TocBookshelfChart = {
  id: 'toc-bookshelf',
  mount: mountTocBookshelf,
} as const;
