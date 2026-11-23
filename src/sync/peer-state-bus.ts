import type { PeerSyncableChart } from '../contracts/index.js';

export type PeerStateListener<TState extends Record<string, unknown>> = (
  state: Readonly<Partial<TState>>
) => void;

export interface PeerStateBus<TState extends Record<string, unknown>> {
  connect(chart: PeerSyncableChart<TState>): () => void;
  broadcast(patch: Partial<TState>, source?: PeerSyncableChart<TState>): void;
  getState(): Readonly<Partial<TState>>;
  subscribe(listener: PeerStateListener<TState>): () => void;
}

/**
 * Synchronizes interactive UI toggles (such as active highlight layer,
 * expanded tree branches, or metric mode) across peer charts in small multiples.
 */
export function createPeerStateBus<
  TState extends Record<string, unknown>,
>(initialState: Partial<TState> = {}): PeerStateBus<TState> {
  let state: Partial<TState> = { ...initialState };
  let dispatching = false;

  const peers = new Set<PeerSyncableChart<TState>>();
  const listeners = new Set<PeerStateListener<TState>>();

  function broadcast(
    patch: Partial<TState>,
    source?: PeerSyncableChart<TState>
  ): void {
    state = { ...state, ...patch };
    if (dispatching) return;
    dispatching = true;
    try {
      for (const peer of peers) {
        if (peer !== source) {
          peer.applySharedState(patch);
        }
      }
      for (const listener of listeners) {
        listener(state);
      }
    } finally {
      dispatching = false;
    }
  }

  return {
    connect(chart: PeerSyncableChart<TState>): () => void {
      peers.add(chart);
      if (Object.keys(state).length > 0) {
        chart.applySharedState(state);
      }
      return () => {
        peers.delete(chart);
      };
    },
    broadcast,
    getState(): Readonly<Partial<TState>> {
      return state;
    },
    subscribe(listener: PeerStateListener<TState>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
