import {
  asPlateId,
  createFlipBookPlate,
  createLegendDrawer,
  createSelectionBus,
  createSinglePlate,
  createSmallMultiplesPlate,
  createSyncedStackPlate,
  createTitlePlate,
  createVellumPopover,
  createWhisperBar,
  exportSvgElement,
  mountButterfly,
  mountColumns,
  mountHeatmap,
  mountHistogram,
  mountLineChart,
  mountMap,
  mountRadialCoil,
  mountRadialDynamo,
  mountRatioPyramids,
  mountSparkline,
  mountStackedArea,
  mountTable,
  mountTocBookshelf,
  type SmallMultiplesMode,
} from '../index.js';
import {
  CAPABILITY_TABLE_DATA,
  CORRELATION_HEATMAP,
  ENERGY_DYNAMO_ITEMS,
  ENERGY_SPARKLINE_DATA,
  EXHIBITION_TOC_DATA,
  FINANCIAL_COLUMNS_DATA,
  FUNNEL_PYRAMIDS_DATA,
  MUSIC_BUTTERFLY_DATA,
  RELEASE_LAG_HISTOGRAM,
  SAAS_ACQUISITION_COLUMNS,
  SAAS_COHORT_STACKED_AREA,
  SAAS_TIER_COLUMNS,
  SECTOR_COIL_DATA,
  STREAMING_RETENTION_LINES,
  TRANSIT_LINKED_BUTTERFLY,
  TRANSIT_MAP_DATA,
} from './sample-data/datasets.js';

const whisperHost = document.getElementById('whisper-host');
const root = document.getElementById('showcase-root');

