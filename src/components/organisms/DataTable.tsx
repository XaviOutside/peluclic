import type { ReactNode } from 'react';
import Avatar from '@/components/atoms/Avatar';
import Spinner from '@/components/atoms/Spinner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ColumnConfig<T> {
  /** Column header shown in desktop table view */
  header: string;
  /** Render function for the cell content */
  render: (row: T) => ReactNode;
  /** Whether this column should be visible on mobile card view (default: true) */
  mobileVisible?: boolean;
  /** Custom CSS grid column span for desktop (default: "auto") */
  span?: string;
  /** Text alignment on desktop (default: left) */
  align?: 'left' | 'right' | 'center';
}

export interface RowAction<T> {
  /** Unique key for this action */
  key: string;
  /** Label shown in tooltip / screen readers */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Called when the action is clicked */
  onAction: (row: T) => void;
  /** Destructive actions get error/red styling */
  destructive?: boolean;
}

export interface DataTableProps<T> {
  /** Array of items to display */
  data: T[];
  /** Column definitions */
  columns: ColumnConfig<T>[];
  /** Function to extract a unique key from a row */
  rowKey: (row: T) => string | number;
  /** Optional: display name for avatar column (maps to the first column) */
  avatarName?: (row: T) => string;
  /** Optional: avatar image src */
  avatarSrc?: (row: T) => string | undefined;
  /** Row actions shown as icon buttons */
  rowActions?: RowAction<T>[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called when the retry button is clicked (error state) */
  onRetry?: () => void;
  /** Empty state message (default: "No items found.") */
  emptyMessage?: string;
  /** Whether to show the desktop table header row */
  showHeader?: boolean;
  /** Extra class on the root element */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Grid span helper                                                    */
/* ------------------------------------------------------------------ */

const ALIGN_CLASSES: Record<string, string> = {
  left: '',
  right: 'text-right',
  center: 'text-center',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DataTable<T>({
  data,
  columns,
  rowKey,
  avatarName,
  avatarSrc,
  rowActions,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No items found.',
  showHeader = true,
  className = '',
}: DataTableProps<T>) {
  /* ── Loading state ── */
  if (loading && data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-bright p-16"
        data-testid="datatable-loading"
      >
        <Spinner size="lg" />
      </div>
    );
  }

  /* ── Error state ── */
  if (error && data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-error-container bg-error-container/30 p-12 text-center"
        data-testid="datatable-error"
      >
        <span className="material-symbols-outlined text-4xl text-error mb-3" aria-hidden="true">
          error
        </span>
        <p className="text-body-md text-on-error-container mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-primary-container px-4 py-2 text-label-md font-headline text-on-primary-container transition-colors hover:brightness-110"
            data-testid="datatable-retry"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  /* ── Empty state ── */
  if (data.length === 0 && !loading) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-bright p-12 text-center"
        data-testid="datatable-empty"
      >
        <span className="material-symbols-outlined text-4xl text-outline mb-3" aria-hidden="true">
          search_off
        </span>
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  /* ── Desktop column count ── */
  const totalCols = columns.length + (rowActions ? 1 : 0);

  return (
    <div
      className={`rounded-2xl border border-outline-variant/30 bg-surface-bright shadow-sm overflow-hidden flex flex-col ${className}`}
      data-testid="datatable"
    >
      {/* Desktop table header */}
      {showHeader && (
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/50 font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
          {columns.map((col, idx) => (
            <div
              key={`hdr-${idx}`}
              className={col.span || `col-span-${Math.max(1, Math.floor(12 / totalCols))}`}
            >
              {col.header}
            </div>
          ))}
          {rowActions && (
            <div className="col-span-1 text-right">Actions</div>
          )}
        </div>
      )}

      {/* Rows — card on mobile, table row on desktop */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-0 flex flex-col gap-2 sm:gap-0">
        {data.map((row) => (
          <div
            key={rowKey(row)}
            className="bg-surface-container-lowest sm:bg-transparent rounded-xl sm:rounded-none p-4 sm:p-4 border border-outline-variant/20 sm:border-b sm:border-x-0 sm:border-t-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center transition-colors hover:bg-surface-container-low/50"
            data-testid="datatable-row"
          >
            {/* Columns */}
            {columns.map((col, idx) => {
              const isFirst = idx === 0 && avatarName;
              const alignClass = col.align ? ALIGN_CLASSES[col.align] : '';
              const spanClass =
                col.span || `sm:col-span-${Math.max(1, Math.floor(12 / totalCols))}`;

              return (
                <div
                  key={`cell-${rowKey(row)}-${idx}`}
                  className={`${isFirst ? 'flex items-center gap-3' : ''} ${!col.mobileVisible && col.mobileVisible !== undefined ? 'hidden sm:flex sm:flex-col sm:gap-1' : 'flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-0'} ${spanClass} ${alignClass}`}
                  data-testid={`cell-${col.header.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {isFirst && avatarName && (
                    <Avatar
                      name={avatarName(row)}
                      src={avatarSrc?.(row)}
                      size="md"
                    />
                  )}
                  <div className={isFirst ? '' : 'contents'}>
                    {/* Mobile label */}
                    {!isFirst && (
                      <span className="font-headline font-medium text-on-surface-variant sm:hidden text-xs uppercase tracking-wider mb-0.5">
                        {col.header}
                      </span>
                    )}
                    <span
                      className={
                        isFirst
                          ? ''
                          : 'text-body-md text-on-surface'
                      }
                    >
                      {col.render(row)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Row Actions */}
            {rowActions && rowActions.length > 0 && (
              <div className="flex flex-wrap sm:justify-end gap-2 mt-2 sm:mt-0 col-span-1 sm:col-span-1">
                {rowActions.map((action) => (
                  <button
                    key={`action-${rowKey(row)}-${action.key}`}
                    type="button"
                    onClick={() => action.onAction(row)}
                    title={action.label}
                    aria-label={action.label}
                    className={`p-1.5 rounded-md transition-colors ${
                      action.destructive
                        ? 'text-status-error hover:bg-error-container hover:text-on-error-container'
                        : 'text-secondary hover:bg-secondary-container'
                    }`}
                    data-testid={`row-action-${action.key}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {action.icon}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
