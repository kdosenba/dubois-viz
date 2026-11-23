import type {
  ButterflyData,
  ColumnsData,
  HeatmapData,
  HistogramData,
  LineChartData,
  MapData,
  RadialCoilData,
  RadialDynamoData,
  RatioPyramidsData,
  SparklineData,
  StackedAreaData,
  TableData,
  TocBookshelfData,
} from '../../charts/index.js';

// ============================================================================
// 1. Financial Analysis — Quarterly Revenue by Division + Margin Overlay
// ============================================================================
export const FINANCIAL_COLUMNS_DATA: ColumnsData = {
  groups: [
    { id: 'fy24', label: 'FY 2024', color: '#2B5B84' },
    { id: 'fy25', label: 'FY 2025', color: '#DC143C' },
  ],
  bars: [
    { stepId: '24q1', stepLabel: 'Q1 24', stepOrder: 1, groupId: 'fy24', seriesId: 'cloud', seriesLabel: 'Cloud', value: 42, benchmarkValue: 38, lineOverlayValue: 28 },
    { stepId: '24q1', stepLabel: 'Q1 24', stepOrder: 1, groupId: 'fy24', seriesId: 'hardware', seriesLabel: 'Hardware', value: 26, benchmarkValue: 28 },
    { stepId: '24q2', stepLabel: 'Q2 24', stepOrder: 2, groupId: 'fy24', seriesId: 'cloud', seriesLabel: 'Cloud', value: 48, benchmarkValue: 44, lineOverlayValue: 33 },
    { stepId: '24q2', stepLabel: 'Q2 24', stepOrder: 2, groupId: 'fy24', seriesId: 'hardware', seriesLabel: 'Hardware', value: 29, benchmarkValue: 27 },
    { stepId: '24q3', stepLabel: 'Q3 24', stepOrder: 3, groupId: 'fy24', seriesId: 'cloud', seriesLabel: 'Cloud', value: 53, benchmarkValue: 49, lineOverlayValue: 37 },
    { stepId: '24q3', stepLabel: 'Q3 24', stepOrder: 3, groupId: 'fy24', seriesId: 'hardware', seriesLabel: 'Hardware', value: 31, benchmarkValue: 30 },
    { stepId: '24q4', stepLabel: 'Q4 24', stepOrder: 4, groupId: 'fy24', seriesId: 'cloud', seriesLabel: 'Cloud', value: 64, benchmarkValue: 56, lineOverlayValue: 45 },
    { stepId: '24q4', stepLabel: 'Q4 24', stepOrder: 4, groupId: 'fy24', seriesId: 'hardware', seriesLabel: 'Hardware', value: 39, benchmarkValue: 34 },
    { stepId: '25q1', stepLabel: 'Q1 25', stepOrder: 5, groupId: 'fy25', seriesId: 'cloud', seriesLabel: 'Cloud', value: 69, benchmarkValue: 60, lineOverlayValue: 51 },
    { stepId: '25q1', stepLabel: 'Q1 25', stepOrder: 5, groupId: 'fy25', seriesId: 'hardware', seriesLabel: 'Hardware', value: 35, benchmarkValue: 33 },
    { stepId: '25q2', stepLabel: 'Q2 25', stepOrder: 6, groupId: 'fy25', seriesId: 'cloud', seriesLabel: 'Cloud', value: 76, benchmarkValue: 67, lineOverlayValue: 58 },
    { stepId: '25q2', stepLabel: 'Q2 25', stepOrder: 6, groupId: 'fy25', seriesId: 'hardware', seriesLabel: 'Hardware', value: 37, benchmarkValue: 36 },
  ],
};

