import * as d3 from 'd3';

// ============================================================================
// Self-Contained Branded Types & Contracts (Zero Local Imports)
// ============================================================================
export type TableChartId = string & { readonly __brand: 'TableChartId' };
export const asTableChartId = (id: string): TableChartId => id as TableChartId;

export interface TooltipSpec {
  readonly title: string;
  readonly swatchColor?: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}

export interface TableColumnGroup {
  readonly id: string;
  readonly label: string;
  readonly colorMode?: 'solid' | 'sequential';
  readonly color?: string;
}

export interface TableColumn {
  readonly id: string;
  readonly groupId?: string;
  readonly label: string;
  readonly fullLabel?: string;
  readonly color?: string;
}

export interface TableCellValue {
  readonly value: number | boolean;
  readonly benchmarkValue?: number | boolean;
  readonly label?: string;
}

export interface TableRow {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly cells: Readonly<Record<string, TableCellValue | undefined>>;
}

export interface TableData {
  readonly columnGroups?: readonly TableColumnGroup[];
  readonly columns: readonly TableColumn[];
  readonly rows: readonly TableRow[];
}

export interface TableOptions {
  readonly chartId?: string;
  readonly ariaLabel?: string;
  readonly rowHeaderLabel?: string;
  readonly cellMode?: 'presence' | 'value';
  readonly showTotalsColumn?: boolean;
  readonly totalsLabel?: string;
  readonly showTooltip?: boolean;
  readonly formatValue?: (value: number) => string;
  readonly formatTooltip?: (
    row: TableRow,
    col: TableColumn,
    cell: TableCellValue | undefined
  ) => TooltipSpec | null;
  readonly onSelect?: (keys: readonly string[]) => void;
  readonly onHover?: (key: string | null) => void;
}

export interface TableChartInstance {
  readonly chartId: TableChartId;
  update(data: TableData, options?: Partial<TableOptions>): void;
  resize(): void;
  getSvgElement(): SVGSVGElement | null;
  setSelectedKeys(keys: readonly string[]): void;
  setHoveredKey(key: string | null): void;
  destroy(): void;
}

const PALETTE_A: readonly string[] = [
  '#DC143C',
  '#2B5B84',
  '#008055',
  '#E87722',
  '#753ABD',
  '#00A7B5',
  '#FFD700',
  '#654321',
  '#D2B48C',
];

const PALETTE_B: readonly string[] = [
  '#A50050',
  '#DC143C',
  '#EE5340',
  '#FFA400',
  '#FFCD00',
  '#FAE053',
  '#DBE442',
  '#8FD14F',
  '#00A651',
  '#007A5E',
  '#00A7B5',
  '#2B5B84',
  '#6638B6',
  '#AF3BC9',
];

const FALLBACK_STYLE_ID = 'dubois-table-fallback-style';

function ensureFallbackStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(FALLBACK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FALLBACK_STYLE_ID;
  style.textContent = `
    .dubois-table-wrap{inline-size:100%;block-size:100%;overflow:auto;background:var(--dubois-parchment,#F4EFE6);color:var(--dubois-ink,#1A1615);font-family:var(--dubois-font-mono,monospace);padding:4px 0;box-sizing:border-box}
    .dubois-table{inline-size:100%;border-collapse:collapse;font-size:10px;line-height:1.25}
    .dubois-table th,.dubois-table td{border:1px solid var(--dubois-ink,#1A1615);padding:4px 6px;text-align:center;vertical-align:middle}
    .dubois-table thead th{background:var(--dubois-vellum,#EAE2D3);font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
    .dubois-table .dubois-table-group-th{background:var(--dubois-ink,#1A1615);color:var(--dubois-parchment,#F4EFE6);font-family:var(--dubois-font-title,sans-serif);font-size:10px;letter-spacing:0.08em}
    .dubois-table .dubois-table-row-th{text-align:left;background:var(--dubois-parchment,#F4EFE6);font-weight:700;white-space:nowrap;cursor:pointer}
    .dubois-table tbody tr:hover .dubois-table-row-th{background:var(--dubois-vellum,#EAE2D3)}
    .dubois-table tbody tr.is-dimmed{opacity:0.42}
    .dubois-table-swatch{display:inline-block;inline-size:14px;block-size:14px;border:1px solid var(--dubois-ink,#1A1615);vertical-align:middle}
    .dubois-table-empty{color:var(--dubois-guideline,#8C7A6B)}
    .dubois-table-delta-up{color:var(--dubois-emerald,#008055);font-weight:700;margin-inline-start:3px;font-size:9px}
    .dubois-table-delta-down{color:var(--dubois-crimson,#DC143C);font-weight:700;margin-inline-start:3px;font-size:9px}
    .dubois-exhibition-tooltip{position:fixed;background:var(--dubois-parchment,#F4EFE6);border:2px solid var(--dubois-ink,#1A1615);box-shadow:4px 4px 0 var(--dubois-ink,#1A1615);min-inline-size:200px;max-inline-size:320px;pointer-events:none;z-index:1200;font-family:var(--dubois-font-mono,monospace);font-size:11px;color:var(--dubois-ink,#1A1615)}
    .dubois-exhibition-tooltip-header{background:var(--dubois-ink,#1A1615);color:var(--dubois-parchment,#F4EFE6);padding:5px 9px;font-weight:700;text-transform:uppercase;display:flex;align-items:center;gap:7px}
    .dubois-exhibition-tooltip-swatch{inline-size:10px;block-size:10px;border:1px solid var(--dubois-parchment,#F4EFE6);flex-shrink:0}
    .dubois-exhibition-tooltip-body{padding:7px 9px;display:flex;flex-direction:column;gap:3px}
    .dubois-exhibition-tooltip-row{display:flex;justify-content:space-between;gap:12px}
    .dubois-exhibition-tooltip-key{color:var(--dubois-charcoal,#52493E)}
    .dubois-exhibition-tooltip-val{color:var(--dubois-ink,#1A1615);font-weight:700}
  `;
  document.head.appendChild(style);
}

function sampleSequential(idx: number, total: number): string {
  if (total <= 1) return PALETTE_B[0]!;
  const scaled = Math.round((idx / (total - 1)) * (PALETTE_B.length - 1));
  return PALETTE_B[Math.max(0, Math.min(PALETTE_B.length - 1, scaled))]!;
}

function isActiveCell(cell: TableCellValue | undefined): boolean {
  if (!cell) return false;
  return typeof cell.value === 'boolean' ? cell.value : cell.value > 0;
}

/**
 * Archival Structured Table supporting grouped column headers, presence swatches,
 * numeric values, optional prior-period deltas, and interactive row selection.
 */
