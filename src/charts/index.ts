/**
 * Consumer barrel re-exporting all 13 self-contained D3 charts.
 * NOTE: Individual chart files never import this barrel or any other local file.
 */
export {
  ColumnsChart,
  asColumnsChartId,
  mountColumns,
  type ColumnDatum,
  type ColumnGroup,
  type ColumnsChartId,
  type ColumnsChartInstance,
  type ColumnsData,
  type ColumnsModeSpec,
  type ColumnsOptions,
} from './columns.js';

export {
  ButterflyChart,
  asButterflyChartId,
  mountButterfly,
  type ButterflyChartId,
  type ButterflyChartInstance,
  type ButterflyData,
  type ButterflyHighlightLayer,
  type ButterflyOptions,
  type ButterflyRow,
  type ButterflySharedState,
} from './butterfly.js';

export {
  LineChart,
  asLineChartId,
  mountLineChart,
  type LineChartData,
  type LineChartId,
  type LineChartInstance,
  type LineChartModeSpec,
  type LineChartOptions,
  type LinePoint,
} from './line-chart.js';

export {
  StackedAreaChart,
  asStackedAreaChartId,
  mountStackedArea,
  type StackedAreaChartId,
  type StackedAreaChartInstance,
  type StackedAreaData,
  type StackedAreaOptions,
  type StackedAreaPoint,
  type StackedAreaSeries,
  type StackedAreaStep,
} from './stacked-area.js';

export {
  HistogramChart,
  asHistogramChartId,
  mountHistogram,
  type HistogramAnchorConfig,
  type HistogramBin,
  type HistogramChartId,
  type HistogramChartInstance,
  type HistogramData,
  type HistogramOptions,
} from './histogram.js';

export {
  HeatmapChart,
  asHeatmapChartId,
  mountHeatmap,
  type HeatmapCell,
  type HeatmapChartId,
  type HeatmapChartInstance,
  type HeatmapData,
  type HeatmapOptions,
} from './heatmap.js';

export {
  TableChart,
  asTableChartId,
  mountTable,
  type TableCellValue,
  type TableChartId,
  type TableChartInstance,
  type TableColumn,
  type TableColumnGroup,
  type TableData,
  type TableOptions,
  type TableRow,
} from './table.js';

export {
  RatioPyramidsChart,
  asRatioPyramidsChartId,
  mountRatioPyramids,
  type RatioPyramidPanel,
  type RatioPyramidTier,
  type RatioPyramidsChartId,
  type RatioPyramidsChartInstance,
  type RatioPyramidsData,
  type RatioPyramidsOptions,
} from './ratio-pyramids.js';

export {
  RadialCoilChart,
  asRadialCoilChartId,
  mountRadialCoil,
  type RadialCoilChartId,
  type RadialCoilChartInstance,
  type RadialCoilData,
  type RadialCoilItem,
  type RadialCoilOptions,
  type RadialCoilPanel,
} from './radial-coil.js';

export {
  RadialDynamoChart,
  asRadialDynamoChartId,
  mountRadialDynamo,
  type DynamoCoreSpec,
  type DynamoEventBadge,
  type DynamoPetal,
  type DynamoPetalLayer,
  type DynamoRadialTick,
  type DynamoRingSegment,
  type DynamoSatellite,
  type RadialDynamoChartId,
  type RadialDynamoChartInstance,
  type RadialDynamoData,
  type RadialDynamoOptions,
} from './radial-dynamo.js';

export {
  SparklineChart,
  asSparklineChartId,
  mountSparkline,
  type SparklineBand,
  type SparklineChartId,
  type SparklineChartInstance,
  type SparklineData,
  type SparklineEra,
  type SparklineMilestone,
  type SparklineOptions,
  type SparklineStep,
} from './sparkline.js';

export {
  MapChart,
  asMapChartId,
  mountMap,
  type MapCallout,
  type MapChartId,
  type MapChartInstance,
  type MapData,
  type MapFlow,
  type MapOptions,
  type MapPoint,
  type MapPolygon,
  type MapProjectionKind,
} from './map.js';

export {
  TocBookshelfChart,
  asTocBookshelfChartId,
  mountTocBookshelf,
  type BookshelfPlateEntry,
  type BookshelfVolume,
  type BuiltInChartThumbnail,
  type TocBookshelfChartId,
  type TocBookshelfChartInstance,
  type TocBookshelfData,
  type TocBookshelfOptions,
} from './toc-bookshelf.js';