// ============================================================================
// 2. Music Pop Charts — Genre Breakdown (Butterfly w/ Expandable Sub-Genres)
// ============================================================================
export const MUSIC_BUTTERFLY_DATA: ButterflyData = {
  highlightLayers: [
    { id: 'top10', label: 'Top 10 Hits', color: '#FFD700' },
    { id: 'debut', label: 'Debut Artists', color: '#008055' },
  ],
  rows: [
    {
      id: 'pop',
      label: 'POP',
      fullLabel: 'Pop & Synth-Pop',
      order: 1,
      leftValue: 84,
      rightValue: 96,
      leftBenchmark: 76,
      rightBenchmark: 88,
      leftHighlights: { top10: 34, debut: 22 },
      rightHighlights: { top10: 42, debut: 28 },
    },
    {
      id: 'pop-synth',
      parentId: 'pop',
      label: 'Synth',
      order: 2,
      leftValue: 31,
      rightValue: 39,
      leftHighlights: { top10: 14, debut: 9 },
      rightHighlights: { top10: 19, debut: 12 },
    },
    {
      id: 'pop-indie',
      parentId: 'pop',
      label: 'Indie Pop',
      order: 3,
      leftValue: 26,
      rightValue: 30,
      leftHighlights: { top10: 9, debut: 11 },
      rightHighlights: { top10: 11, debut: 13 },
    },
    {
      id: 'hiphop',
      label: 'HIP-HOP',
      fullLabel: 'Hip-Hop & R&B',
      order: 4,
      leftValue: 72,
      rightValue: 89,
      leftBenchmark: 68,
      rightBenchmark: 82,
      leftHighlights: { top10: 29, debut: 19 },
      rightHighlights: { top10: 38, debut: 24 },
    },
    {
      id: 'latin',
      label: 'LATIN',
      fullLabel: 'Latin & Reggaeton',
      order: 5,
      leftValue: 41,
      rightValue: 68,
      leftBenchmark: 34,
      rightBenchmark: 51,
      leftHighlights: { top10: 16, debut: 12 },
      rightHighlights: { top10: 29, debut: 21 },
    },
    {
      id: 'rock',
      label: 'ROCK',
      fullLabel: 'Alternative & Rock',
      order: 6,
      leftValue: 59,
      rightValue: 47,
      leftBenchmark: 63,
      rightBenchmark: 52,
      leftHighlights: { top10: 18, debut: 10 },
      rightHighlights: { top10: 15, debut: 9 },
    },
    {
      id: 'electronic',
      label: 'ELECTRO',
      fullLabel: 'House & Electronic',
      order: 7,
      leftValue: 38,
      rightValue: 54,
      leftBenchmark: 35,
      rightBenchmark: 44,
      leftHighlights: { top10: 12, debut: 14 },
      rightHighlights: { top10: 21, debut: 18 },
    },
  ],
};

// ============================================================================
// 3. Regional Transit & Trade Network (Map + Cross-Filtered Butterfly)
// ============================================================================
export const TRANSIT_MAP_DATA: MapData = {
  polygons: [
    {
      id: 'west',
      label: 'Western Corridor',
      rings: [[[-124, 32], [-112, 32], [-108, 42], [-115, 49], [-125, 48], [-124, 32]]],
    },
    {
      id: 'central',
      label: 'Central Plains',
      rings: [[[-112, 32], [-94, 30], [-92, 46], [-108, 49], [-108, 42], [-112, 32]]],
    },
    {
      id: 'east',
      label: 'Atlantic Seaboard',
      rings: [[[-94, 30], [-74, 28], [-68, 45], [-84, 47], [-92, 46], [-94, 30]]],
    },
  ],
  regionValues: { west: 74, central: 48, east: 92 },
  points: [
    { id: 'west', label: 'Pacific Hub', lat: 37.8, lng: -122.2, value: 420, secondaryValue: 180, groupId: 'west' },
    { id: 'central', label: 'Midwest Hub', lat: 41.8, lng: -98.5, value: 310, secondaryValue: 120, groupId: 'central' },
    { id: 'east', label: 'Harbor Hub', lat: 40.7, lng: -74.0, value: 540, secondaryValue: 260, groupId: 'east' },
    { id: 'south', label: 'Gulf Terminal', lat: 31.2, lng: -89.5, value: 230, secondaryValue: 95, groupId: 'central' },
  ],
  flows: [
    { id: 'f1', fromLat: 37.8, fromLng: -122.2, toLat: 41.8, toLng: -98.5, magnitude: 145, fromLabel: 'Pacific Hub', toLabel: 'Midwest Hub', metadata: { Mode: 'Rail', Trains: 38 } },
    { id: 'f2', fromLat: 41.8, fromLng: -98.5, toLat: 40.7, toLng: -74.0, magnitude: 210, fromLabel: 'Midwest Hub', toLabel: 'Harbor Hub', metadata: { Mode: 'Rail', Trains: 52 } },
    { id: 'f3', fromLat: 31.2, fromLng: -89.5, toLat: 40.7, toLng: -74.0, magnitude: 120, fromLabel: 'Gulf Terminal', toLabel: 'Harbor Hub', metadata: { Mode: 'Coastal', Vessels: 19 } },
  ],
  callouts: [
    { id: 'c1', targetLat: 40.7, targetLng: -74.0, anchorLat: 43.5, anchorLng: -67.0, label: 'Harbor Hub', valueLabel: '540 kt', align: 'start' },
    { id: 'c2', targetLat: 37.8, targetLng: -122.2, anchorLat: 35.0, anchorLng: -127.0, label: 'Pacific Hub', valueLabel: '420 kt', align: 'end' },
  ],
};

