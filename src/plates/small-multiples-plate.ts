import {
  asPlateId,
  isPeerSyncableChart,
  isScalableChart,
  type PlateId,
} from '../contracts/index.js';
import {
  createPeerStateBus,
  createScaleGroup,
  type PeerStateBus,
  type ScaleGroup,
  type ScaleSyncMode,
} from '../sync/index.js';
import type { Destroyable } from './single-plate.js';

export type SmallMultiplesMode = 'single' | 'split' | 'compare' | 'atlas';

export interface SmallMultiplesItem<TData> {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly groupLabel?: string;
  readonly data: TData;
}

export interface SmallMultiplesCellContext<TData> {
  readonly item: SmallMultiplesItem<TData>;
  readonly index: number;
  readonly mode: SmallMultiplesMode;
  readonly externalLegendEl: HTMLElement | null;
}

export interface SmallMultiplesPlateOptions<TData> {
  readonly id?: PlateId;
  readonly numeral?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly mode?: SmallMultiplesMode;
  readonly scaleMode?: ScaleSyncMode;
  readonly items: readonly SmallMultiplesItem<TData>[];
  readonly maxColumns?: number;
  readonly renderHeaderLeft?: (host: HTMLElement) => Destroyable | void;
  readonly renderHeaderRight?: (host: HTMLElement) => Destroyable | void;
  readonly renderCell: (
    cellBody: HTMLElement,
    context: SmallMultiplesCellContext<TData>
  ) => unknown;
  readonly onSelectItem?: (item: SmallMultiplesItem<TData>) => void;
}

export interface SmallMultiplesPlateInstance<TData> {
  readonly plateId: PlateId;
  readonly element: HTMLElement;
  readonly scaleGroup: ScaleGroup;
  readonly peerStateBus: PeerStateBus<Record<string, unknown>>;
  setMode(mode: SmallMultiplesMode): void;
  setItems(items: readonly SmallMultiplesItem<TData>[]): void;
  setScaleMode(mode: ScaleSyncMode): void;
  destroy(): void;
}

function isDestroyable(value: unknown): value is Destroyable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'destroy' in value &&
    typeof (value as Partial<Destroyable>).destroy === 'function'
  );
}

/**
 * Unifies Combined/Split small multiples AND Focus/Compare/Atlas grids into
 * one chart-agnostic layout with automatic ScaleGroup and PeerStateBus sync.
 */