export function mountTable(
  container: HTMLElement,
  initialData: TableData,
  initialOptions: TableOptions = {}
): TableChartInstance {
  ensureFallbackStyles();

  const chartId = asTableChartId(
    initialOptions.chartId ?? `table-${Math.random().toString(36).slice(2, 8)}`
  );

  let data: TableData = initialData;
  let options: TableOptions = { ...initialOptions };
  let selectedKeys = new Set<string>();
  let hoveredKey: string | null = null;

  const root = document.createElement('div');
  root.className = 'dubois-chart-root';
  root.dataset['chartId'] = chartId;
  const wrap = document.createElement('div');
  wrap.className = 'dubois-table-wrap';
  root.appendChild(wrap);
  container.innerHTML = '';
  container.appendChild(root);

  let tooltipEl: HTMLDivElement | null = null;

  function showTooltip(ev: MouseEvent, spec: TooltipSpec | null): void {
    if (options.showTooltip === false || !spec) return;
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'dubois-exhibition-tooltip';
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.innerHTML = '';
    const hdr = document.createElement('div');
    hdr.className = 'dubois-exhibition-tooltip-header';
    if (spec.swatchColor) {
      const sw = document.createElement('span');
      sw.className = 'dubois-exhibition-tooltip-swatch';
      sw.style.backgroundColor = spec.swatchColor;
      hdr.appendChild(sw);
    }
    const title = document.createElement('span');
    title.textContent = spec.title;
    hdr.appendChild(title);
    const body = document.createElement('div');
    body.className = 'dubois-exhibition-tooltip-body';
    for (const row of spec.rows) {
      const r = document.createElement('div');
      r.className = 'dubois-exhibition-tooltip-row';
      const k = document.createElement('span');
      k.className = 'dubois-exhibition-tooltip-key';
      k.textContent = row.label;
      const v = document.createElement('span');
      v.className = 'dubois-exhibition-tooltip-val';
      v.textContent = row.value;
      r.append(k, v);
      body.appendChild(r);
    }
    tooltipEl.append(hdr, body);
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = `${Math.max(8, Math.min(ev.clientX + 14, window.innerWidth - 260))}px`;
    tooltipEl.style.top = `${Math.max(8, Math.min(ev.clientY + 14, window.innerHeight - 140))}px`;
  }

  function hideTooltip(): void {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function render(): void {
    const sel = d3.select(wrap);
    sel.selectAll('*').remove();

    if (data.columns.length === 0 || data.rows.length === 0) {
      sel.append('div').attr('class', 'dubois-empty-notice').text('NO TABLE DATA');
      return;
    }

    const fmt = options.formatValue ?? ((v: number) => (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1)));
    const cellMode = options.cellMode ?? 'presence';
    const showTotals = options.showTotalsColumn !== false;

    const groupsMap = new Map<string, TableColumnGroup>();
    data.columnGroups?.forEach((g) => groupsMap.set(g.id, g));

    const colsByGroup = new Map<string, TableColumn[]>();
    for (const col of data.columns) {
      const gid = col.groupId ?? '__ungrouped__';
      const arr = colsByGroup.get(gid) ?? [];
      arr.push(col);
      colsByGroup.set(gid, arr);
    }

    const colColorMap = new Map<string, string>();
    let groupIdx = 0;
    for (const [gid, cols] of colsByGroup) {
      const grp = groupsMap.get(gid);
      cols.forEach((col, cIdx) => {
        if (col.color) {
          colColorMap.set(col.id, col.color);
        } else if (grp?.colorMode === 'sequential') {
          colColorMap.set(col.id, sampleSequential(cIdx, cols.length));
        } else if (grp?.color) {
          colColorMap.set(col.id, grp.color);
        } else {
          colColorMap.set(col.id, PALETTE_A[groupIdx % PALETTE_A.length]!);
        }
      });
      groupIdx += 1;
    }

    const table = sel
      .append('table')
      .attr('class', 'dubois-table')
      .attr('aria-label', options.ariaLabel ?? 'Archival coverage table');
    const thead = table.append('thead');

    if (data.columnGroups && data.columnGroups.length > 0) {
      const groupRow = thead.append('tr');
      groupRow
        .append('th')
        .attr('rowspan', 2)
        .text(options.rowHeaderLabel ?? 'Entity');

      for (const [gid, cols] of colsByGroup) {
        const grp = groupsMap.get(gid);
        groupRow
          .append('th')
          .attr('class', 'dubois-table-group-th')
          .attr('colspan', cols.length)
          .text(grp?.label ?? '');
      }
      if (showTotals) {
        groupRow
          .append('th')
          .attr('rowspan', 2)
          .text(options.totalsLabel ?? 'Total');
      }
    }

    const colRow = thead.append('tr');
    if (!data.columnGroups || data.columnGroups.length === 0) {
      colRow.append('th').text(options.rowHeaderLabel ?? 'Entity');
    }
    for (const col of data.columns) {
      colRow
        .append('th')
        .attr('title', col.fullLabel ?? col.label)
        .text(col.label);
    }
    if (showTotals && (!data.columnGroups || data.columnGroups.length === 0)) {
      colRow.append('th').text(options.totalsLabel ?? 'Total');
    }

    const tbody = table.append('tbody');
    for (const row of data.rows) {
      const isDimmed =
        (selectedKeys.size > 0 && !selectedKeys.has(row.id)) ||
        (hoveredKey !== null && hoveredKey !== row.id);

      const tr = tbody
        .append('tr')
        .classed('is-dimmed', isDimmed);

      const th = tr
        .append('th')
        .attr('class', 'dubois-table-row-th')
        .on('click', () => {
          if (selectedKeys.has(row.id) && selectedKeys.size === 1) selectedKeys.clear();
          else selectedKeys = new Set([row.id]);
          options.onSelect?.(Array.from(selectedKeys));
          render();
        })
        .on('mouseenter', () => {
          hoveredKey = row.id;
          options.onHover?.(row.id);
        })
        .on('mouseleave', () => {
          hoveredKey = null;
          options.onHover?.(null);
        });

      th.append('div').text(row.label);
      if (row.subtitle) {
        th.append('div')
          .style('font-weight', '400')
          .style('font-size', '9px')
          .style('color', 'var(--dubois-charcoal, #52493E)')
          .text(row.subtitle);
      }

      let activeCount = 0;
      let numericSum = 0;

      for (const col of data.columns) {
        const cell = row.cells[col.id];
        const active = isActiveCell(cell);
        if (active) activeCount += 1;
        if (cell && typeof cell.value === 'number') numericSum += cell.value;

        const color = colColorMap.get(col.id) ?? PALETTE_A[0]!;
        const td = tr
          .append('td')
          .on('mousemove', (ev: MouseEvent) => {
            const valText =
              cell === undefined
                ? '—'
                : cell.label ??
                  (typeof cell.value === 'boolean'
                    ? cell.value
                      ? 'Present'
                      : 'Absent'
                    : fmt(cell.value));
            const rows: { label: string; value: string }[] = [
              { label: 'Column', value: col.fullLabel ?? col.label },
              { label: 'Value', value: valText },
            ];
            if (cell?.benchmarkValue !== undefined) {
              rows.push({
                label: 'Benchmark',
                value:
                  typeof cell.benchmarkValue === 'boolean'
                    ? cell.benchmarkValue
                      ? 'Present'
                      : 'Absent'
                    : fmt(cell.benchmarkValue),
              });
            }
            const spec = options.formatTooltip
              ? options.formatTooltip(row, col, cell)
              : {
                  title: row.label,
                  swatchColor: active ? color : '#DED6C6',
                  rows,
                };
            showTooltip(ev, spec);
          })
          .on('mouseleave', hideTooltip);

        if (!active) {
          td.append('span').attr('class', 'dubois-table-empty').text('·');
        } else if (cellMode === 'presence') {
          td.append('span')
            .attr('class', 'dubois-table-swatch')
            .style('background-color', color);
        } else {
          const textVal =
            cell?.label ??
            (typeof cell?.value === 'number' ? fmt(cell.value) : '✓');
          td.append('span').style('font-weight', '700').text(textVal);
          if (
            cell &&
            typeof cell.value === 'number' &&
            typeof cell.benchmarkValue === 'number' &&
            cell.value !== cell.benchmarkValue
          ) {
            const diff = cell.value - cell.benchmarkValue;
            td.append('span')
              .attr('class', diff > 0 ? 'dubois-table-delta-up' : 'dubois-table-delta-down')
              .text(diff > 0 ? `+${fmt(diff)}` : fmt(diff));
          }
        }
      }

      if (showTotals) {
        tr.append('td')
          .style('font-weight', '700')
          .text(
            cellMode === 'presence'
              ? `${activeCount}/${data.columns.length}`
              : fmt(numericSum)
          );
      }
    }
  }

  render();

  return {
    chartId,
    update(nextData: TableData, nextOptions?: Partial<TableOptions>): void {
      data = nextData;
      if (nextOptions) options = { ...options, ...nextOptions };
      render();
    },
    resize: render,
    getSvgElement: () => null,
    setSelectedKeys(keys: readonly string[]): void {
      selectedKeys = new Set(keys);
      render();
    },
    setHoveredKey(key: string | null): void {
      hoveredKey = key;
      render();
    },
    destroy(): void {
      tooltipEl?.remove();
      tooltipEl = null;
      root.remove();
    },
  };
}

export const TableChart = {
  id: 'table',
  mount: mountTable,
} as const;