export const TRANSIT_LINKED_BUTTERFLY: ButterflyData = {
  rows: [
    { id: 'east', label: 'EAST', fullLabel: 'Atlantic Seaboard', order: 1, leftValue: 310, rightValue: 540, leftBenchmark: 290, rightBenchmark: 495 },
    { id: 'west', label: 'WEST', fullLabel: 'Western Corridor', order: 2, leftValue: 260, rightValue: 420, leftBenchmark: 245, rightBenchmark: 390 },
    { id: 'central', label: 'CENTRAL', fullLabel: 'Central Plains', order: 3, leftValue: 195, rightValue: 310, leftBenchmark: 205, rightBenchmark: 280 },
    { id: 'south', label: 'GULF', fullLabel: 'Gulf Terminal', order: 4, leftValue: 140, rightValue: 230, leftBenchmark: 130, rightBenchmark: 210 },
  ],
};

// ============================================================================
// 4. SaaS Cohort Analytics — 3-Panel Synchronized Stack (SyncedStackPlate)
// ============================================================================
const COHORT_STEPS = Array.from({ length: 12 }, (_, idx) => ({
  id: `m${idx + 1}`,
  index: idx,
  label: `M${idx + 1}`,
  groupId: idx < 4 ? 'yr1' : idx < 8 ? 'yr2' : 'yr3',
  groupLabel: idx < 4 ? 'Wave I' : idx < 8 ? 'Wave II' : 'Wave III',
}));

export const SAAS_ACQUISITION_COLUMNS: ColumnsData = {
  bars: COHORT_STEPS.flatMap((st) => [
    { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 'organic', seriesLabel: 'Organic', value: 18 + st.index * 3 + (st.index % 3) * 4 },
    { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 'partner', seriesLabel: 'Partner', value: 10 + st.index * 2 + (st.index % 2) * 5 },
  ]),
};

export const SAAS_COHORT_STACKED_AREA: StackedAreaData = {
  steps: COHORT_STEPS,
  series: [
    { id: 'c1', label: 'Wave I Cohort', originStepIndex: 0, groupId: 'yr1' },
    { id: 'c2', label: 'Wave II Early', originStepIndex: 4, groupId: 'yr2' },
    { id: 'c3', label: 'Wave II Late', originStepIndex: 6, groupId: 'yr2' },
    { id: 'c4', label: 'Wave III', originStepIndex: 8, groupId: 'yr3' },
  ],
  points: COHORT_STEPS.flatMap((st) => {
    const out: { stepIndex: number; seriesId: string; value: number }[] = [];
    out.push({ stepIndex: st.index, seriesId: 'c1', value: Math.max(12, Math.round(90 * Math.pow(0.91, st.index))) });
    if (st.index >= 4) {
      out.push({ stepIndex: st.index, seriesId: 'c2', value: Math.max(10, Math.round(78 * Math.pow(0.93, st.index - 4))) });
    }
    if (st.index >= 6) {
      out.push({ stepIndex: st.index, seriesId: 'c3', value: Math.max(8, Math.round(64 * Math.pow(0.94, st.index - 6))) });
    }
    if (st.index >= 8) {
      out.push({ stepIndex: st.index, seriesId: 'c4', value: Math.max(8, Math.round(85 * Math.pow(0.95, st.index - 8))) });
    }
    return out;
  }),
};

