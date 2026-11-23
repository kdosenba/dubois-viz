import type { ScalableChart, ScaleDomain } from '../contracts/index.js';

export type ScaleSyncMode =
  | 'global-max'
  | 'shared-extent'
  | 'per-panel'
  | 'independent';

export interface ScaleGroupOptions {
  readonly mode?: ScaleSyncMode;
}

export interface ScaleGroup {
  register(chart: ScalableChart): () => void;
  unregister(chart: ScalableChart): void;
  setMode(mode: ScaleSyncMode): void;
  getMode(): ScaleSyncMode;
  sync(): void;
  clear(): void;
}

/**
 * Coordinates numeric scale domains across any collection of ScalableChart instances
 * (same archetype or mixed archetypes) for small-multiples, compare grids, and atlases.
 */
export function createScaleGroup(options: ScaleGroupOptions = {}): ScaleGroup {
  const charts = new Set<ScalableChart>();
  let mode: ScaleSyncMode = options.mode ?? 'global-max';

  function sync(): void {
    if (charts.size === 0) return;

    if (mode === 'independent') {
      for (const chart of charts) {
        chart.setPanelDomains?.(null);
        chart.setDomain(null);
      }
      return;
    }

    if (mode === 'per-panel') {
      const mergedPanels = new Map<string, { min: number; max: number }>();
      let globalMax = 0;

      for (const chart of charts) {
        const panelDomains = chart.getNaturalPanelDomains?.();
        if (panelDomains && panelDomains.size > 0) {
          for (const [key, dom] of panelDomains) {
            const cur = mergedPanels.get(key);
            if (!cur) {
              mergedPanels.set(key, { min: dom.min, max: dom.max });
            } else {
              cur.min = Math.min(cur.min, dom.min);
              cur.max = Math.max(cur.max, dom.max);
            }
          }
        } else {
          const nat = chart.getNaturalDomain();
          if (Number.isFinite(nat.max)) {
            globalMax = Math.max(globalMax, nat.max);
          }
        }
      }

      const readonlyPanels: ReadonlyMap<string, ScaleDomain> = mergedPanels;
      for (const chart of charts) {
        if (chart.setPanelDomains && mergedPanels.size > 0) {
          chart.setPanelDomains(readonlyPanels);
        } else if (globalMax > 0) {
          chart.setDomain({ min: 0, max: globalMax });
        }
      }
      return;
    }

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const chart of charts) {
      const nat = chart.getNaturalDomain();
      if (Number.isFinite(nat.min)) minVal = Math.min(minVal, nat.min);
      if (Number.isFinite(nat.max)) maxVal = Math.max(maxVal, nat.max);
    }

    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      for (const chart of charts) chart.setDomain(null);
      return;
    }

    const domain: ScaleDomain =
      mode === 'global-max'
        ? { min: Math.min(0, minVal), max: Math.max(0, maxVal) }
        : { min: minVal, max: maxVal };

    for (const chart of charts) {
      chart.setPanelDomains?.(null);
      chart.setDomain(domain);
    }
  }

  return {
    register(chart: ScalableChart): () => void {
      charts.add(chart);
      sync();
      return () => {
        charts.delete(chart);
        sync();
      };
    },
    unregister(chart: ScalableChart): void {
      charts.delete(chart);
      sync();
    },
    setMode(nextMode: ScaleSyncMode): void {
      mode = nextMode;
      sync();
    },
    getMode(): ScaleSyncMode {
      return mode;
    },
    sync,
    clear(): void {
      charts.clear();
    },
  };
}
