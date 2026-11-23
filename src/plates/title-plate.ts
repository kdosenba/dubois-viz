import { asPlateId, type PlateId } from '../contracts/index.js';
import type { Destroyable } from './single-plate.js';

export interface TitlePlateOptions {
  readonly id?: PlateId;
  readonly kicker?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly renderBackground?: (bgHost: HTMLElement) => Destroyable | void;
}

export interface TitlePlateInstance {
  readonly plateId: PlateId;
  readonly element: HTMLElement;
  destroy(): void;
}

/**
 * Full-bleed exhibition cover plate pairing any background visualization
 * (map, radial-dynamo, radial-coil, columns) with Du Bois display typography.
 */
export function createTitlePlate(
  container: HTMLElement,
  options: TitlePlateOptions
): TitlePlateInstance {
  const plateId =
    options.id ?? asPlateId(`title-${Math.random().toString(36).slice(2, 8)}`);
  const root = document.createElement('article');
  root.className = 'dubois-title-plate';
  root.dataset['plateId'] = plateId;

  const bg = document.createElement('div');
  bg.className = 'dubois-title-plate-bg';

  const overlay = document.createElement('header');
  overlay.className = 'dubois-title-plate-overlay';

  if (options.kicker) {
    const k = document.createElement('div');
    k.className = 'dubois-title-plate-kicker';
    k.textContent = options.kicker;
    overlay.appendChild(k);
  }

  const h1 = document.createElement('h1');
  h1.className = 'dubois-title-plate-heading';
  h1.textContent = options.title;
  overlay.appendChild(h1);

  if (options.subtitle) {
    const p = document.createElement('p');
    p.className = 'dubois-title-plate-lead';
    p.textContent = options.subtitle;
    overlay.appendChild(p);
  }

  root.append(bg, overlay);
  container.appendChild(root);

  const bgHandle = options.renderBackground?.(bg);

  return {
    plateId,
    element: root,
    destroy(): void {
      if (bgHandle) bgHandle.destroy();
      root.remove();
    },
  };
}