if (whisperHost && root) {
  let activeGridMode: SmallMultiplesMode = 'compare';
  let activeExportSvg: () => SVGSVGElement | null = () => null;

  function makeSection(id: string): HTMLElement {
    const sec = document.createElement('section');
    sec.id = id;
    sec.className = 'showcase-section';
    root!.appendChild(sec);
    return sec;
  }

  // 0. Full-bleed Title Cover Plate
  const coverSec = makeSection('sec-cover');
  const coverBox = document.createElement('div');
  coverBox.style.height = '440px';
  coverSec.appendChild(coverBox);
  createTitlePlate(coverBox, {
    id: asPlateId('cover'),
    kicker: 'W.E.B. DU BOIS 1900 PARIS EXPOSITION DESIGN SYSTEM',
    title: 'DUBOIS-VIZ — STANDALONE & COMPOSABLE D3 CHARTS',
    subtitle:
      '13 self-contained zero-local-import D3 visualizations, headless sync buses, and pluggable plates — ready for finance, music, transit, SaaS cohorts, or any dataset.',
    renderBackground: (bg) =>
      mountRadialCoil(
        bg,
        {
          panels: [
            {
              id: 'cover',
              label: '',
              items: [
                { id: 'a', label: 'A', value: 92 },
                { id: 'b', label: 'B', value: 74 },
                { id: 'c', label: 'C', value: 58 },
                { id: 'd', label: 'D', value: 42 },
              ],
            },
          ],
        },
        { showLegend: false, showTooltip: false, maxSweepDeg: 520 }
      ),
  });

  // 1. Visual Table of Contents Bookshelf
  const tocSec = makeSection('sec-toc');
  const tocBox = document.createElement('div');
  tocBox.style.minHeight = '320px';
  tocSec.appendChild(tocBox);
  mountTocBookshelf(tocBox, EXHIBITION_TOC_DATA, {
    onSelectItem: (item) => {
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
    },
  });

  // 2. Mix & Match Demo I: Cross-Filtering Map + Butterfly via SelectionBus
  const crossSec = makeSection('sec-crossfilter');
  const crossBus = createSelectionBus<string>();
  const crossGrid = document.createElement('div');
  crossGrid.className = 'showcase-grid-2';
  crossSec.appendChild(crossGrid);

  const mapHost = document.createElement('div');
  mapHost.className = 'showcase-box';
  const bfHost = document.createElement('div');
  bfHost.className = 'showcase-box';
  crossGrid.append(mapHost, bfHost);

  createSinglePlate(mapHost, {
    numeral: 'PLATE I · MIX & MATCH',
    title: 'REGIONAL FREIGHT CORRIDORS',
    subtitle: 'Click any region or hub to cross-filter the linked butterfly chart via SelectionBus.',
    renderMain: (stage, { externalLegendEl }) => {
      const m = mountMap(stage, TRANSIT_MAP_DATA, {
        externalLegendEl,
        pointLegendLabel: 'Annual Tonnage',
        secondaryPointLegendLabel: 'Rail Share',
        flowLegendLabel: 'Inter-Hub Flow',
        choroplethLegendLabel: 'Utilization Index',
        onSelect: (keys) => crossBus.select(keys),
        onHover: (k) => crossBus.hover(k),
      });
      activeExportSvg = () => m.getSvgElement();
      const unsub = crossBus.connect(m);
      return {
        destroy: () => {
          unsub();
          m.destroy();
        },
      };
    },
  });

  createSinglePlate(bfHost, {
    numeral: 'LINKED VIEW',
    title: 'INBOUND VS. OUTBOUND VOLUME',
    subtitle: 'Automatically highlights matching corridors from the map on hover or click.',
    renderMain: (stage, { externalLegendEl }) => {
      const b = mountButterfly(stage, TRANSIT_LINKED_BUTTERFLY, {
        externalLegendEl,
        leftLabel: 'Inbound (kt)',
        rightLabel: 'Outbound (kt)',
        spineHeader: 'Corridor',
        benchmarkLabel: 'Prior Year',
        onSelect: (keys) => crossBus.select(keys),
        onHover: (k) => crossBus.hover(k),
      });
      const unsub = crossBus.connect(b);
      return {
        destroy: () => {
          unsub();
          b.destroy();
        },
      };
    },
  });

  // 3. Mix & Match Demo II: Synchronized 3-Panel Cohort Stack
  const stackSec = makeSection('sec-stack');
  const stackBox = document.createElement('div');
  stackBox.className = 'showcase-box showcase-box--tall';
  stackSec.appendChild(stackBox);

  createSyncedStackPlate(stackBox, {
    numeral: 'PLATE II · SYNCED STACK PLATE',
    title: 'SAAS COHORT ACQUISITION, LONG-TAIL RETENTION & TIER DEPTH',
    subtitle: 'Drag horizontally on any panel to brush-zoom all three sections in lockstep; double-click to reset.',
    sections: [
      {
        id: 'acq',
        title: '1. Monthly Acquisition Channels (Stacked Columns)',
        weight: 0.9,
        render: (host, { timeWindowBus }) =>
          mountColumns(host, SAAS_ACQUISITION_COLUMNS, {
            layout: 'stacked',
            enableBrushZoom: true,
            showValueLabels: false,
            onTimeWindowChange: (w) => timeWindowBus.setWindow(w),
          }),
      },
      {
        id: 'cohorts',
        title: '2. Staggered Cohort Long-Tail Envelope (Stacked Area + Sum Line)',
        weight: 1.4,
        render: (host, { timeWindowBus, selectionBus }) =>
          mountStackedArea(host, SAAS_COHORT_STACKED_AREA, {
            enableBrushZoom: true,
            sumLineLabel: 'Total Active Cohorts',
            onTimeWindowChange: (w) => timeWindowBus.setWindow(w),
            onSelect: (keys) => selectionBus.select(keys),
          }),
      },
      {
        id: 'tiers',
        title: '3. Sequential Feature Tier Adoption (Palette B Mode Switcher)',
        weight: 1.0,
        render: (host, { timeWindowBus }) =>
          mountColumns(host, SAAS_TIER_COLUMNS, {
            layout: 'stacked',
            colorMode: 'sequential',
            legendPosition: 'bottom',
            showValueLabels: false,
            enableBrushZoom: true,
            onTimeWindowChange: (w) => timeWindowBus.setWindow(w),
          }),
      },
    ],
  });

  // 4. Mix & Match Demo III: SmallMultiplesPlate (Focus / Compare / Atlas)
  const multSec = makeSection('sec-multiples');
  const multBox = document.createElement('div');
  multBox.className = 'showcase-box showcase-box--tall';
  multSec.appendChild(multBox);

  const multiplesPlate = createSmallMultiplesPlate(multBox, {
    numeral: 'PLATE III · SMALL MULTIPLES & LINEAR RADIAL SCALE',
    title: 'REGIONAL CLEAN-ENERGY DYNAMOS',
    subtitle: 'Toggle Focus, Compare, or Atlas in the Top Whisper Bar. All dynamos share one synchronized linear radial scale.',
    mode: activeGridMode,
    items: ENERGY_DYNAMO_ITEMS,
    renderHeaderLeft: (host) =>
      createLegendDrawer(host, {
        title: 'How to Read the Dynamo',
        sections: [
          {
            heading: 'Radial Layers',
            items: [
              { swatchColor: '#D2B48C', swatchShape: 'circle', label: 'Core Disc', description: 'Baseline capacity & net growth delta.' },
              { swatchColor: '#2B5B84', swatchShape: 'square', label: 'Monthly Petals', description: 'Stacked wind & solar output radiating outward.' },
              { swatchColor: '#008055', swatchShape: 'circle', label: 'Satellites', description: 'Orbiting microgrids scaled linearly on the same radial axis.' },
            ],
          },
        ],
      }),
    renderHeaderRight: (host) =>
      mountSparkline(host, ENERGY_SPARKLINE_DATA),
    renderCell: (cellBody, { item, externalLegendEl }) =>
      mountRadialDynamo(cellBody, item.data, {
        externalLegendEl,
        showLegend: externalLegendEl !== null,
      }),
    onSelectItem: () => {
      activeGridMode = 'single';
      multiplesPlate.setMode('single');
      whisperBar.updateValue('grid-mode', 'single');
    },
  });

  // 5. Mix & Match Demo IV: FlipBook Companion Plate
  const flipSec = makeSection('sec-flipbook');
  const flipBox = document.createElement('div');
  flipBox.className = 'showcase-box';
  flipSec.appendChild(flipBox);

  createFlipBookPlate(flipBox, {
    pages: [
      {
        id: 'front',
        label: 'Quarterly Revenue',
        render: (pageEl) =>
          createSinglePlate(pageEl, {
            numeral: 'PLATE IV · FRONT (USE NEXT › OR ARROW KEYS)',
            title: 'QUARTERLY DIVISION REVENUE & OPERATING MARGIN',
            subtitle: 'Grouped columns with fiscal-year brackets, benchmark caps, and combo trend overlay.',
            renderMain: (stage, { externalLegendEl }) =>
              mountColumns(stage, FINANCIAL_COLUMNS_DATA, {
                externalLegendEl,
                layout: 'grouped',
                yAxisTitle: 'USD ($M)',
                benchmarkLabel: 'Guidance Target',
                lineOverlayLabel: 'Operating Margin',
                referenceLine: { value: 80, label: 'Stretch Plan' },
                formatValue: (v) => `$${v}M`,
              }),
          }),
      },
      {
        id: 'back',
        label: 'Capability Matrix',
        render: (pageEl) =>
          createSinglePlate(pageEl, {
            numeral: 'PLATE IV · COMPANION TABLE',
            title: 'DUBOIS-VIZ CHART CAPABILITY COVERAGE',
            subtitle: 'Archival structured coverage table paired as a companion page inside FlipBookPlate.',
            renderMain: (stage) =>
              mountTable(stage, CAPABILITY_TABLE_DATA, {
                rowHeaderLabel: 'Chart Module',
                totalsLabel: 'Coverage',
              }),
          }),
      },
    ],
  });

  // 6. Standalone Music Charts (Butterfly + Histogram + Line Chart)
  const musicSec = makeSection('sec-music');
  const musicGrid = document.createElement('div');
  musicGrid.className = 'showcase-grid-2';
  musicSec.appendChild(musicGrid);

  const m1 = document.createElement('div');
  m1.className = 'showcase-box';
  const m2 = document.createElement('div');
  m2.className = 'showcase-box';
  const m3 = document.createElement('div');
  m3.className = 'showcase-box';
  musicGrid.append(m1, m2, m3);

  createSinglePlate(m1, {
    numeral: 'PLATE V · MUSIC CHARTS',
    title: 'CHARTING SINGLES BY GENRE (2015 VS 2025)',
    subtitle: 'Click "+ POP" to expand sub-genres or toggle Top 10 vs. Debut Artists in the legend.',
    renderMain: (stage, { externalLegendEl }) =>
      mountButterfly(stage, MUSIC_BUTTERFLY_DATA, {
        externalLegendEl,
        colorMode: 'sequential',
        leftLabel: '2015 Cohort',
        rightLabel: '2025 Cohort',
        spineHeader: 'Genre',
        benchmarkLabel: '5-Yr Avg',
      }),
  });

  createSinglePlate(m2, {
    numeral: 'PLATE VI · ANCHORED HISTOGRAM',
    title: 'SINGLE RELEASE TO CHART PEAK LAG',
    subtitle: '3-zone pre / release-week / post distribution around week 0 with prior-year benchmark caps.',
    renderMain: (stage, { externalLegendEl }) =>
      mountHistogram(stage, RELEASE_LAG_HISTOGRAM, {
        externalLegendEl,
        xAxisTitle: 'Weeks Relative to Album Release',
        yAxisTitle: 'Charting Tracks',
        benchmarkLabel: 'Prior Year',
        anchor: {
          value: 0,
          preLabel: 'Pre-Release Single',
          anchorLabel: 'Release Week (0)',
          postLabel: 'Post-Release Climb',
        },
      }),
  });

  createSinglePlate(m3, {
    numeral: 'PLATE VII · LINE CHART',
    title: 'MULTI-WEEK STREAMING RETENTION BY GENRE',
    subtitle: 'Direct right-margin labels with collision avoidance, baseline comparison, and mode toggle.',
    renderMain: (stage, { externalLegendEl }) =>
      mountLineChart(stage, STREAMING_RETENTION_LINES, {
        externalLegendEl,
        yDomain: [0, 100],
        yAxisTitle: 'Listeners Retained (%)',
        xAxisTitle: 'Weeks Since Release',
        baselineLabel: 'Prior Year',
        formatValue: (v) => `${v}%`,
      }),
  });

  // 7. Standalone Finance Charts (Radial Coil + Ratio Pyramids + Heatmap)
  const finSec = makeSection('sec-finance');
  const finGrid = document.createElement('div');
  finGrid.className = 'showcase-grid-2';
  finSec.appendChild(finGrid);

  const f1 = document.createElement('div');
  f1.className = 'showcase-box';
  const f2 = document.createElement('div');
  f2.className = 'showcase-box';
  const f3 = document.createElement('div');
  f3.className = 'showcase-box';
  finGrid.append(f1, f2, f3);

  createSinglePlate(f1, {
    numeral: 'PLATE VIII · RADIAL COIL',
    title: 'ANNUAL CAPITAL ALLOCATION BY SECTOR',
    subtitle: 'Wrapped Du Bois spiral bars with radial benchmark notches.',
    renderMain: (stage, { externalLegendEl }) =>
      mountRadialCoil(stage, SECTOR_COIL_DATA, {
        externalLegendEl,
        benchmarkLabel: 'Prior Year',
        formatValue: (v) => `$${v}M`,
      }),
  });

  createSinglePlate(f2, {
    numeral: 'PLATE IX · RATIO PYRAMIDS',
    title: 'PARTNER-TO-ACCOUNT-TO-SEAT RATIOS',
    subtitle: 'Proportional N-tier funnels connected by archival ratio necks.',
    renderMain: (stage, { externalLegendEl }) =>
      mountRatioPyramids(stage, FUNNEL_PYRAMIDS_DATA, { externalLegendEl }),
  });

  createSinglePlate(f3, {
    numeral: 'PLATE X · HEATMAP',
    title: 'ASSET CLASS EXPOSURE BY REGION',
    subtitle: 'Proportional gouache discs with crisp India-ink outlines.',
    renderMain: (stage) =>
      mountHeatmap(stage, CORRELATION_HEATMAP, {
        rowAxisTitle: 'Asset Class',
        colAxisTitle: 'Market',
        valueLabel: 'Allocation Index',
      }),
  });

  // Top Whisper Bar + Searchable Vellum Popover for Energy Grid Selection
  let selectedGridIds = ENERGY_DYNAMO_ITEMS.map((i) => i.id);
  const gridPopover = createVellumPopover({
    title: 'Select Energy Grids',
    items: ENERGY_DYNAMO_ITEMS.map((i) => ({
      id: i.id,
      label: i.title,
      group: i.groupLabel,
      meta: i.subtitle,
    })),
    selectedIds: selectedGridIds,
    onChange: (ids) => {
      selectedGridIds = ids.length > 0 ? [...ids] : ENERGY_DYNAMO_ITEMS.map((i) => i.id);
      multiplesPlate.setItems(
        ENERGY_DYNAMO_ITEMS.filter((i) => selectedGridIds.includes(i.id))
      );
      whisperBar.updateSummary(
        'grid-filter',
        selectedGridIds.length === ENERGY_DYNAMO_ITEMS.length
          ? 'All Grids'
          : `${selectedGridIds.length} Selected`
      );
    },
  });

  const whisperBar = createWhisperBar(whisperHost, [
    {
      kind: 'select',
      id: 'jump',
      label: 'Jump',
      value: 'sec-cover',
      options: [
        { value: 'sec-cover', label: 'Cover' },
        { value: 'sec-toc', label: 'Bookshelf TOC' },
        { value: 'sec-crossfilter', label: 'I. Map + Butterfly' },
        { value: 'sec-stack', label: 'II. Synced Cohort Stack' },
        { value: 'sec-multiples', label: 'III. Energy Dynamos' },
        { value: 'sec-flipbook', label: 'IV. FlipBook Plate' },
        { value: 'sec-music', label: 'V–VII. Music Charts' },
        { value: 'sec-finance', label: 'VIII–X. Finance Charts' },
      ],
      onChange: (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    { kind: 'separator' },
    {
      kind: 'segmented',
      id: 'grid-mode',
      label: 'Dynamo Layout',
      value: activeGridMode,
      options: [
        { value: 'single', label: 'Focus' },
        { value: 'compare', label: 'Compare' },
        { value: 'atlas', label: 'Atlas' },
      ],
      onChange: (val) => {
        activeGridMode = val as SmallMultiplesMode;
        multiplesPlate.setMode(activeGridMode);
      },
    },
    {
      kind: 'trigger',
      id: 'grid-filter',
      label: 'Grids',
      summary: 'All Grids',
      onClick: (anchor) => gridPopover.toggle(anchor),
    },
    {
      kind: 'button',
      id: 'export-svg',
      label: 'Export SVG ⤓',
      pushRight: true,
      onClick: () => {
        const svg = activeExportSvg();
        if (svg) exportSvgElement(svg, 'dubois-viz-plate.svg');
      },
    },
  ]);
}
