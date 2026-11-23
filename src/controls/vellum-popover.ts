export interface PopoverItem {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly meta?: string;
  readonly disabled?: boolean;
}

export interface VellumPopoverOptions {
  readonly title: string;
  readonly items: readonly PopoverItem[];
  readonly selectedIds?: readonly string[];
  readonly multiSelect?: boolean;
  readonly maxSelected?: number;
  readonly searchable?: boolean;
  readonly searchPlaceholder?: string;
  readonly onChange: (selectedIds: readonly string[]) => void;
}

export interface VellumPopoverInstance {
  open(anchorEl: HTMLElement): void;
  close(): void;
  toggle(anchorEl: HTMLElement): void;
  isOpen(): boolean;
  setItems(items: readonly PopoverItem[]): void;
  setSelected(ids: readonly string[]): void;
  destroy(): void;
}

/**
 * Floating searchable, optionally grouped single/multi-select archival popover tray.
 */
export function createVellumPopover(
  options: VellumPopoverOptions
): VellumPopoverInstance {
  let items: readonly PopoverItem[] = options.items;
  let selected = new Set<string>(options.selectedIds ?? []);
  let query = '';
  let openState = false;
  const multiSelect = options.multiSelect ?? true;
  const searchable = options.searchable ?? true;

  const root = document.createElement('div');
  root.className = 'dubois-popover';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', options.title);
  document.body.appendChild(root);

  const header = document.createElement('div');
  header.className = 'dubois-popover-header';
  const titleEl = document.createElement('span');
  titleEl.textContent = options.title;
  const actionsWrap = document.createElement('div');
  actionsWrap.style.display = 'inline-flex';
  actionsWrap.style.gap = '6px';

  if (multiSelect) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'dubois-popover-action-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      selected.clear();
      renderBody();
      options.onChange([]);
    });
    actionsWrap.appendChild(clearBtn);
  }

  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'dubois-popover-action-btn';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => close());
  actionsWrap.appendChild(doneBtn);
  header.append(titleEl, actionsWrap);
  root.appendChild(header);

  const chipsEl = document.createElement('div');
  chipsEl.className = 'dubois-popover-chips';
  root.appendChild(chipsEl);

  let searchInput: HTMLInputElement | null = null;
  if (searchable) {
    const searchRow = document.createElement('div');
    searchRow.className = 'dubois-popover-search-row';
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'dubois-popover-search';
    searchInput.placeholder = options.searchPlaceholder ?? 'Filter items…';
    searchInput.addEventListener('input', () => {
      query = searchInput?.value.trim().toLowerCase() ?? '';
      renderList();
    });
    searchRow.appendChild(searchInput);
    root.appendChild(searchRow);
  }

  const listEl = document.createElement('div');
  listEl.className = 'dubois-popover-list';
  root.appendChild(listEl);

  function renderChips(): void {
    chipsEl.innerHTML = '';
    if (!multiSelect || selected.size === 0) {
      chipsEl.style.display = 'none';
      return;
    }
    chipsEl.style.display = 'flex';
    const byId = new Map(items.map((item) => [item.id, item]));
    for (const id of selected) {
      const item = byId.get(id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'dubois-popover-chip';
      chip.textContent = `${item?.label ?? id} ×`;
      chip.addEventListener('click', () => {
        selected.delete(id);
        renderBody();
        options.onChange(Array.from(selected));
      });
      chipsEl.appendChild(chip);
    }
  }

  function renderList(): void {
    listEl.innerHTML = '';
    const filtered = query
      ? items.filter(
          (i) =>
            i.label.toLowerCase().includes(query) ||
            (i.group?.toLowerCase().includes(query) ?? false)
        )
      : items;

    const groups = new Map<string, PopoverItem[]>();
    for (const item of filtered) {
      const g = item.group ?? '';
      const arr = groups.get(g) ?? [];
      arr.push(item);
      groups.set(g, arr);
    }

    const atCap =
      multiSelect &&
      typeof options.maxSelected === 'number' &&
      selected.size >= options.maxSelected;

    for (const [groupName, groupItems] of groups) {
      if (groupName) {
        const heading = document.createElement('div');
        heading.className = 'dubois-popover-group-heading';
        heading.textContent = groupName;
        listEl.appendChild(heading);
      }
      for (const item of groupItems) {
        const isSel = selected.has(item.id);
        const isDisabled = Boolean(item.disabled) || (!isSel && atCap);
        const row = document.createElement('div');
        row.className = [
          'dubois-popover-row',
          isSel ? 'is-selected' : '',
          isDisabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(isSel));

        const labelSpan = document.createElement('span');
        labelSpan.textContent = isSel ? `■ ${item.label}` : `□ ${item.label}`;
        row.appendChild(labelSpan);

        if (item.meta) {
          const metaSpan = document.createElement('span');
          metaSpan.className = 'dubois-popover-meta';
          metaSpan.textContent = item.meta;
          row.appendChild(metaSpan);
        }

        row.addEventListener('click', () => {
          if (isDisabled) return;
          if (!multiSelect) {
            selected = new Set([item.id]);
            renderBody();
            options.onChange(Array.from(selected));
            close();
            return;
          }
          if (selected.has(item.id)) {
            selected.delete(item.id);
          } else {
            selected.add(item.id);
          }
          renderBody();
          options.onChange(Array.from(selected));
        });

        listEl.appendChild(row);
      }
    }
  }

  function renderBody(): void {
    renderChips();
    renderList();
  }

  function onDocumentPointerDown(ev: MouseEvent): void {
    if (!openState) return;
    const target = ev.target;
    if (target instanceof Node && !root.contains(target)) {
      close();
    }
  }

  function onDocumentKeyDown(ev: KeyboardEvent): void {
    if (openState && ev.key === 'Escape') {
      close();
    }
  }

  function open(anchorEl: HTMLElement): void {
    renderBody();
    const rect = anchorEl.getBoundingClientRect();
    const width = Math.min(400, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = Math.min(rect.bottom + 4, window.innerHeight - 120);
    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.classList.add('is-open');
    openState = true;
    searchInput?.focus();
    window.setTimeout(() => {
      document.addEventListener('mousedown', onDocumentPointerDown);
      document.addEventListener('keydown', onDocumentKeyDown);
    }, 0);
  }

  function close(): void {
    if (!openState) return;
    openState = false;
    root.classList.remove('is-open');
    document.removeEventListener('mousedown', onDocumentPointerDown);
    document.removeEventListener('keydown', onDocumentKeyDown);
  }

  return {
    open,
    close,
    toggle(anchorEl: HTMLElement): void {
      if (openState) close();
      else open(anchorEl);
    },
    isOpen(): boolean {
      return openState;
    },
    setItems(nextItems: readonly PopoverItem[]): void {
      items = nextItems;
      if (openState) renderBody();
    },
    setSelected(ids: readonly string[]): void {
      selected = new Set(ids);
      if (openState) renderBody();
    },
    destroy(): void {
      close();
      root.remove();
    },
  };
}
