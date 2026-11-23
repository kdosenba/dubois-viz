/**
 * Structural TypeScript contracts for dubois-viz.
 *
 * IMPORTANT: Never import this module from `src/charts/*.ts`.
 * Charts in `src/charts/` remain 100% self-contained (importing only `'d3'`)
 * and satisfy these interfaces structurally via TypeScript duck typing.
 */

export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type ChartId = Brand<string, 'ChartId'>;
export type PlateId = Brand<string, 'PlateId'>;
export type SeriesId = Brand<string, 'SeriesId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type StepId = Brand<string, 'StepId'>;
export type TierId = Brand<string, 'TierId'>;
export type PanelId = Brand<string, 'PanelId'>;
export type VolumeId = Brand<string, 'VolumeId'>;
export type NodeId = Brand<string, 'NodeId'>;
export type BusId = Brand<string, 'BusId'>;

export const asChartId = (id: string): ChartId => id as ChartId;
export const asPlateId = (id: string): PlateId => id as PlateId;
export const asSeriesId = (id: string): SeriesId => id as SeriesId;
export const asItemId = (id: string): ItemId => id as ItemId;
export const asGroupId = (id: string): GroupId => id as GroupId;
export const asStepId = (id: string): StepId => id as StepId;
export const asTierId = (id: string): TierId => id as TierId;
export const asPanelId = (id: string): PanelId => id as PanelId;
export const asVolumeId = (id: string): VolumeId => id as VolumeId;
export const asNodeId = (id: string): NodeId => id as NodeId;
export const asBusId = (id: string): BusId => id as BusId;

export type ResponsiveSizeTier = 'expanded' | 'compact' | 'micro';

export interface ScaleDomain {
  readonly min: number;
  readonly max: number;
}

export interface TimeWindow {
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface LegendItem {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly kind?: 'swatch' | 'dashed' | 'line' | 'dot';
  readonly active?: boolean;
}

export interface TooltipRow {
  readonly label: string;
  readonly value: string;
}

export interface TooltipSpec {
  readonly title: string;
  readonly swatchColor?: string;
  readonly rows: readonly TooltipRow[];
}

export interface CommonChartOptions<TDatum = unknown> {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly sizeTierOverride?: ResponsiveSizeTier;
  readonly showLegend?: boolean;
  readonly externalLegendEl?: HTMLElement | null;
  readonly showTooltip?: boolean;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (datum: TDatum) => TooltipSpec | null;
  readonly palette?: readonly string[];
  readonly colorMap?: Readonly<Record<string, string>>;
}

/** Minimal lifecycle contract structurally implemented by every chart in src/charts/. */
export interface DuBoisChartInstance<TData, TOptions = Record<string, unknown>> {
  readonly chartId: string;
  update(data: TData, options?: Partial<TOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  destroy(): void;
}

/** Optional capability: numeric scale synchronization across small multiples / grids. */
export interface ScalableChart {
  getNaturalDomain(): ScaleDomain;
  getEffectiveDomain(): ScaleDomain;
  setDomain(domain: ScaleDomain | null): void;
  getNaturalPanelDomains?(): ReadonlyMap<string, ScaleDomain>;
  setPanelDomains?(domains: ReadonlyMap<string, ScaleDomain> | null): void;
}

/** Optional capability: 2D geometric zoom & pan (e.g. map, radial-dynamo). */
export interface ZoomableChart<TZoom = { readonly scale: number }> {
  getZoomState(): TZoom;
  setZoomState(state: TZoom | null): void;
  resetZoom(): void;
}

/** Optional capability: discrete step-snapped time window sync (columns, stacked-area, sparkline). */
export interface TimeWindowChart {
  getTimeWindow(): TimeWindow | null;
  setTimeWindow(window: TimeWindow | null): void;
  getStepCount(): number;
}

/** Optional capability: cross-chart highlight & selection coordination. */
export interface SelectableChart<TKey extends string = string> {
  setSelectedKeys(keys: readonly TKey[]): void;
  setHoveredKey?(key: TKey | null): void;
}

/** Optional capability: peer UI state sync across small-multiples (e.g. active highlight/mode). */
export interface PeerSyncableChart<TState = Record<string, unknown>> {
  getSharedState(): TState;
  applySharedState(state: Partial<TState>): void;
}

/** Factory descriptor accepted by pluggable plate layouts. */
export interface ChartDescriptor<
  TData,
  TOptions = Record<string, unknown>,
  TInstance extends DuBoisChartInstance<TData, TOptions> = DuBoisChartInstance<TData, TOptions>,
> {
  readonly id: string;
  mount(container: HTMLElement, data: TData, options?: TOptions): TInstance;
}

export function isScalableChart(chart: unknown): chart is ScalableChart {
  if (typeof chart !== 'object' || chart === null) return false;
  const candidate = chart as Partial<ScalableChart>;
  return (
    typeof candidate.getNaturalDomain === 'function' &&
    typeof candidate.getEffectiveDomain === 'function' &&
    typeof candidate.setDomain === 'function'
  );
}

export function isTimeWindowChart(chart: unknown): chart is TimeWindowChart {
  if (typeof chart !== 'object' || chart === null) return false;
  const candidate = chart as Partial<TimeWindowChart>;
  return (
    typeof candidate.getTimeWindow === 'function' &&
    typeof candidate.setTimeWindow === 'function' &&
    typeof candidate.getStepCount === 'function'
  );
}

export function isSelectableChart(chart: unknown): chart is SelectableChart {
  if (typeof chart !== 'object' || chart === null) return false;
  const candidate = chart as Partial<SelectableChart>;
  return typeof candidate.setSelectedKeys === 'function';
}

export function isPeerSyncableChart(chart: unknown): chart is PeerSyncableChart {
  if (typeof chart !== 'object' || chart === null) return false;
  const candidate = chart as Partial<PeerSyncableChart>;
  return (
    typeof candidate.getSharedState === 'function' &&
    typeof candidate.applySharedState === 'function'
  );
}
