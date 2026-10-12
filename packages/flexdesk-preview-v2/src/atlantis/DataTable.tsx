/**
 * DataTable - Local implementation matching @jobber/components DataTable API
 *
 * This provides the same interface as the Atlantis component library's DataTable,
 * allowing future migration to the actual library when fully integrated.
 *
 * This is a standalone implementation that doesn't require @tanstack/react-table,
 * to avoid dependency issues in the monorepo. It provides similar functionality
 * using pure React.
 *
 * @see https://atlantis.getjobber.com/components/DataTable
 */
import React, { useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Text } from './Text';
import { Icon } from './Icon';

// =============================================================================
// TYPES
// =============================================================================

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface ManualPagination {
  state: PaginationState;
  pageCount: number;
  onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>;
  manualPagination: true;
  itemsPerPage?: number[];
  totalItems: number;
}

export interface DefaultPagination {
  manualPagination: false;
  itemsPerPage?: number[];
}

export type PaginationType = DefaultPagination | ManualPagination;

export interface ManualSorting {
  state: SortingState[];
  manualSorting: true;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState[]>>;
  enableSortingRemoval?: boolean;
}

export interface DefaultSorting {
  manualSorting: false;
}

export type SortingType = DefaultSorting | ManualSorting;

/**
 * Column definition type - simplified version of TanStack's ColumnDef
 */
export interface ColumnDef<T, V = unknown> {
  id?: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => V;
  header: string | ((context: { column: { id: string } }) => ReactNode);
  cell?: (info: CellContext<T, V>) => ReactNode;
  size?: number;
  minSize?: number;
  enableSorting?: boolean;
}

export interface CellContext<T, V = unknown> {
  getValue: () => V;
  row: {
    original: T;
    index: number;
    getIsSelected: () => boolean;
    toggleSelected: () => void;
  };
  column: {
    id: string;
  };
}

export interface Row<T> {
  original: T;
  index: number;
  id: string;
  getIsSelected: () => boolean;
  toggleSelected: () => void;
}

export interface DataTableProps<T> {
  /**
   * The actual data that will be used for the table
   */
  readonly data: T[];

  /**
   * Column definitions
   */
  readonly columns: ColumnDef<T, unknown>[];

  /**
   * Pagination configuration
   */
  readonly pagination?: PaginationType;

  /**
   * Sorting configuration
   */
  readonly sorting?: SortingType;

  /**
   * Fixed height for the table container
   */
  readonly height?: number | string;

  /**
   * Makes the header sticky while scrolling vertically
   */
  readonly stickyHeader?: boolean;

  /**
   * Pins the first column when scrolling horizontally
   */
  readonly pinFirstColumn?: boolean;

  /**
   * Row click handler
   */
  readonly onRowClick?: (row: Row<T>) => void;

  /**
   * Elements to display when the table is empty
   */
  readonly emptyState?: ReactNode;

  /**
   * Whether the table is in a loading state
   */
  readonly loading?: boolean;

  /**
   * Row selection mode: 'single', 'multiple', or false
   */
  readonly rowSelection?: 'single' | 'multiple' | false;

  /**
   * Callback when selection changes
   */
  readonly onSelectionChanged?: (selectedRows: T[]) => void;

  /**
   * Enable drag-and-drop column reordering
   */
  readonly columnReordering?: boolean;

  /**
   * Controlled column order (array of column IDs)
   */
  readonly columnOrder?: string[];

  /**
   * Callback when column order changes via drag-and-drop
   */
  readonly onColumnOrderChange?: (newOrder: string[]) => void;

  /**
   * Additional className for the container
   */
  readonly className?: string;
}

// =============================================================================
// HELPER FUNCTION: createColumnHelper
// =============================================================================

type ColumnAccessor<T> = keyof T | string;