export const SAAS_TIER_COLUMNS: ColumnsData = {
  bars: [],
  modes: [
    {
      id: 'all',
      label: 'All Active Tiers',
      bars: COHORT_STEPS.flatMap((st) => [
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't1', seriesLabel: 'Tier 1', value: 24 + st.index },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't2', seriesLabel: 'Tier 2', value: 18 + Math.round(st.index * 1.4) },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't3', seriesLabel: 'Tier 3', value: 10 + Math.round(st.index * 1.8) },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't4', seriesLabel: 'Tier 4', value: 4 + Math.round(st.index * 1.3) },
      ]),
    },
    {
      id: 'highest',
      label: 'Highest Tier Reached',
      bars: COHORT_STEPS.flatMap((st) => [
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't1', seriesLabel: 'Tier 1', value: 14 },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't2', seriesLabel: 'Tier 2', value: 16 + Math.round(st.index * 0.7) },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't3', seriesLabel: 'Tier 3', value: 9 + Math.round(st.index * 1.1) },
        { stepId: st.id, stepLabel: st.label, stepOrder: st.index, seriesId: 't4', seriesLabel: 'Tier 4', value: 4 + Math.round(st.index * 1.3) },
      ]),
    },
  ],
};

// ============================================================================
// 5. Urban Clean-Energy Grids (Radial Dynamo + Sparkline Small Multiples)
// ============================================================================
function makeEnergyDynamo(
  id: string,
  label: string,
  coreMw: number,
  baselineMw: number,
  scale: number
): RadialDynamoData {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return {
    core: {
      id,
      label,
      value: coreMw,
      baselineValue: baselineMw,
      horizonValue: coreMw * 3.1,
      horizonLabel: 'Grid Capacity',
    },
    innerRing: [
      { id: 'solar', label: 'Solar PV', value: 38 * scale },
      { id: 'wind', label: 'Offshore Wind', value: 31 * scale },
      { id: 'hydro', label: 'Hydro', value: 19 * scale },
      { id: 'geo', label: 'Geothermal', value: 12 * scale },
    ],
    radialTicks: [
      { angleDeg: 0, label: 'WINTER' },
      { angleDeg: 90, label: 'SPRING' },
      { angleDeg: 180, label: 'SUMMER' },
      { angleDeg: 270, label: 'AUTUMN' },
    ],
    petals: months.map((m, i) => ({
      id: `${id}-${m}`,
      label: m,
      layers: [
        { id: 'wind', label: 'Wind', value: Math.round((24 + Math.cos(i * 0.55) * 10) * scale), color: '#2B5B84' },
        { id: 'solar', label: 'Solar', value: Math.round((18 + Math.sin((i - 2) * 0.5) * 14) * scale), color: '#00A7B5' },
      ],
      badges: i === 6 ? [{ id: 'peak', label: 'Peak Export', count: 3, color: '#FFD700' }] : undefined,
    })),
    satellites: [
      { id: `${id}-north`, label: 'North Grid', group: 'Microgrid', value: 26 * scale, anchorAngleDeg: 45, flowValue: 14, flowLabel: 'MW Export', color: '#008055' },
      { id: `${id}-port`, label: 'Port Array', group: 'Microgrid', value: 19 * scale, anchorAngleDeg: 145, flowValue: 9, flowLabel: 'MW Export', color: '#008055' },
      { id: `${id}-valley`, label: 'Valley Link', group: 'Interconnect', value: 22 * scale, anchorAngleDeg: 255, ringTier: 1, flowValue: 11, flowLabel: 'MW Import', color: '#753ABD' },
    ],
  };
}

export const ENERGY_DYNAMO_ITEMS = [
  { id: 'nordic', title: 'Nordic Coast', subtitle: '410 MW Base', groupLabel: 'Northern Grid', data: makeEnergyDynamo('nordic', 'Nordic Coast', 140, 112, 1.15) },
  { id: 'alpine', title: 'Alpine Basin', subtitle: '340 MW Base', groupLabel: 'Northern Grid', data: makeEnergyDynamo('alpine', 'Alpine Basin', 118, 98, 0.92) },
  { id: 'iberian', title: 'Iberian Solar', subtitle: '385 MW Base', groupLabel: 'Southern Grid', data: makeEnergyDynamo('iberian', 'Iberian Solar', 132, 104, 1.05) },
  { id: 'aegean', title: 'Aegean Islands', subtitle: '250 MW Base', groupLabel: 'Southern Grid', data: makeEnergyDynamo('aegean', 'Aegean Islands', 88, 76, 0.72) },
];

