import type { TimeWindow, TimeWindowChart } from '../contracts/index.js';

export type TimeWindowListener = (window: TimeWindow | null) => void;

export interface TimeWindowBus {
  setWindow(window: TimeWindow | null, source?: TimeWindowChart): void;
  reset(source?: TimeWindowChart): void;
  getWindow(): TimeWindow | null;
  connect(chart: TimeWindowChart): () => void;
  subscribe(listener: TimeWindowListener): () => void;
}

function windowsEqual(a: TimeWindow | null, b: TimeWindow | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.startIndex === b.startIndex && a.endIndex === b.endIndex;
}

/**
 * Synchronizes discrete step-snapped brush-zoom and pan windows across any
 * vertically stacked or side-by-side time-indexed charts.
 */
export function createTimeWindowBus(): TimeWindowBus {
  let current: TimeWindow | null = null;
  let dispatching = false;

  const charts = new Set<TimeWindowChart>();
  const listeners = new Set<TimeWindowListener>();

  function setWindow(next: TimeWindow | null, source?: TimeWindowChart): void {
    const normalized: TimeWindow | null = next
      ? {
          startIndex: Math.max(0, Math.round(Math.min(next.startIndex, next.endIndex))),
          endIndex: Math.max(0, Math.round(Math.max(next.startIndex, next.endIndex))),
        }
      : null;

    if (windowsEqual(current, normalized)) return;
    current = normalized;

    if (dispatching) return;
    dispatching = true;
    try {
      for (const chart of charts) {
        if (chart !== source) {
          chart.setTimeWindow(current);
        }
      }
      for (const listener of listeners) {
        listener(current);
      }
    } finally {
      dispatching = false;
    }
  }

  return {
    setWindow,
    reset(source?: TimeWindowChart): void {
      setWindow(null, source);
    },
    getWindow(): TimeWindow | null {
      return current;
    },
    connect(chart: TimeWindowChart): () => void {
      charts.add(chart);
      if (current !== null) {
        chart.setTimeWindow(current);
      }
      return () => {
        charts.delete(chart);
      };
    },
    subscribe(listener: TimeWindowListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
