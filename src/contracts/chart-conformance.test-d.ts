/**
 * Compile-time structural contract proof (excluded from library JS emit).
 * Proves all 13 standalone charts structurally conform to DuBoisChartInstance
 * and their optional mix-and-match capabilities WITHOUT importing src/contracts/.
 */
import type {
  ChartDescriptor,
  DuBoisChartInstance,
  PeerSyncableChart,
  ScalableChart,
  SelectableChart,
  TimeWindowChart,
  ZoomableChart,
} from './chart-contract.js';
import {
  ButterflyChart,
  type ButterflyChartInstance,
  type ButterflyData,
  type ButterflyOptions,
  type ButterflySharedState,
} from '../charts/butterfly.js';
import {
  ColumnsChart,
  type ColumnsChartInstance,
  type ColumnsData,
  type ColumnsOptions,
} from '../charts/columns.js';
import {
  HeatmapChart,
  type HeatmapChartInstance,
  type HeatmapData,
  type HeatmapOptions,
} from '../charts/heatmap.js';
import {
  HistogramChart,
  type HistogramChartInstance,
  type HistogramData,
  type HistogramOptions,
} from '../charts/histogram.js';
import {
  LineChart,
  type LineChartData,
  type LineChartInstance,
  type LineChartOptions,
} from '../charts/line-chart.js';
import {
  MapChart,
  type MapChartInstance,
  type MapData,
  type MapOptions,
} from '../charts/map.js';
import {
  RadialCoilChart,
  type RadialCoilChartInstance,
  type RadialCoilData,
  type RadialCoilOptions,
} from '../charts/radial-coil.js';
import {
  RadialDynamoChart,
  type RadialDynamoChartInstance,
  type RadialDynamoData,
  type RadialDynamoOptions,
} from '../charts/radial-dynamo.js';
import {
  RatioPyramidsChart,
  type RatioPyramidsChartInstance,
  type RatioPyramidsData,
  type RatioPyramidsOptions,
} from '../charts/ratio-pyramids.js';
import {
  SparklineChart,
  type SparklineChartInstance,
  type SparklineData,
  type SparklineOptions,
} from '../charts/sparkline.js';
import {
  StackedAreaChart,
  type StackedAreaChartInstance,
  type StackedAreaData,
  type StackedAreaOptions,
} from '../charts/stacked-area.js';
import {
  TableChart,
  type TableChartInstance,
  type TableData,
  type TableOptions,
} from '../charts/table.js';
import {
  TocBookshelfChart,
  type TocBookshelfChartInstance,
  type TocBookshelfData,
  type TocBookshelfOptions,
} from '../charts/toc-bookshelf.js';

type AssertExtends<T extends U, U> = T;

export type _VerifyAllDescriptors = [
  AssertExtends<typeof ColumnsChart, ChartDescriptor<ColumnsData, ColumnsOptions, ColumnsChartInstance>>,
  AssertExtends<typeof ButterflyChart, ChartDescriptor<ButterflyData, ButterflyOptions, ButterflyChartInstance>>,
  AssertExtends<typeof LineChart, ChartDescriptor<LineChartData, LineChartOptions, LineChartInstance>>,
  AssertExtends<typeof StackedAreaChart, ChartDescriptor<StackedAreaData, StackedAreaOptions, StackedAreaChartInstance>>,
  AssertExtends<typeof HistogramChart, ChartDescriptor<HistogramData, HistogramOptions, HistogramChartInstance>>,
  AssertExtends<typeof HeatmapChart, ChartDescriptor<HeatmapData, HeatmapOptions, HeatmapChartInstance>>,
  AssertExtends<typeof TableChart, ChartDescriptor<TableData, TableOptions, TableChartInstance>>,
  AssertExtends<typeof RatioPyramidsChart, ChartDescriptor<RatioPyramidsData, RatioPyramidsOptions, RatioPyramidsChartInstance>>,
  AssertExtends<typeof RadialCoilChart, ChartDescriptor<RadialCoilData, RadialCoilOptions, RadialCoilChartInstance>>,
  AssertExtends<typeof RadialDynamoChart, ChartDescriptor<RadialDynamoData, RadialDynamoOptions, RadialDynamoChartInstance>>,
  AssertExtends<typeof SparklineChart, ChartDescriptor<SparklineData, SparklineOptions, SparklineChartInstance>>,
  AssertExtends<typeof MapChart, ChartDescriptor<MapData, MapOptions, MapChartInstance>>,
  AssertExtends<typeof TocBookshelfChart, ChartDescriptor<TocBookshelfData, TocBookshelfOptions, TocBookshelfChartInstance>>,
];

export type _VerifyCapabilities = [
  AssertExtends<ColumnsChartInstance, DuBoisChartInstance<ColumnsData, ColumnsOptions> & ScalableChart & TimeWindowChart & SelectableChart & PeerSyncableChart>,
  AssertExtends<ButterflyChartInstance, DuBoisChartInstance<ButterflyData, ButterflyOptions> & ScalableChart & SelectableChart & PeerSyncableChart<ButterflySharedState>>,
  AssertExtends<LineChartInstance, DuBoisChartInstance<LineChartData, LineChartOptions> & ScalableChart & SelectableChart & PeerSyncableChart>,
  AssertExtends<StackedAreaChartInstance, DuBoisChartInstance<StackedAreaData, StackedAreaOptions> & ScalableChart & TimeWindowChart & SelectableChart>,
  AssertExtends<HistogramChartInstance, DuBoisChartInstance<HistogramData, HistogramOptions> & ScalableChart & SelectableChart>,
  AssertExtends<HeatmapChartInstance, DuBoisChartInstance<HeatmapData, HeatmapOptions> & ScalableChart & SelectableChart>,
  AssertExtends<TableChartInstance, DuBoisChartInstance<TableData, TableOptions> & SelectableChart>,
  AssertExtends<RatioPyramidsChartInstance, DuBoisChartInstance<RatioPyramidsData, RatioPyramidsOptions> & ScalableChart & SelectableChart>,
  AssertExtends<RadialCoilChartInstance, DuBoisChartInstance<RadialCoilData, RadialCoilOptions> & ScalableChart & SelectableChart>,
  AssertExtends<RadialDynamoChartInstance, DuBoisChartInstance<RadialDynamoData, RadialDynamoOptions> & ScalableChart & ZoomableChart & SelectableChart>,
  AssertExtends<SparklineChartInstance, DuBoisChartInstance<SparklineData, SparklineOptions> & ScalableChart & TimeWindowChart>,
  AssertExtends<MapChartInstance, DuBoisChartInstance<MapData, MapOptions> & ScalableChart & ZoomableChart & SelectableChart>,
  AssertExtends<TocBookshelfChartInstance, DuBoisChartInstance<TocBookshelfData, TocBookshelfOptions> & SelectableChart>,
];
