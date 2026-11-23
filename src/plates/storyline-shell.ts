import type { PlateId } from '../contracts/index.js';
import type { Destroyable } from './single-plate.js';

export interface StorylineSectionSpec {
  readonly id: PlateId;
  readonly render: (sectionEl: HTMLElement) => Destroyable | void;
}

export interface StorylineShellOptions {
  readonly sections: readonly StorylineSectionSpec[];
  readonly renderTopBar?: (barHost: HTMLElement) => Destroyable | void;
  readonly keyboardNav?: boolean;
  readonly onActiveChange?: (plateId: PlateId, index: number) => void;
}

export interface StorylineShellInstance {
  readonly element: HTMLElement;
  readonly viewportElement: HTMLElement;
  scrollToPlate(plateId: PlateId): void;
  scrollToIndex(index: number): void;
  getActiveIndex(): number;
  destroy(): void;
}

/**
 * Optional 100dvh scroll-snapping vertical exhibition shell with keyboard
 * navigation (ArrowUp/Down, PageUp/Down) and direct plate jump support.
 */
export function createStorylineShell(
  container: HTMLElement,
  options: StorylineShellOptions
): StorylineShellInstance {
  const cleanups: Destroyable[] = [];
  let activeIndex = 0;

  const shell = document.createElement('div');
  shell.className = 'dubois-storyline-shell';

  if (options.renderTopBar) {
    const barHost = document.createElement('div');
    shell.appendChild(barHost);
    const barHandle = options.renderTopBar(barHost);
    if (barHandle) cleanups.push(barHandle);
  }

  const viewport = document.createElement('main');
  viewport.className = 'dubois-storyline-viewport';

  const sectionMap = new Map<PlateId, { el: HTMLElement; index: number }>();
  const sectionEls: HTMLElement[] = [];

  options.sections.forEach((spec, index) => {
    const section = document.createElement('section');
    section.className = 'dubois-storyline-section';
    section.dataset['plateId'] = spec.id;
    viewport.appendChild(section);
    sectionMap.set(spec.id, { el: section, index });
    sectionEls.push(section);

    const handle = spec.render(section);
    if (handle) cleanups.push(handle);
  });

  shell.appendChild(viewport);
  container.appendChild(shell);

  function scrollToIndex(index: number): void {
    const clamped = Math.max(0, Math.min(sectionEls.length - 1, index));
    const el = sectionEls[clamped];
    if (!el) return;
    activeIndex = clamped;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const spec = options.sections[clamped];
    if (spec) options.onActiveChange?.(spec.id, clamped);
  }

  function scrollToPlate(plateId: PlateId): void {
    const found = sectionMap.get(plateId);
    if (found) scrollToIndex(found.index);
  }

  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = sectionEls.indexOf(entry.target as HTMLElement);
            if (idx >= 0 && idx !== activeIndex) {
              activeIndex = idx;
              const spec = options.sections[idx];
              if (spec) options.onActiveChange?.(spec.id, idx);
            }
          }
        }
      },
      { root: viewport, threshold: [0.55] }
    );
    for (const el of sectionEls) observer.observe(el);
  }

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (options.keyboardNav === false) return;
    const tag = (ev.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (ev.key === 'ArrowDown' || ev.key === 'PageDown') {
      ev.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (ev.key === 'ArrowUp' || ev.key === 'PageUp') {
      ev.preventDefault();
      scrollToIndex(activeIndex - 1);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  return {
    element: shell,
    viewportElement: viewport,
    scrollToPlate,
    scrollToIndex,
    getActiveIndex: () => activeIndex,
    destroy(): void {
      window.removeEventListener('keydown', onKeyDown);
      observer?.disconnect();
      for (const c of cleanups) c.destroy();
      cleanups.length = 0;
      shell.remove();
    },
  };
}