export const ENERGY_SPARKLINE_DATA: SparklineData = {
  steps: Array.from({ length: 12 }, (_, i) => ({ id: `y${2015 + i}`, label: `${2015 + i}` })),
  eras: [{ startIndex: 7, endIndex: 11, label: '2022+ Target' }],
  milestones: [{ stepIndex: 7, label: 'Grid Upgrade', color: '#DC143C' }],
  bands: [
    { id: 'clean', label: 'Clean Output', values: [42, 48, 54, 61, 69, 75, 84, 98, 114, 129, 146, 162], kind: 'area', color: '#008055' },
    { id: 'storage', label: 'Battery GWh', values: [4, 5, 7, 9, 13, 18, 26, 38, 52, 69, 88, 108], kind: 'area', color: '#2B5B84' },
    { id: 'outages', label: 'Peak Load', values: [68, 70, 72, 71, 74, 75, 78, 82, 85, 88, 91, 95], kind: 'line', color: '#DC143C' },
  ],
};

// ============================================================================
// 6. Additional Standalone Showcase Charts
// ============================================================================
export const STREAMING_RETENTION_LINES: LineChartData = {
  points: [],
  modes: [
    {
      id: 'strict',
      label: 'Strict Consecutive',
      points: [
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 0, xLabel: 'Wk 0', value: 100, baselineValue: 100 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 1, xLabel: 'Wk 1', value: 78, baselineValue: 72 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 2, xLabel: 'Wk 2', value: 64, baselineValue: 58 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 3, xLabel: 'Wk 3', value: 55, baselineValue: 49 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 4, xLabel: 'Wk 4', value: 48, baselineValue: 41 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 0, xLabel: 'Wk 0', value: 100, baselineValue: 100 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 1, xLabel: 'Wk 1', value: 86, baselineValue: 82 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 2, xLabel: 'Wk 2', value: 79, baselineValue: 74 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 3, xLabel: 'Wk 3', value: 74, baselineValue: 68 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 4, xLabel: 'Wk 4', value: 70, baselineValue: 64 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 0, xLabel: 'Wk 0', value: 100, baselineValue: 100 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 1, xLabel: 'Wk 1', value: 71, baselineValue: 66 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 2, xLabel: 'Wk 2', value: 58, baselineValue: 53 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 3, xLabel: 'Wk 3', value: 52, baselineValue: 47 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 4, xLabel: 'Wk 4', value: 49, baselineValue: 42 },
      ],
    },
    {
      id: 'returning',
      label: 'Including Returners',
      points: [
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 0, xLabel: 'Wk 0', value: 100 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 1, xLabel: 'Wk 1', value: 84 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 2, xLabel: 'Wk 2', value: 73 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 3, xLabel: 'Wk 3', value: 66 },
        { seriesId: 'pop', seriesLabel: 'Pop Releases', x: 4, xLabel: 'Wk 4', value: 61 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 0, xLabel: 'Wk 0', value: 100 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 1, xLabel: 'Wk 1', value: 91 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 2, xLabel: 'Wk 2', value: 85 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 3, xLabel: 'Wk 3', value: 82 },
        { seriesId: 'jazz', seriesLabel: 'Jazz Catalog', x: 4, xLabel: 'Wk 4', value: 79 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 0, xLabel: 'Wk 0', value: 100 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 1, xLabel: 'Wk 1', value: 78 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 2, xLabel: 'Wk 2', value: 67 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 3, xLabel: 'Wk 3', value: 61 },
        { seriesId: 'indie', seriesLabel: 'Indie Albums', x: 4, xLabel: 'Wk 4', value: 57 },
      ],
    },
  ],
};

export const RELEASE_LAG_HISTOGRAM: HistogramData = {
  bins: [
    { value: -3, label: '-3 wk', count: 14, benchmarkCount: 11 },
    { value: -2, label: '-2 wk', count: 29, benchmarkCount: 24 },
    { value: -1, label: '-1 wk', count: 52, benchmarkCount: 44 },
    { value: 0, label: 'Release', count: 118, benchmarkCount: 96 },
    { value: 1, label: '+1 wk', count: 84, benchmarkCount: 78 },
    { value: 2, label: '+2 wk', count: 47, benchmarkCount: 51 },
    { value: 3, label: '+3 wk', count: 23, benchmarkCount: 28 },
  ],
};