interface ColumnHelper<T> {
  accessor: <K extends ColumnAccessor<T>>(
    accessor: K,
    options: Omit<ColumnDef<T, K extends keyof T ? T[K] : unknown>, 'accessorKey' | 'accessorFn'>
  ) => ColumnDef<T, K extends keyof T ? T[K] : unknown>;

  display: (options: Omit<ColumnDef<T, unknown>, 'accessorKey' | 'accessorFn'> & { id: string }) => ColumnDef<T, unknown>;
}

export function createColumnHelper<T>(): ColumnHelper<T> {
  return {
    accessor: (accessor, options) => ({
      ...options,
      id: options.id ?? String(accessor),
      accessorKey: accessor as keyof T,
    }),
    display: (options) => ({
      ...options,
      enableSorting: false,
    }),
  };
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

interface SortIconProps {
  readonly direction: 'asc' | 'desc' | false;
}

function SortIcon({ direction }: SortIconProps) {
  if (!direction) {
    return <Icon name="sort" size="small" className="text-[var(--color-text--secondary)] opacity-50" />;
  }

  return (
    <Icon
      name={direction === 'asc' ? 'arrowUp' : 'arrowDown'}
      size="small"
      className="text-[var(--color-text)]"
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataTable<T extends object>({
  data,
  columns,
  pagination,
  sorting,
  height,
  stickyHeader = true,
  pinFirstColumn = false,
  onRowClick,
  emptyState,
  loading = false,
  rowSelection = false,
  onSelectionChanged,
  columnReordering = false,
  columnOrder: controlledColumnOrder,
  onColumnOrderChange,
  className,
}: DataTableProps<T>) {
  // Internal sorting state when not manually controlled
  const [internalSorting, setInternalSorting] = useState<SortingState[]>([]);

  // Internal pagination state when not manually controlled
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pagination?.itemsPerPage?.[0] ?? 25,
  });

  // Row selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  // Column reordering state
  const defaultColumnOrder = useMemo(
    () => columns.map((c) => c.id ?? String(c.accessorKey)),
    [columns]
  );
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(defaultColumnOrder);
  const columnOrder = controlledColumnOrder ?? internalColumnOrder;
  const setColumnOrder = useCallback(
    (newOrder: string[]) => {
      if (onColumnOrderChange) {
        onColumnOrderChange(newOrder);
      } else {
        setInternalColumnOrder(newOrder);
      }
    },
    [onColumnOrderChange]
  );

  // Drag-and-drop state (AG Grid style — live reordering)
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const lastSwapRef = useRef<string | null>(null);

  // Reorder columns based on columnOrder
  const orderedColumns = useMemo(() => {
    if (!columnReordering) return columns;
    const orderMap = new Map(columnOrder.map((id, idx) => [id, idx]));
    return [...columns].sort((a, b) => {
      const aId = a.id ?? String(a.accessorKey);
      const bId = b.id ?? String(b.accessorKey);
      const aIdx = orderMap.get(aId) ?? Infinity;
      const bIdx = orderMap.get(bId) ?? Infinity;
      return aIdx - bIdx;
    });
  }, [columns, columnOrder, columnReordering]);

  // AG Grid style: live reorder during drag
  const liveReorder = useCallback(
    (sourceId: string, targetId: string, clientX: number, targetRect: DOMRect) => {
      if (sourceId === targetId) return;
      const currentOrder = [...columnOrder];
      const sourceIdx = currentOrder.indexOf(sourceId);
      const targetIdx = currentOrder.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return;

      // Determine if cursor is past the midpoint of the target column
      const midX = targetRect.left + targetRect.width / 2;
      const shouldInsertBefore = clientX < midX;

      // Calculate desired insert position
      const orderWithoutSource = currentOrder.filter((id) => id !== sourceId);
      const newTargetIdx = orderWithoutSource.indexOf(targetId);
      const insertIdx = shouldInsertBefore ? newTargetIdx : newTargetIdx + 1;
      orderWithoutSource.splice(insertIdx, 0, sourceId);

      // Only update if order actually changed
      if (orderWithoutSource.join(',') !== currentOrder.join(',')) {
        setColumnOrder(orderWithoutSource);
      }
    },
    [columnOrder, setColumnOrder]
  );

  // Drag handlers — AG Grid style
  const handleDragStart = useCallback(
    (e: React.DragEvent, columnId: string) => {
      isDraggingRef.current = true;
      lastSwapRef.current = null;
      setDragColumnId(columnId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', columnId);

      // Create a custom drag image from the header cell
      const th = e.currentTarget as HTMLElement;
      const ghost = th.cloneNode(true) as HTMLElement;
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.width = `${th.offsetWidth}px`;
      ghost.style.padding = '8px 16px';
      ghost.style.background = 'var(--color-surface, #fff)';
      ghost.style.border = '1px solid var(--color-border, #d1d5db)';
      ghost.style.borderRadius = '4px';
      ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      ghost.style.opacity = '0.9';
      ghost.style.fontSize = '13px';
      ghost.style.fontWeight = '500';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, th.offsetWidth / 2, th.offsetHeight / 2);

      requestAnimationFrame(() => {
        document.body.removeChild(ghost);
      });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDragColumnId(null);
    lastSwapRef.current = null;
    // Reset dragging flag after a tick so the click handler can check it
    requestAnimationFrame(() => {
      isDraggingRef.current = false;
    });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!dragColumnId || columnId === dragColumnId) return;

      // Live reorder: immediately move the column as cursor enters a new column
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      liveReorder(dragColumnId, columnId, e.clientX, rect);
    },
    [dragColumnId, liveReorder]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Column is already in its final position from live reorder
    setDragColumnId(null);
    lastSwapRef.current = null;
  }, []);

  // Determine sorting state and handler
  const sortingState = sorting?.manualSorting ? sorting.state : internalSorting;
  const onSortingChange = sorting?.manualSorting ? sorting.onSortingChange : setInternalSorting;

  // Determine pagination state and handler
  const paginationState = pagination?.manualPagination ? pagination.state : internalPagination;
  const onPaginationChange = pagination?.manualPagination
    ? pagination.onPaginationChange
    : setInternalPagination;

  // Get cell value from a column definition
  const getCellValue = useCallback((row: T, column: ColumnDef<T, unknown>): unknown => {
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return undefined;
  }, []);

  // Sort data if sorting is enabled
  const sortedData = useMemo(() => {
    if (!sorting || sortingState.length === 0) {
      return data;
    }

    const sortConfig = sortingState[0];
    const column = columns.find(c => (c.id ?? c.accessorKey) === sortConfig.id);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.desc ? -comparison : comparison;
    });
  }, [data, sorting, sortingState, columns, getCellValue]);

  // Paginate data if pagination is enabled
  const paginatedData = useMemo(() => {
    if (!pagination) {
      return sortedData;
    }

    if (pagination.manualPagination) {
      // Manual pagination means data is already paginated
      return sortedData;
    }

    const start = paginationState.pageIndex * paginationState.pageSize;
    const end = start + paginationState.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination, paginationState]);

  // Calculate page count
  const pageCount = useMemo(() => {
    if (!pagination) return 0;
    if (pagination.manualPagination) {
      return pagination.pageCount;
    }
    return Math.ceil(data.length / paginationState.pageSize);
  }, [pagination, data.length, paginationState.pageSize]);

  // Total items for pagination display
  const totalItems = useMemo(() => {
    if (pagination?.manualPagination) {
      return pagination.totalItems;
    }
    return data.length;
  }, [pagination, data.length]);

  // Create row object for callbacks
  const createRow = useCallback((item: T, index: number): Row<T> => {
    const rowId = index;
    return {
      original: item,
      index,
      id: String(index),
      getIsSelected: () => selectedRowIds.has(rowId),
      toggleSelected: () => {
        setSelectedRowIds((prev: Set<number>) => {
          const next = new Set(prev);
          if (next.has(rowId)) {
            next.delete(rowId);
          } else {
            if (rowSelection === 'single') {
              next.clear();
            }
            next.add(rowId);
          }

          // Notify parent of selection change
          if (onSelectionChanged) {
            const selectedRows = Array.from(next).map((id: number) => data[id]).filter(Boolean);
            onSelectionChanged(selectedRows);
          }

          return next;
        });
      },
    };
  }, [data, rowSelection, selectedRowIds, onSelectionChanged]);

  // Handle header sort click — skip if a drag just completed
  const handleSort = useCallback((columnId: string) => {
    if (!sorting) return;
    if (isDraggingRef.current) return;

    const currentSort = sortingState.find((s: SortingState) => s.id === columnId);
    let newSortingState: SortingState[];

    if (!currentSort) {
      newSortingState = [{ id: columnId, desc: false }];
    } else if (!currentSort.desc) {
      newSortingState = [{ id: columnId, desc: true }];
    } else {
      newSortingState = sorting?.manualSorting && sorting.enableSortingRemoval === false
        ? [{ id: columnId, desc: false }]
        : [];
    }

    onSortingChange(newSortingState);
  }, [sorting, sortingState, onSortingChange]);

  // Handle row click - only triggers onRowClick callback, not selection
  // Selection is handled only by clicking the checkbox
  const handleRowClick = useCallback((row: Row<T>) => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRowIds.size === paginatedData.length) {
      setSelectedRowIds(new Set());
      if (onSelectionChanged) {
        onSelectionChanged([]);
      }
    } else {
      const allIds = new Set(paginatedData.map((_: T, i: number) => i));
      setSelectedRowIds(allIds);
      if (onSelectionChanged) {
        onSelectionChanged(paginatedData);
      }
    }
  }, [paginatedData, selectedRowIds.size, onSelectionChanged]);

  // Pagination handlers
  const canPreviousPage = paginationState.pageIndex > 0;
  const canNextPage = paginationState.pageIndex < pageCount - 1;

  const goToPreviousPage = useCallback(() => {
    if (canPreviousPage) {
      onPaginationChange((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  }, [canPreviousPage, onPaginationChange]);

  const goToNextPage = useCallback(() => {
    if (canNextPage) {
      onPaginationChange((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
    }
  }, [canNextPage, onPaginationChange]);

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center min-h-[200px]', className)}>
        {emptyState || <Text variation="subdued">No data available</Text>}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Table container */}
      <div
        className={cn(
          'relative overflow-auto rounded-lg border border-[var(--color-border)]',
          loading && 'opacity-50 pointer-events-none'
        )}
        style={{ height: height || 'auto', maxHeight: height }}
      >
        <table className="w-full border-collapse text-sm">
          {/* Header */}
          <thead
            className={cn(
              'bg-[var(--color-surface--hover)]',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {/* Selection column */}
              {rowSelection && (
                <th
                  className={cn(
                    'w-12 px-4 py-3 text-left font-medium text-[var(--color-text--secondary)]',
                    pinFirstColumn && 'sticky left-0 z-20 bg-[var(--color-surface--hover)]'
                  )}
                >
                  {rowSelection === 'multiple' && (
                    <input
                      type="checkbox"
                      checked={selectedRowIds.size > 0 && selectedRowIds.size === paginatedData.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-[var(--color-border)]"
                      aria-label="Select all rows"
                    />
                  )}
                </th>
              )}
              {orderedColumns.map((column, index) => {
                const columnId = column.id ?? String(column.accessorKey);
                const canSort = sorting && column.enableSorting !== false && column.accessorKey;
                const currentSort = sortingState.find((s: SortingState) => s.id === columnId);
                const isDragging = dragColumnId === columnId;
                const isAnyDragging = dragColumnId !== null;

                return (
                  <th
                    key={columnId}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-[var(--color-text--secondary)]',
                      canSort && !isAnyDragging && 'cursor-pointer select-none hover:text-[var(--color-text)]',
                      columnReordering && !isAnyDragging && 'cursor-grab',
                      columnReordering && isAnyDragging && 'cursor-grabbing',
                      pinFirstColumn && index === 0 && !rowSelection && 'sticky left-0 z-20 bg-[var(--color-surface--hover)]',
                      isDragging && 'opacity-30',
                    )}
                    style={{
                      width: column.size,
                      minWidth: column.minSize,
                    }}
                    onClick={canSort ? () => handleSort(columnId) : undefined}
                    draggable={columnReordering}
                    onDragStart={columnReordering ? (e) => handleDragStart(e, columnId) : undefined}
                    onDragEnd={columnReordering ? handleDragEnd : undefined}
                    onDragOver={columnReordering ? (e) => handleDragOver(e, columnId) : undefined}
                    onDrop={columnReordering ? handleDrop : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {typeof column.header === 'function'
                        ? column.header({ column: { id: columnId } })
                        : column.header}
                      {canSort && (
                        <SortIcon direction={currentSort ? (currentSort.desc ? 'desc' : 'asc') : false} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[var(--color-border)]">
            {paginatedData.map((item: T, rowIndex: number) => {
              const row = createRow(item, rowIndex);
              const isSelected = row.getIsSelected();

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'bg-[var(--color-surface)]',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-[var(--color-interactive--subtle)]'
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {/* Selection column */}
                  {rowSelection && (
                    <td
                      className={cn(
                        'w-12 px-4 py-3 transition-all duration-150 ease-in-out',
                        'hover:bg-[var(--color-surface--hover)] hover:shadow-[inset_0_0_0_1px_var(--color-border,rgba(0,0,0,0.08))]',
                        pinFirstColumn && 'sticky left-0 z-10 bg-inherit'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => row.toggleSelected()}
                        className="h-4 w-4 rounded border-[var(--color-border)]"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {orderedColumns.map((column, colIndex) => {
                    const columnId = column.id ?? String(column.accessorKey);
                    const cellValue = getCellValue(item, column);
                    const isCellDragging = dragColumnId === columnId;

                    const cellContext: CellContext<T, unknown> = {
                      getValue: () => cellValue,
                      row: {
                        original: item,
                        index: rowIndex,
                        getIsSelected: () => isSelected,
                        toggleSelected: () => row.toggleSelected(),
                      },
                      column: { id: columnId },
                    };

                    return (
                      <td
                        key={columnId}
                        className={cn(
                          'px-4 py-3 transition-all duration-150 ease-in-out',
                          'hover:bg-[var(--color-surface--hover)] hover:shadow-[inset_0_0_0_1px_var(--color-border,rgba(0,0,0,0.08))]',
                          pinFirstColumn && colIndex === 0 && !rowSelection && 'sticky left-0 z-10 bg-inherit',
                          isCellDragging && 'opacity-30',
                        )}
                      >
                        {column.cell ? column.cell(cellContext) : String(cellValue ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/50 z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-interactive)]" />
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <Text element="span" size="small" variation="subdued">
            Showing {paginationState.pageIndex * paginationState.pageSize + 1} to{' '}
            {Math.min((paginationState.pageIndex + 1) * paginationState.pageSize, totalItems)} of{' '}
            {totalItems} results
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="tertiary"
              variation="subtle"
              size="small"
              icon="arrowLeft"
              ariaLabel="Previous page"
              disabled={!canPreviousPage}
              onClick={goToPreviousPage}
            />

            <Text element="span" size="small">
              Page {paginationState.pageIndex + 1} of {pageCount || 1}
            </Text>

            <Button
              type="tertiary"
              variation="subtle"
              size="small"
              icon="arrowRight"
              ariaLabel="Next page"
              disabled={!canNextPage}
              onClick={goToNextPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
