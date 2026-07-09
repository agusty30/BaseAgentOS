import * as React from 'react';
import { cn } from '../lib/utils';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Column<T> {
  /** Property key or unique column id */
  key: string;
  /** Column header text */
  header: string;
  /** Custom cell renderer – receives the row data */
  render?: (row: T) => React.ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Optional fixed width (e.g. '120px', '25%') */
  width?: string;
}

export interface TableProps<T> extends React.HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  /** Currently sorted column key */
  sortColumn?: string;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Callback when a sortable column header is clicked */
  onSort?: (columnKey: string) => void;
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Show skeleton loading rows */
  loading?: boolean;
  /** Number of skeleton rows to render while loading (default 5) */
  loadingRows?: number;
  /** Getter for a unique key per row (defaults to index) */
  rowKey?: (row: T, index: number) => string | number;
}

// ── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </td>
      ))}
    </tr>
  );
}

// ── Sort Indicator ──────────────────────────────────────────────────────────

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction?: 'asc' | 'desc';
}) {
  if (!active) {
    return (
      <svg
        className="ml-1 inline h-4 w-4 text-slate-300 dark:text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    );
  }
  return (
    <svg
      className="ml-1 inline h-4 w-4 text-slate-700 dark:text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {direction === 'asc' ? (
        <path d="M8 15l4-4 4 4" />
      ) : (
        <path d="M8 9l4 4 4-4" />
      )}
    </svg>
  );
}

// ── Table ───────────────────────────────────────────────────────────────────

function TableInner<T>(
  {
    columns,
    data,
    sortColumn,
    sortDirection,
    onSort,
    emptyMessage = 'No data available',
    loading = false,
    loadingRows = 5,
    rowKey,
    className,
    ...props
  }: TableProps<T>,
  ref: React.ForwardedRef<HTMLTableElement>,
) {
  return (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm',
          className,
        )}
        {...props}
      >
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider',
                  'text-slate-500 dark:text-slate-400',
                  col.sortable && 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200',
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={
                  col.sortable && onSort
                    ? () => onSort(col.key)
                    : undefined
                }
              >
                <span className="inline-flex items-center">
                  {col.header}
                  {col.sortable && (
                    <SortIndicator
                      active={sortColumn === col.key}
                      direction={
                        sortColumn === col.key ? sortDirection : undefined
                      }
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <SkeletonRow key={i} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className={cn(
                  'border-b border-slate-100 transition-colors',
                  'hover:bg-slate-50',
                  'dark:border-slate-800 dark:hover:bg-slate-800/50',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// React.forwardRef doesn't support generics directly – use a type assertion.
const Table = React.forwardRef(TableInner) as <T>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLTableElement> },
) => React.ReactElement;

export { Table };
export type { Column as TableColumn };