export const CORRELATION_HEATMAP: HeatmapData = {
  cells: [
    { rowId: 'r1', rowLabel: 'Equities', rowOrder: 1, colId: 'c1', colLabel: 'US', colOrder: 1, value: 94 },
    { rowId: 'r1', rowLabel: 'Equities', rowOrder: 1, colId: 'c2', colLabel: 'EU', colOrder: 2, value: 76 },
    { rowId: 'r1', rowLabel: 'Equities', rowOrder: 1, colId: 'c3', colLabel: 'APAC', colOrder: 3, value: 62 },
    { rowId: 'r1', rowLabel: 'Equities', rowOrder: 1, colId: 'c4', colLabel: 'LATAM', colOrder: 4, value: 44 },
    { rowId: 'r2', rowLabel: 'Bonds', rowOrder: 2, colId: 'c1', colLabel: 'US', colOrder: 1, value: 58 },
    { rowId: 'r2', rowLabel: 'Bonds', rowOrder: 2, colId: 'c2', colLabel: 'EU', colOrder: 2, value: 71 },
    { rowId: 'r2', rowLabel: 'Bonds', rowOrder: 2, colId: 'c3', colLabel: 'APAC', colOrder: 3, value: 49 },
    { rowId: 'r2', rowLabel: 'Bonds', rowOrder: 2, colId: 'c4', colLabel: 'LATAM', colOrder: 4, value: 31 },
    { rowId: 'r3', rowLabel: 'Infra', rowOrder: 3, colId: 'c1', colLabel: 'US', colOrder: 1, value: 42 },
    { rowId: 'r3', rowLabel: 'Infra', rowOrder: 3, colId: 'c2', colLabel: 'EU', colOrder: 2, value: 64 },
    { rowId: 'r3', rowLabel: 'Infra', rowOrder: 3, colId: 'c3', colLabel: 'APAC', colOrder: 3, value: 83 },
    { rowId: 'r3', rowLabel: 'Infra', rowOrder: 3, colId: 'c4', colLabel: 'LATAM', colOrder: 4, value: 55 },
  ],
};

export const FUNNEL_PYRAMIDS_DATA: RatioPyramidsData = {
  panels: [
    {
      id: 'enterprise',
      label: 'Enterprise',
      order: 1,
      tiers: [
        { tierId: 'leads', label: 'Partners', value: 18 },
        { tierId: 'pilots', label: 'Accounts', value: 94 },
        { tierId: 'seats', label: 'Active Seats', value: 2840 },
      ],
    },
    {
      id: 'midmarket',
      label: 'Mid-Market',
      order: 2,
      tiers: [
        { tierId: 'leads', label: 'Partners', value: 32 },
        { tierId: 'pilots', label: 'Accounts', value: 215 },
        { tierId: 'seats', label: 'Active Seats', value: 4120 },
      ],
    },
    {
      id: 'selfserve',
      label: 'Self-Serve',
      order: 3,
      tiers: [
        { tierId: 'leads', label: 'Partners', value: 12 },
        { tierId: 'pilots', label: 'Accounts', value: 640 },
        { tierId: 'seats', label: 'Active Seats', value: 7890 },
      ],
    },
  ],
};

export const SECTOR_COIL_DATA: RadialCoilData = {
  panels: [
    {
      id: 'q1',
      label: '2024 Portfolio',
      order: 1,
      items: [
        { id: 'tech', label: 'Technology', value: 420, benchmarkValue: 380 },
        { id: 'energy', label: 'Clean Energy', value: 290, benchmarkValue: 250 },
        { id: 'health', label: 'Healthcare', value: 210, benchmarkValue: 220 },
        { id: 'industrial', label: 'Industrials', value: 145, benchmarkValue: 160 },
      ],
    },
    {
      id: 'q2',
      label: '2025 Portfolio',
      order: 2,
      items: [
        { id: 'tech', label: 'Technology', value: 485, benchmarkValue: 420 },
        { id: 'energy', label: 'Clean Energy', value: 365, benchmarkValue: 290 },
        { id: 'health', label: 'Healthcare', value: 240, benchmarkValue: 210 },
        { id: 'industrial', label: 'Industrials', value: 175, benchmarkValue: 145 },
      ],
    },
  ],
};

