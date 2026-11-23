export interface WhisperOption {
  readonly value: string;
  readonly label: string;
}

export interface WhisperSelectSlot {
  readonly kind: 'select';
  readonly id: string;
  readonly label: string;
  readonly options: readonly WhisperOption[];
  readonly value: string;
  readonly pushRight?: boolean;
  readonly onChange: (value: string) => void;
}

export interface WhisperSegmentedSlot {
  readonly kind: 'segmented';
  readonly id: string;
  readonly label?: string;
  readonly options: readonly WhisperOption[];
  readonly value: string;
  readonly pushRight?: boolean;
  readonly onChange: (value: string) => void;
}

export interface WhisperTriggerSlot {
  readonly kind: 'trigger';
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly pushRight?: boolean;
  readonly onClick: (anchorEl: HTMLButtonElement) => void;
}

export interface WhisperZoomSlot {
  readonly kind: 'zoom';
  readonly id: string;
  readonly label?: string;
  readonly presets: readonly number[];
  readonly value: number;
  readonly pushRight?: boolean;
  readonly onChange: (scale: number) => void;
}

export interface WhisperButtonSlot {
  readonly kind: 'button';
  readonly id: string;
  readonly label: string;
  readonly pushRight?: boolean;
  readonly onClick: (buttonEl: HTMLButtonElement) => void;
}

export interface WhisperSeparatorSlot {
  readonly kind: 'separator';
  readonly id?: string;
}

export interface WhisperCustomSlot {
  readonly kind: 'custom';
  readonly id: string;
  readonly pushRight?: boolean;
  readonly render: (host: HTMLElement) => void;
}

export type WhisperBarSlot =
  | WhisperSelectSlot
  | WhisperSegmentedSlot
  | WhisperTriggerSlot
  | WhisperZoomSlot
  | WhisperButtonSlot
  | WhisperSeparatorSlot
  | WhisperCustomSlot;

export interface WhisperBarInstance {
  readonly element: HTMLElement;
  setSlots(slots: readonly WhisperBarSlot[]): void;
  updateSummary(slotId: string, summary: string): void;
  updateValue(slotId: string, value: string | number): void;
  destroy(): void;
}

/**
 * Composable 32px Top Whisper Bar strip with zero domain hardcoding.
 */
export function createWhisperBar(
  container: HTMLElement,
  initialSlots: readonly WhisperBarSlot[]
): WhisperBarInstance {
  const bar = document.createElement('nav');
  bar.className = 'dubois-whisper-bar';
  bar.setAttribute('aria-label', 'Visualization controls');
  container.appendChild(bar);

  let currentSlots: readonly WhisperBarSlot[] = initialSlots;
  const triggerValues = new Map<string, HTMLElement>();
  const selectEls = new Map<string, HTMLSelectElement>();
  const segmentedBtns = new Map<string, Map<string, HTMLButtonElement>>();

  function render(slots: readonly WhisperBarSlot[]): void {
    currentSlots = slots;
    bar.innerHTML = '';
    triggerValues.clear();
    selectEls.clear();
    segmentedBtns.clear();

    for (const slot of slots) {
      if (slot.kind === 'separator') {
        const sep = document.createElement('span');
        sep.className = 'dubois-whisper-sep';
        sep.setAttribute('aria-hidden', 'true');
        bar.appendChild(sep);
        continue;
      }

      const wrap = document.createElement('div');
      wrap.className = slot.pushRight
        ? 'dubois-whisper-slot dubois-whisper-slot--push-right'
        : 'dubois-whisper-slot';
      wrap.dataset['slotId'] = slot.id;

      if (slot.kind === 'select') {
        const key = document.createElement('span');
        key.className = 'dubois-whisper-key';
        key.textContent = `${slot.label}:`;
        const select = document.createElement('select');
        select.className = 'dubois-whisper-select';
        select.setAttribute('aria-label', slot.label);
        for (const opt of slot.options) {
          const el = document.createElement('option');
          el.value = opt.value;
          el.textContent = opt.label;
          if (opt.value === slot.value) el.selected = true;
          select.appendChild(el);
        }
        select.addEventListener('change', () => slot.onChange(select.value));
        selectEls.set(slot.id, select);
        wrap.append(key, select);
      } else if (slot.kind === 'segmented') {
        if (slot.label) {
          const key = document.createElement('span');
          key.className = 'dubois-whisper-key';
          key.textContent = `${slot.label}:`;
          wrap.appendChild(key);
        }
        const group = document.createElement('div');
        group.className = 'dubois-segmented-toggle';
        group.setAttribute('role', 'group');
        const map = new Map<string, HTMLButtonElement>();
        for (const opt of slot.options) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className =
            opt.value === slot.value
              ? 'dubois-segmented-btn is-active'
              : 'dubois-segmented-btn';
          btn.textContent = opt.label;
          btn.addEventListener('click', () => {
            for (const [val, b] of map) {
              b.classList.toggle('is-active', val === opt.value);
            }
            slot.onChange(opt.value);
          });
          map.set(opt.value, btn);
          group.appendChild(btn);
        }
        segmentedBtns.set(slot.id, map);
        wrap.appendChild(group);
      } else if (slot.kind === 'trigger') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dubois-whisper-trigger';
        const key = document.createElement('span');
        key.className = 'dubois-whisper-key';
        key.textContent = `${slot.label}:`;
        const val = document.createElement('span');
        val.textContent = `${slot.summary} ▾`;
        triggerValues.set(slot.id, val);
        btn.append(key, val);
        btn.addEventListener('click', () => slot.onClick(btn));
        wrap.appendChild(btn);
      } else if (slot.kind === 'zoom') {
        const key = document.createElement('span');
        key.className = 'dubois-whisper-key';
        key.textContent = `${slot.label ?? 'ZOOM'}:`;
        const group = document.createElement('div');
        group.className = 'dubois-segmented-toggle';
        const map = new Map<string, HTMLButtonElement>();
        for (const preset of slot.presets) {
          const btn = document.createElement('button');
          btn.type = 'button';
          const keyStr = String(preset);
          btn.className =
            Math.abs(preset - slot.value) < 0.01
              ? 'dubois-segmented-btn is-active'
              : 'dubois-segmented-btn';
          btn.textContent = `${preset}×`;
          btn.addEventListener('click', () => {
            for (const [val, b] of map) {
              b.classList.toggle('is-active', val === keyStr);
            }
            slot.onChange(preset);
          });
          map.set(keyStr, btn);
          group.appendChild(btn);
        }
        segmentedBtns.set(slot.id, map);
        wrap.append(key, group);
      } else if (slot.kind === 'button') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dubois-whisper-trigger';
        btn.textContent = slot.label;
        btn.addEventListener('click', () => slot.onClick(btn));
        wrap.appendChild(btn);
      } else if (slot.kind === 'custom') {
        slot.render(wrap);
      }

      bar.appendChild(wrap);
    }
  }

  render(currentSlots);

  return {
    element: bar,
    setSlots: render,
    updateSummary(slotId: string, summary: string): void {
      const el = triggerValues.get(slotId);
      if (el) el.textContent = `${summary} ▾`;
    },
    updateValue(slotId: string, value: string | number): void {
      const strVal = String(value);
      const sel = selectEls.get(slotId);
      if (sel) sel.value = strVal;
      const seg = segmentedBtns.get(slotId);
      if (seg) {
        for (const [k, btn] of seg) {
          btn.classList.toggle('is-active', k === strVal);
        }
      }
    },
    destroy(): void {
      bar.remove();
    },
  };
}