export function createSmallMultiplesPlate<TData>(
  container: HTMLElement,
  options: SmallMultiplesPlateOptions<TData>
): SmallMultiplesPlateInstance<TData> {
  const plateId =
    options.id ?? asPlateId(`multiples-${Math.random().toString(36).slice(2, 8)}`);
  const scaleGroup = createScaleGroup({ mode: options.scaleMode ?? 'global-max' });
  const peerStateBus = createPeerStateBus<Record<string, unknown>>();

  let currentMode: SmallMultiplesMode = options.mode ?? 'split';
  let currentItems: readonly SmallMultiplesItem<TData>[] = options.items;
  const headerCleanups: Destroyable[] = [];
  const cellCleanups: Destroyable[] = [];

  const root = document.createElement('article');
  root.className = 'dubois-plate';
  root.dataset['plateId'] = plateId;

  const header = document.createElement('header');
  header.className = 'dubois-plate-header';

  const leftHost = document.createElement('div');
  leftHost.className = 'dubois-plate-header-left';
  const centerHost = document.createElement('div');
  centerHost.className = 'dubois-plate-header-center';
  const rightHost = document.createElement('div');
  rightHost.className = 'dubois-plate-header-right';

  if (options.numeral) {
    const n = document.createElement('div');
    n.className = 'dubois-plate-numeral';
    n.textContent = options.numeral;
    centerHost.appendChild(n);
  }
  if (options.title) {
    const t = document.createElement('h2');
    t.className = 'dubois-plate-title';
    t.textContent = options.title;
    centerHost.appendChild(t);
  }
  if (options.subtitle) {
    const s = document.createElement('p');
    s.className = 'dubois-plate-subtitle';
    s.textContent = options.subtitle;
    centerHost.appendChild(s);
  }

  header.append(leftHost, centerHost, rightHost);

  const legendHost = document.createElement('div');
  legendHost.className = 'dubois-plate-legend-host';

  const grid = document.createElement('div');
  grid.className = 'dubois-multiples-grid';

  root.append(header, legendHost, grid);
  container.appendChild(root);

  if (options.renderHeaderLeft) {
    const d = options.renderHeaderLeft(leftHost);
    if (d) headerCleanups.push(d);
  }
  if (options.renderHeaderRight) {
    const corner = document.createElement('div');
    corner.className = 'dubois-corner-inset';
    rightHost.appendChild(corner);
    const d = options.renderHeaderRight(corner);
    if (d) headerCleanups.push(d);
  }

  function clearCells(): void {
    for (const c of cellCleanups) c.destroy();
    cellCleanups.length = 0;
    scaleGroup.clear();
    grid.innerHTML = '';
    legendHost.innerHTML = '';
  }

  function renderGrid(): void {
    clearCells();

    const visibleItems =
      currentMode === 'single' ? currentItems.slice(0, 1) : currentItems;
    const count = visibleItems.length;

    grid.className =
      currentMode === 'atlas'
        ? 'dubois-multiples-grid dubois-multiples-grid--atlas'
        : 'dubois-multiples-grid';

    if (currentMode === 'atlas') {
      grid.style.gridTemplateColumns = '';
      grid.style.gridTemplateRows = '';
    } else if (count <= 1) {
      grid.style.gridTemplateColumns = '1fr';
      grid.style.gridTemplateRows = '1fr';
    } else {
      const maxCols = options.maxColumns ?? (count <= 2 ? 2 : count <= 4 ? 2 : 3);
      const cols = Math.min(maxCols, count);
      const rows = Math.ceil(count / cols);
      grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      grid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    }

    let lastGroup: string | undefined;
    let groupParity = 0;

    visibleItems.forEach((item, index) => {
      if (currentMode === 'atlas' && item.groupLabel && item.groupLabel !== lastGroup) {
        lastGroup = item.groupLabel;
        groupParity += 1;
        const groupTile = document.createElement('div');
        groupTile.className =
          groupParity % 2 === 0
            ? 'dubois-atlas-group-tile dubois-atlas-group-tile--alt'
            : 'dubois-atlas-group-tile';
        const badge = document.createElement('span');
        badge.className = 'dubois-plate-numeral';
        badge.textContent = 'GROUP';
        const heading = document.createElement('div');
        heading.className = 'dubois-plate-title';
        heading.style.fontSize = '16px';
        heading.textContent = item.groupLabel;
        const groupCount = visibleItems.filter(
          (v) => v.groupLabel === item.groupLabel
        ).length;
        const meta = document.createElement('div');
        meta.className = 'dubois-multiples-cell-subtitle';
        meta.textContent = `${groupCount} ${groupCount === 1 ? 'ITEM' : 'ITEMS'}`;
        groupTile.append(badge, heading, meta);
        grid.appendChild(groupTile);
      }

      const cell = document.createElement('section');
      cell.className =
        currentMode === 'atlas' && groupParity % 2 === 0
          ? 'dubois-multiples-cell dubois-multiples-cell--alt'
          : 'dubois-multiples-cell';

      if (count >= 1 || currentMode === 'atlas') {
        const cellHeader = document.createElement('div');
        cellHeader.className = 'dubois-multiples-cell-header';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = options.onSelectItem
          ? 'dubois-multiples-cell-title dubois-multiples-cell-title--clickable'
          : 'dubois-multiples-cell-title';
        btn.textContent = item.title;
        if (options.onSelectItem) {
          btn.addEventListener('click', () => options.onSelectItem?.(item));
        }
        cellHeader.appendChild(btn);
        if (item.subtitle) {
          const sub = document.createElement('div');
          sub.className = 'dubois-multiples-cell-subtitle';
          sub.textContent = item.subtitle;
          cellHeader.appendChild(sub);
        }
        cell.appendChild(cellHeader);
      }

      const body = document.createElement('div');
      body.className = 'dubois-multiples-cell-body';
      cell.appendChild(body);
      grid.appendChild(cell);

      const mounted = options.renderCell(body, {
        item,
        index,
        mode: currentMode,
        externalLegendEl: index === 0 ? legendHost : null,
      });

      if (isScalableChart(mounted)) {
        scaleGroup.register(mounted);
      }
      if (isPeerSyncableChart(mounted)) {
        const unsub = peerStateBus.connect(mounted);
        cellCleanups.push({ destroy: unsub });
      }
      if (isDestroyable(mounted)) {
        cellCleanups.push(mounted);
      }
    });

    scaleGroup.sync();
  }

  renderGrid();

  return {
    plateId,
    element: root,
    scaleGroup,
    peerStateBus,
    setMode(mode: SmallMultiplesMode): void {
      currentMode = mode;
      renderGrid();
    },
    setItems(items: readonly SmallMultiplesItem<TData>[]): void {
      currentItems = items;
      renderGrid();
    },
    setScaleMode(mode: ScaleSyncMode): void {
      scaleGroup.setMode(mode);
    },
    destroy(): void {
      clearCells();
      for (const h of headerCleanups) h.destroy();
      headerCleanups.length = 0;
      root.remove();
    },
  };
}
