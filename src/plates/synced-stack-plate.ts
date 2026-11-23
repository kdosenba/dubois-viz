import {
  asPlateId,
  isSelectableChart,
  isTimeWindowChart,
  type PlateId,
} from '../contracts/index.js';
import {
  createSelectionBus,
  createTimeWindowBus,
  type SelectionBus,
  type TimeWindowBus,
} from '../sync/index.js';
import type { Destroyable } from './single-plate.js';

export interface SyncedStackSectionContext<TKey extends string = string> {
  readonly timeWindowBus: TimeWindowBus;
  readonly selectionBus: SelectionBus<TKey>;
}

export interface SyncedStackSectionSpec<TKey extends string = string> {
  readonly id: string;
  readonly title?: string;
  /** Relative vertical flex weight (default: 1). */
  readonly weight?: number;
  readonly render: (
    host: HTMLElement,
    context: SyncedStackSectionContext<TKey>
  ) => unknown;
}

export interface SyncedStackPlateOptions<TKey extends string = string> {
  readonly id?: PlateId;
  readonly numeral?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly timeWindowBus?: TimeWindowBus;
  readonly selectionBus?: SelectionBus<TKey>;
  readonly sections: readonly SyncedStackSectionSpec<TKey>[];
}

export interface SyncedStackPlateInstance<TKey extends string = string> {
  readonly plateId: PlateId;
  readonly element: HTMLElement;
  readonly timeWindowBus: TimeWindowBus;
  readonly selectionBus: SelectionBus<TKey>;
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
 * Composes 2..N arbitrary time-aligned charts vertically with archival diamond
 * dividers, shared TimeWindowBus brush-zoom/pan, and shared SelectionBus focus.
 */
export function createSyncedStackPlate<TKey extends string = string>(
  container: HTMLElement,
  options: SyncedStackPlateOptions<TKey>
): SyncedStackPlateInstance<TKey> {
  const plateId =
    options.id ?? asPlateId(`stack-${Math.random().toString(36).slice(2, 8)}`);
  const timeWindowBus = options.timeWindowBus ?? createTimeWindowBus();
  const selectionBus = options.selectionBus ?? createSelectionBus<TKey>();
  const cleanups: Destroyable[] = [];

  const root = document.createElement('article');
  root.className = 'dubois-plate';
  root.dataset['plateId'] = plateId;

  if (options.numeral || options.title || options.subtitle) {
    const header = document.createElement('header');
    header.className = 'dubois-plate-header';
    const emptyLeft = document.createElement('div');
    const center = document.createElement('div');
    center.className = 'dubois-plate-header-center';
    const emptyRight = document.createElement('div');

    if (options.numeral) {
      const n = document.createElement('div');
      n.className = 'dubois-plate-numeral';
      n.textContent = options.numeral;
      center.appendChild(n);
    }
    if (options.title) {
      const h = document.createElement('h2');
      h.className = 'dubois-plate-title';
      h.textContent = options.title;
      center.appendChild(h);
    }
    if (options.subtitle) {
      const s = document.createElement('p');
      s.className = 'dubois-plate-subtitle';
      s.textContent = options.subtitle;
      center.appendChild(s);
    }
    header.append(emptyLeft, center, emptyRight);
    root.appendChild(header);
  }

  const stack = document.createElement('div');
  stack.className = 'dubois-stack-container';
  root.appendChild(stack);
  container.appendChild(root);

  options.sections.forEach((spec, idx) => {
    if (idx > 0) {
      const divider = document.createElement('div');
      divider.className = 'dubois-diamond-divider';
      divider.setAttribute('aria-hidden', 'true');
      const diamond = document.createElement('span');
      diamond.className = 'dubois-diamond-mark';
      divider.appendChild(diamond);
      stack.appendChild(divider);
    }

    const sec = document.createElement('section');
    sec.className = 'dubois-stack-section';
    sec.style.flex = `${spec.weight ?? 1} 1 0%`;
    sec.dataset['sectionId'] = spec.id;

    if (spec.title) {
      const heading = document.createElement('div');
      heading.className = 'dubois-stack-section-title';
      heading.textContent = spec.title;
      sec.appendChild(heading);
    }

    const body = document.createElement('div');
    body.className = 'dubois-stack-section-body';
    sec.appendChild(body);
    stack.appendChild(sec);

    const mounted = spec.render(body, { timeWindowBus, selectionBus });
    if (isTimeWindowChart(mounted)) {
      const unsub = timeWindowBus.connect(mounted);
      cleanups.push({ destroy: unsub });
    }
    if (isSelectableChart(mounted)) {
      const unsub = selectionBus.connect(mounted);
      cleanups.push({ destroy: unsub });
    }
    if (isDestroyable(mounted)) {
      cleanups.push(mounted);
    }
  });

  return {
    plateId,
    element: root,
    timeWindowBus,
    selectionBus,
    destroy(): void {
      for (const c of cleanups) c.destroy();
      cleanups.length = 0;
      root.remove();
    },
  };
}
