export interface LegendGuideItem {
  readonly label: string;
  readonly description: string;
  readonly swatchColor?: string;
  readonly swatchShape?: 'square' | 'circle' | 'line' | 'dashed';
}

export interface LegendGuideSection {
  readonly heading?: string;
  readonly items: readonly LegendGuideItem[];
}

export interface LegendDrawerOptions {
  readonly title?: string;
  readonly sections?: readonly LegendGuideSection[];
  readonly renderContent?: (panelEl: HTMLElement) => void;
  readonly initialOpen?: boolean;
}

export interface LegendDrawerInstance {
  readonly element: HTMLElement;
  setOpen(open: boolean): void;
  destroy(): void;
}

/**
 * Collapsible archival "How to Read This Chart" reading guide drawer.
 */
export function createLegendDrawer(
  container: HTMLElement,
  options: LegendDrawerOptions
): LegendDrawerInstance {
  const root = document.createElement('div');
  root.className = 'dubois-legend-drawer';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dubois-legend-drawer-trigger';
  trigger.setAttribute('aria-expanded', String(Boolean(options.initialOpen)));

  const titleSpan = document.createElement('span');
  titleSpan.textContent = options.title ?? 'How to Read This Chart';
  const caret = document.createElement('span');
  caret.className = 'dubois-legend-drawer-caret';
  caret.textContent = '▾';
  trigger.append(titleSpan, caret);

  const panel = document.createElement('div');
  panel.className = 'dubois-legend-drawer-panel';

  if (options.renderContent) {
    options.renderContent(panel);
  } else if (options.sections) {
    for (const section of options.sections) {
      if (section.heading) {
        const h = document.createElement('div');
        h.style.fontFamily = 'var(--dubois-font-mono, monospace)';
        h.style.fontSize = '10px';
        h.style.fontWeight = '700';
        h.style.letterSpacing = '0.08em';
        h.style.textTransform = 'uppercase';
        h.style.margin = '6px 0 4px';
        h.textContent = section.heading;
        panel.appendChild(h);
      }
      const list = document.createElement('ul');
      list.style.margin = '0 0 8px';
      list.style.paddingLeft = '16px';
      for (const item of section.items) {
        const li = document.createElement('li');
        li.style.marginBottom = '4px';
        if (item.swatchColor) {
          const swatch = document.createElement('span');
          swatch.className =
            item.swatchShape === 'dashed'
              ? 'dubois-legend-swatch dubois-legend-swatch--dashed'
              : item.swatchShape === 'line'
                ? 'dubois-legend-swatch dubois-legend-swatch--line'
                : item.swatchShape === 'circle'
                  ? 'dubois-legend-swatch dubois-legend-swatch--dot'
                  : 'dubois-legend-swatch';
          if (item.swatchShape !== 'dashed') {
            swatch.style.backgroundColor = item.swatchColor;
          }
          swatch.style.marginRight = '6px';
          swatch.style.verticalAlign = 'middle';
          li.appendChild(swatch);
        }
        const strong = document.createElement('strong');
        strong.textContent = `${item.label}: `;
        li.append(strong, document.createTextNode(item.description));
        list.appendChild(li);
      }
      panel.appendChild(list);
    }
  }

  let isOpen = Boolean(options.initialOpen);
  const setOpen = (next: boolean): void => {
    isOpen = next;
    root.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
  };

  trigger.addEventListener('click', () => setOpen(!isOpen));

  const onDocClick = (ev: MouseEvent): void => {
    if (!isOpen) return;
    if (ev.target instanceof Node && !root.contains(ev.target)) {
      setOpen(false);
    }
  };
  document.addEventListener('mousedown', onDocClick);

  root.append(trigger, panel);
  container.appendChild(root);
  setOpen(isOpen);

  return {
    element: root,
    setOpen,
    destroy(): void {
      document.removeEventListener('mousedown', onDocClick);
      root.remove();
    },
  };
}
