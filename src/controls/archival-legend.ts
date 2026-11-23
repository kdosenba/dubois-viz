import type { LegendItem } from '../contracts/index.js';

export interface ArchivalLegendOptions {
  readonly interactive?: boolean;
  readonly onToggle?: (itemId: string) => void;
}

export interface ArchivalLegendInstance {
  readonly element: HTMLElement;
  update(items: readonly LegendItem[]): void;
  destroy(): void;
}

/**
 * Standalone unified Du Bois top/bottom legend strip.
 */
export function createArchivalLegend(
  container: HTMLElement,
  initialItems: readonly LegendItem[],
  options: ArchivalLegendOptions = {}
): ArchivalLegendInstance {
  const strip = document.createElement('div');
  strip.className = 'dubois-legend-strip';
  strip.setAttribute('role', 'list');
  container.appendChild(strip);

  function render(items: readonly LegendItem[]): void {
    strip.innerHTML = '';
    for (const item of items) {
      const el = options.interactive
        ? document.createElement('button')
        : document.createElement('span');

      if (el instanceof HTMLButtonElement) {
        el.type = 'button';
      }

      const classes = ['dubois-legend-item'];
      if (options.interactive) classes.push('dubois-legend-item--interactive');
      if (item.active === false) classes.push('dubois-legend-item--inactive');
      if (item.active === true) classes.push('dubois-legend-item--active');
      el.className = classes.join(' ');
      el.setAttribute('role', 'listitem');

      const swatch = document.createElement('span');
      const kind = item.kind ?? 'swatch';
      swatch.className =
        kind === 'dashed'
          ? 'dubois-legend-swatch dubois-legend-swatch--dashed'
          : kind === 'line'
            ? 'dubois-legend-swatch dubois-legend-swatch--line'
            : kind === 'dot'
              ? 'dubois-legend-swatch dubois-legend-swatch--dot'
              : 'dubois-legend-swatch';

      if (kind !== 'dashed') {
        swatch.style.backgroundColor = item.color;
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      el.append(swatch, label);

      if (options.interactive && options.onToggle) {
        el.addEventListener('click', () => options.onToggle?.(item.id));
      }

      strip.appendChild(el);
    }
  }

  render(initialItems);

  return {
    element: strip,
    update: render,
    destroy(): void {
      strip.remove();
    },
  };
}