export const CAPABILITY_TABLE_DATA: TableData = {
  columnGroups: [
    { id: 'core', label: 'Core Engine', color: '#E87722' },
    { id: 'sync', label: 'Sync & Export', colorMode: 'sequential' },
  ],
  columns: [
    { id: 'd3', groupId: 'core', label: 'D3' },
    { id: 'a11y', groupId: 'core', label: 'A11Y' },
    { id: 'ro', groupId: 'core', label: 'RESIZE' },
    { id: 'scale', groupId: 'sync', label: 'SCALE' },
    { id: 'select', groupId: 'sync', label: 'SELECT' },
    { id: 'time', groupId: 'sync', label: 'WINDOW' },
    { id: 'svg', groupId: 'sync', label: 'SVG' },
  ],
  rows: [
    { id: 'columns', label: 'columns.ts', subtitle: 'Grouped / Stacked / Skyline', cells: { d3: { value: true }, a11y: { value: true }, ro: { value: true }, scale: { value: true }, select: { value: true }, time: { value: true }, svg: { value: true } } },
    { id: 'butterfly', label: 'butterfly.ts', subtitle: 'Wings / Sequential / Tree', cells: { d3: { value: true }, a11y: { value: true }, ro: { value: true }, scale: { value: true }, select: { value: true }, time: { value: false }, svg: { value: true } } },
    { id: 'stacked-area', label: 'stacked-area.ts', subtitle: 'Cohort / Long-Tail', cells: { d3: { value: true }, a11y: { value: true }, ro: { value: true }, scale: { value: true }, select: { value: true }, time: { value: true }, svg: { value: true } } },
    { id: 'radial-dynamo', label: 'radial-dynamo.ts', subtitle: 'Linear Polar / Satellites', cells: { d3: { value: true }, a11y: { value: true }, ro: { value: true }, scale: { value: true }, select: { value: true }, time: { value: false }, svg: { value: true } } },
    { id: 'map', label: 'map.ts', subtitle: 'GeoJSON / Flows / Callouts', cells: { d3: { value: true }, a11y: { value: true }, ro: { value: true }, scale: { value: true }, select: { value: true }, time: { value: false }, svg: { value: true } } },
  ],
};

export const EXHIBITION_TOC_DATA: TocBookshelfData = {
  volumes: [
    { id: 'vol-mix', numeral: 'I', shortTitle: 'Mix & Match', title: 'Volume I — Composable Mix & Match Demos', color: '#DC143C', epigraph: 'Cross-filtering buses, synchronized time stacks, multi-entity grids, and companion flipbooks.' },
    { id: 'vol-charts', numeral: 'II', shortTitle: 'Standalone', title: 'Volume II — Standalone Chart Gallery', color: '#2B5B84', epigraph: 'Drop any single chart file into any financial, music, climate, or product project.' },
  ],
  items: [
    { id: 'sec-crossfilter', number: 1, numeral: 'I', title: 'Cross-Filtered Map & Butterfly', volumeIds: ['vol-mix'], thumbnail: 'map', badge: 'SelectionBus', note: 'Click any corridor on the map or butterfly bar to filter both.' },
    { id: 'sec-stack', number: 2, numeral: 'II', title: 'Synchronized Cohort Stack', volumeIds: ['vol-mix'], thumbnail: 'stacked-area', badge: 'TimeWindowBus', note: 'Brush horizontally to zoom all three stacked panels in lockstep.' },
    { id: 'sec-multiples', number: 3, numeral: 'III', title: 'Energy Grid Focus / Compare / Atlas', volumeIds: ['vol-mix'], thumbnail: 'radial-dynamo', badge: 'ScaleGroup', note: 'Single-variable linear radial scale synced across all tiles.' },
    { id: 'sec-flipbook', number: 4, numeral: 'IV', title: 'Companion FlipBook Plate', volumeIds: ['vol-mix'], thumbnail: 'table', badge: 'FlipBook', note: 'Pair a grouped skyline column view with an archival coverage table.' },
    { id: 'sec-music', number: 5, numeral: 'V', title: 'Pop Chart Genres & Release Lag', volumeIds: ['vol-charts'], thumbnail: 'butterfly', badge: 'Music', note: 'Expandable sub-genres, highlight toggles, and 3-zone anchor histogram.' },
    { id: 'sec-finance', number: 6, numeral: 'VI', title: 'Portfolio Coils, Ratios & Matrix', volumeIds: ['vol-charts'], thumbnail: 'radial-coil', badge: 'Finance', note: 'Wrapped radial coils, N-tier ratio pyramids, and proportional disc matrix.' },
  ],
};
