import type { SelectableChart } from '../contracts/index.js';

export interface SelectionSnapshot<TKey extends string = string> {
  readonly selectedKeys: readonly TKey[];
  readonly hoveredKey: TKey | null;
}

export type SelectionListener<TKey extends string = string> = (
  snapshot: SelectionSnapshot<TKey>
) => void;

export interface SelectionBus<TKey extends string = string> {
  select(keys: readonly TKey[]): void;
  toggle(key: TKey, multi?: boolean): void;
  clear(): void;
  hover(key: TKey | null): void;
  getSnapshot(): SelectionSnapshot<TKey>;
  connect(chart: SelectableChart<TKey>): () => void;
  subscribe(listener: SelectionListener<TKey>): () => void;
}

/**
 * Headless pub/sub bus enabling click-to-focus and hover cross-highlighting
 * between any mix of charts (even across different chart archetypes).
 */
export function createSelectionBus<
  TKey extends string = string,
>(): SelectionBus<TKey> {
  let selectedKeys: readonly TKey[] = [];
  let hoveredKey: TKey | null = null;

  const charts = new Set<SelectableChart<TKey>>();
  const listeners = new Set<SelectionListener<TKey>>();

  function notify(): void {
    const snap: SelectionSnapshot<TKey> = { selectedKeys, hoveredKey };
    for (const chart of charts) {
      chart.setSelectedKeys(selectedKeys);
      chart.setHoveredKey?.(hoveredKey);
    }
    for (const listener of listeners) {
      listener(snap);
    }
  }

  return {
    select(keys: readonly TKey[]): void {
      selectedKeys = Array.from(new Set(keys));
      notify();
    },
    toggle(key: TKey, multi = false): void {
      const exists = selectedKeys.includes(key);
      if (multi) {
        selectedKeys = exists
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];
      } else {
        selectedKeys = exists && selectedKeys.length === 1 ? [] : [key];
      }
      notify();
    },
    clear(): void {
      if (selectedKeys.length === 0 && hoveredKey === null) return;
      selectedKeys = [];
      hoveredKey = null;
      notify();
    },
    hover(key: TKey | null): void {
      if (hoveredKey === key) return;
      hoveredKey = key;
      const snap: SelectionSnapshot<TKey> = { selectedKeys, hoveredKey };
      for (const chart of charts) {
        chart.setHoveredKey?.(hoveredKey);
      }
      for (const listener of listeners) {
        listener(snap);
      }
    },
    getSnapshot(): SelectionSnapshot<TKey> {
      return { selectedKeys, hoveredKey };
    },
    connect(chart: SelectableChart<TKey>): () => void {
      charts.add(chart);
      chart.setSelectedKeys(selectedKeys);
      chart.setHoveredKey?.(hoveredKey);
      return () => {
        charts.delete(chart);
      };
    },
    subscribe(listener: SelectionListener<TKey>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
