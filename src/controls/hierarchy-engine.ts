/**
 * Domain-agnostic N-level tree taxonomy filter, split, rank, and sort engine.
 * Works on any TypeScript row shape via typed accessor functions.
 */

export type SortDirection = 'desc' | 'asc';
export type RankingScope = 'across_selection' | 'per_selected_node';

export interface HierarchyLevelSpec<TLevel extends string, TRow extends object> {
  readonly level: TLevel;
  readonly label: string;
  readonly getValue: (row: TRow) => string | null | undefined;
}

export interface HierarchySchema<TLevel extends string, TRow extends object> {
  readonly levels: readonly HierarchyLevelSpec<TLevel, TRow>[];
}

export interface HierarchyQuery<TLevel extends string, TRow extends object> {
  readonly filterLevel?: TLevel;
  readonly selectedNodes?: readonly string[];
  readonly splitLevel?: TLevel | 'combined';
  readonly rankingScope?: RankingScope;
  readonly limit?: number;
  readonly perParentLimit?: number;
  readonly sortDirection?: SortDirection;
  readonly getMetric?: (row: TRow) => number;
}

export interface HierarchyBucket<TRow extends object> {
  readonly key: string;
  readonly label: string;
  readonly parentKey?: string;
  readonly metricTotal: number;
  readonly rows: readonly TRow[];
}

export interface HierarchyNodeSummary {
  readonly id: string;
  readonly label: string;
  readonly parentLabel?: string;
  readonly count: number;
  readonly metricTotal: number;
}

function getLevelIndex<TLevel extends string, TRow extends object>(
  schema: HierarchySchema<TLevel, TRow>,
  level: TLevel
): number {
  return schema.levels.findIndex((spec) => spec.level === level);
}

function normalizeNodeValue(val: string | null | undefined): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function listNodesAtLevel<TLevel extends string, TRow extends object>(
  rows: readonly TRow[],
  schema: HierarchySchema<TLevel, TRow>,
  level: TLevel,
  getMetric?: (row: TRow) => number
): readonly HierarchyNodeSummary[] {
  const idx = getLevelIndex(schema, level);
  if (idx < 0) return [];
  const spec = schema.levels[idx];
  const parentSpec = idx > 0 ? schema.levels[idx - 1] : undefined;
  if (!spec) return [];

  const map = new Map<
    string,
    { parentLabel?: string; count: number; metricTotal: number }
  >();

  for (const row of rows) {
    const val = normalizeNodeValue(spec.getValue(row));
    if (!val) continue;
    const parentVal = parentSpec
      ? normalizeNodeValue(parentSpec.getValue(row)) ?? undefined
      : undefined;
    const metric = getMetric ? getMetric(row) : 1;
    const existing = map.get(val);
    if (!existing) {
      map.set(val, {
        parentLabel: parentVal,
        count: 1,
        metricTotal: Number.isFinite(metric) ? metric : 0,
      });
    } else {
      existing.count += 1;
      existing.metricTotal += Number.isFinite(metric) ? metric : 0;
    }
  }

  return Array.from(map.entries())
    .map(([id, info]) => ({
      id,
      label: id,
      parentLabel: info.parentLabel,
      count: info.count,
      metricTotal: info.metricTotal,
    }))
    .sort((a, b) => b.metricTotal - a.metricTotal || a.label.localeCompare(b.label));
}

export function filterRowsByHierarchy<TLevel extends string, TRow extends object>(
  rows: readonly TRow[],
  schema: HierarchySchema<TLevel, TRow>,
  filterLevel?: TLevel,
  selectedNodes?: readonly string[]
): readonly TRow[] {
  if (!filterLevel || !selectedNodes || selectedNodes.length === 0) {
    return rows;
  }
  const idx = getLevelIndex(schema, filterLevel);
  if (idx < 0) return rows;
  const spec = schema.levels[idx];
  if (!spec) return rows;

  const allowed = new Set(selectedNodes);
  return rows.filter((row) => {
    const val = normalizeNodeValue(spec.getValue(row));
    return val !== null && allowed.has(val);
  });
}

