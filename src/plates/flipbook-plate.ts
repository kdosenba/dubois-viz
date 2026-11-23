import { asPlateId, type PlateId } from '../contracts/index.js';
import type { Destroyable } from './single-plate.js';

export interface FlipBookPageSpec {
  readonly id: string;
  readonly label: string;
  readonly render: (pageEl: HTMLElement) => Destroyable | void;
}

export interface FlipBookPlateOptions {
  readonly id?: PlateId;
  readonly pages: readonly FlipBookPageSpec[];
  readonly initialPage?: number;
  readonly keyboardNav?: boolean;
  readonly onPageChange?: (index: number, page: FlipBookPageSpec) => void;
}

export interface FlipBookPlateInstance {
  readonly plateId: PlateId;
  readonly element: HTMLElement;
  getPageIndex(): number;
  goToPage(index: number): void;
  nextPage(): void;
  prevPage(): void;
  destroy(): void;
}

/**
 * Multi-page archival companion view supporting 2..N arbitrary pages with crisp
 * matte-vellum page switching and ArrowLeft / ArrowRight keyboard navigation.
 */
export function createFlipBookPlate(
  container: HTMLElement,
  options: FlipBookPlateOptions
): FlipBookPlateInstance {
  const plateId =
    options.id ?? asPlateId(`flipbook-${Math.random().toString(36).slice(2, 8)}`);
  const cleanups: Destroyable[] = [];
  const pageCount = options.pages.length;

  let activeIndex = Math.max(
    0,
    Math.min(pageCount - 1, options.initialPage ?? 0)
  );

  const root = document.createElement('div');
  root.className = 'dubois-flipbook-stage';
  root.dataset['plateId'] = plateId;
  root.tabIndex = 0;

  const pageEls: HTMLElement[] = [];

  for (const spec of options.pages) {
    const pageEl = document.createElement('div');
    pageEl.className = 'dubois-flipbook-page';
    pageEl.dataset['pageId'] = spec.id;
    pageEl.style.display = 'none';
    root.appendChild(pageEl);
    pageEls.push(pageEl);
    const d = spec.render(pageEl);
    if (d) cleanups.push(d);
  }

  const nav = document.createElement('div');
  nav.className = 'dubois-flipbook-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'dubois-flipbook-btn';
  prevBtn.textContent = '‹ PREV';

  const status = document.createElement('span');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'dubois-flipbook-btn';
  nextBtn.textContent = 'NEXT ›';

  nav.append(prevBtn, status, nextBtn);
  if (pageCount > 1) {
    root.appendChild(nav);
  }
  container.appendChild(root);

  function goToPage(index: number): void {
    if (pageCount === 0) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    activeIndex = clamped;
    pageEls.forEach((el, i) => {
      el.style.display = i === activeIndex ? 'block' : 'none';
    });
    const currentSpec = options.pages[activeIndex];
    status.textContent = `${activeIndex + 1} / ${pageCount}${currentSpec ? ` · ${currentSpec.label}` : ''}`;
    prevBtn.disabled = activeIndex <= 0;
    nextBtn.disabled = activeIndex >= pageCount - 1;
    if (currentSpec) {
      options.onPageChange?.(activeIndex, currentSpec);
    }
  }

  prevBtn.addEventListener('click', () => goToPage(activeIndex - 1));
  nextBtn.addEventListener('click', () => goToPage(activeIndex + 1));

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (options.keyboardNav === false) return;
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      goToPage(activeIndex + 1);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      goToPage(activeIndex - 1);
    }
  };
  root.addEventListener('keydown', onKeyDown);

  goToPage(activeIndex);

  return {
    plateId,
    element: root,
    getPageIndex: () => activeIndex,
    goToPage,
    nextPage: () => goToPage(activeIndex + 1),
    prevPage: () => goToPage(activeIndex - 1),
    destroy(): void {
      root.removeEventListener('keydown', onKeyDown);
      for (const c of cleanups) c.destroy();
      cleanups.length = 0;
      root.remove();
    },
  };
}
