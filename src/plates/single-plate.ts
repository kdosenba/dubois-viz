import type { PlateId } from '../contracts/index.js';
import { asPlateId } from '../contracts/index.js';

export interface Destroyable {
  destroy(): void;
}

export interface SinglePlateSlotContext {
  readonly externalLegendEl: HTMLElement;
}

export interface SinglePlateOptions {
  readonly id?: PlateId;
  readonly numeral?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly renderHeaderLeft?: (host: HTMLElement) => Destroyable | void;
  readonly renderHeaderRight?: (host: HTMLElement) => Destroyable | void;
  readonly renderMain: (
    stage: HTMLElement,
    context: SinglePlateSlotContext
  ) => Destroyable | void;
}

export interface SinglePlateInstance {
  readonly plateId: PlateId;
  readonly element: HTMLElement;
  readonly stageElement: HTMLElement;
  readonly legendHostElement: HTMLElement;
  setHeader(patch: {
    readonly numeral?: string;
    readonly title?: string;
    readonly subtitle?: string;
  }): void;
  destroy(): void;
}

/**
 * Open-parchment plate with optional left/right header slots (e.g. LegendDrawer
 * and corner sparkline), hoisted legend strip, and main chart mount stage.
 */
export function createSinglePlate(
  container: HTMLElement,
  options: SinglePlateOptions
): SinglePlateInstance {
  const plateId = options.id ?? asPlateId(`plate-${Math.random().toString(36).slice(2, 8)}`);
  const cleanups: Destroyable[] = [];

  const root = document.createElement('article');
  root.className = 'dubois-plate';
  root.dataset['plateId'] = plateId;

  const header = document.createElement('header');
  header.className = 'dubois-plate-header';

  const leftHost = document.createElement('div');
  leftHost.className = 'dubois-plate-header-left';

  const centerHost = document.createElement('div');
  centerHost.className = 'dubois-plate-header-center';

  const numeralEl = document.createElement('div');
  numeralEl.className = 'dubois-plate-numeral';
  const titleEl = document.createElement('h2');
  titleEl.className = 'dubois-plate-title';
  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'dubois-plate-subtitle';

  centerHost.append(numeralEl, titleEl, subtitleEl);

  const rightHost = document.createElement('div');
  rightHost.className = 'dubois-plate-header-right';

  header.append(leftHost, centerHost, rightHost);

  const legendHost = document.createElement('div');
  legendHost.className = 'dubois-plate-legend-host';

  const stage = document.createElement('div');
  stage.className = 'dubois-plate-stage';

  root.append(header, legendHost, stage);
  container.appendChild(root);

  function setHeader(patch: {
    readonly numeral?: string;
    readonly title?: string;
    readonly subtitle?: string;
  }): void {
    numeralEl.textContent = patch.numeral ?? '';
    numeralEl.style.display = patch.numeral ? 'block' : 'none';
    titleEl.textContent = patch.title ?? '';
    titleEl.style.display = patch.title ? 'block' : 'none';
    subtitleEl.textContent = patch.subtitle ?? '';
    subtitleEl.style.display = patch.subtitle ? 'block' : 'none';
  }

  setHeader({
    numeral: options.numeral,
    title: options.title,
    subtitle: options.subtitle,
  });

  if (options.renderHeaderLeft) {
    const res = options.renderHeaderLeft(leftHost);
    if (res) cleanups.push(res);
  }
  if (options.renderHeaderRight) {
    const corner = document.createElement('div');
    corner.className = 'dubois-corner-inset';
    rightHost.appendChild(corner);
    const res = options.renderHeaderRight(corner);
    if (res) cleanups.push(res);
  }

  const mainRes = options.renderMain(stage, { externalLegendEl: legendHost });
  if (mainRes) cleanups.push(mainRes);

  return {
    plateId,
    element: root,
    stageElement: stage,
    legendHostElement: legendHost,
    setHeader,
    destroy(): void {
      for (const c of cleanups) c.destroy();
      cleanups.length = 0;
      root.remove();
    },
  };
}