export function executeHierarchyQuery<TLevel extends string, TRow extends object>(
  rows: readonly TRow[],
  schema: HierarchySchema<TLevel, TRow>,
  query: HierarchyQuery<TLevel, TRow>
): readonly HierarchyBucket<TRow>[] {
  const filtered = filterRowsByHierarchy(
    rows,
    schema,
    query.filterLevel,
    query.selectedNodes
  );

  const getMetric = query.getMetric ?? (() => 1);
  const sortDirection = query.sortDirection ?? 'desc';
  const compare = (a: HierarchyBucket<TRow>, b: HierarchyBucket<TRow>): number => {
    const diff =
      sortDirection === 'desc'
        ? b.metricTotal - a.metricTotal
        : a.metricTotal - b.metricTotal;
    return diff !== 0 ? diff : a.label.localeCompare(b.label);
  };

  if (!query.splitLevel || query.splitLevel === 'combined') {
    let total = 0;
    for (const r of filtered) {
      const m = getMetric(r);
      if (Number.isFinite(m)) total += m;
    }
    const label =
      query.selectedNodes && query.selectedNodes.length === 1
        ? query.selectedNodes[0] ?? 'All'
        : query.selectedNodes && query.selectedNodes.length > 1
          ? `${query.selectedNodes.length} Selected`
          : 'Combined';
    return [{ key: 'combined', label, metricTotal: total, rows: filtered }];
  }

  const splitIdx = getLevelIndex(schema, query.splitLevel);
  if (splitIdx < 0) return [];
  const splitSpec = schema.levels[splitIdx];
  if (!splitSpec) return [];

  const filterIdx = query.filterLevel
    ? getLevelIndex(schema, query.filterLevel)
    : -1;
  const parentSpec =
    filterIdx >= 0 && filterIdx < splitIdx ? schema.levels[filterIdx] : undefined;

  const grouped = new Map<
    string,
    { label: string; parentKey?: string; metricTotal: number; rows: TRow[] }
  >();

  for (const row of filtered) {
    const keyVal = normalizeNodeValue(splitSpec.getValue(row));
    if (!keyVal) continue;
    const parentVal = parentSpec
      ? normalizeNodeValue(parentSpec.getValue(row)) ?? undefined
      : undefined;
    const compositeKey =
      query.rankingScope === 'per_selected_node' && parentVal
        ? `${parentVal}::${keyVal}`
        : keyVal;
    const metric = getMetric(row);
    const safeMetric = Number.isFinite(metric) ? metric : 0;

    const existing = grouped.get(compositeKey);
    if (!existing) {
      grouped.set(compositeKey, {
        label: keyVal,
        parentKey: parentVal,
        metricTotal: safeMetric,
        rows: [row],
      });
    } else {
      existing.metricTotal += safeMetric;
      existing.rows.push(row);
    }
  }

  let buckets: HierarchyBucket<TRow>[] = Array.from(grouped.entries()).map(
    ([key, entry]) => ({
      key,
      label: entry.label,
      parentKey: entry.parentKey,
      metricTotal: entry.metricTotal,
      rows: entry.rows,
    })
  );

  if (query.rankingScope === 'per_selected_node' && query.perParentLimit) {
    const byParent = new Map<string, HierarchyBucket<TRow>[]>();
    for (const bucket of buckets) {
      const pKey = bucket.parentKey ?? '__root__';
      const list = byParent.get(pKey) ?? [];
      list.push(bucket);
      byParent.set(pKey, list);
    }
    const trimmed: HierarchyBucket<TRow>[] = [];
    for (const list of byParent.values()) {
      list.sort(compare);
      trimmed.push(...list.slice(0, Math.max(1, query.perParentLimit)));
    }
    buckets = trimmed;
  } else {
    buckets.sort(compare);
  }

  if (typeof query.limit === 'number' && query.limit > 0) {
    return buckets.slice(0, query.limit);
  }
  return buckets;
}
