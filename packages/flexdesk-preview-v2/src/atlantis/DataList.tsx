/**
 * Atlantis DataList Component
 *
 * A flexible list component for displaying data items with consistent styling,
 * mobile-responsive layouts, item actions, bulk actions, and empty states.
 *
 * This component matches the @jobber/components DataList API.
 *
 * @example
 * // Basic usage
 * <DataList data={items}>
 *   <DataList.Layout>
 *     {(item) => <div>{item.name}</div>}
 *   </DataList.Layout>
 * </DataList>
 *
 * @example
 * // With item actions and empty state
 * <DataList data={items}>
 *   <DataList.Layout>
 *     {(item) => <MyListItem item={item} />}
 *   </DataList.Layout>
 *   <DataList.ItemActions>
 *     {(item) => [
 *       { label: 'Edit', onClick: () => edit(item) },
 *       { label: 'Delete', onClick: () => delete(item), destructive: true }
 *     ]}
 *   </DataList.ItemActions>
 *   <DataList.EmptyState>
 *     <div>No items to display</div>
 *   </DataList.EmptyState>
 * </DataList>
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Icon, type IconNames } from './Icon';
import { Text } from './Text';

// ============================================================================
// Types
// ============================================================================

export interface DataListAction {
  label: string;
  onClick: () => void;
  icon?: IconNames;
  destructive?: boolean;
  disabled?: boolean;
}

export interface DataListItem {
  id: string | number;
  [key: string]: unknown;
}

export interface DataListContextType<T extends DataListItem> {
  data: T[];
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  clearSelection: () => void;
  renderItem?: (item: T, index: number) => ReactNode;
  getItemActions?: (item: T) => DataListAction[];
  getBulkActions?: () => DataListAction[];
  emptyState?: ReactNode;
  selectable: boolean;
}

export interface DataListProps<T extends DataListItem> {
  /** The data items to display */
  data: T[];
  /** Enable multi-select functionality */
  selectable?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Array<string | number>) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Children - must include DataList.Layout */
  children: ReactNode;
}

export interface DataListLayoutProps<T extends DataListItem> {
  /** Render function for each item */
  children: (item: T, index: number) => ReactNode;
  /** Gap between items (in Tailwind spacing units) */
  gap?: 'none' | 'small' | 'base' | 'large';
}

export interface DataListItemActionsProps<T extends DataListItem> {
  /** Function that returns actions for an item */
  children: (item: T) => DataListAction[];
}

export interface DataListBulkActionsProps {
  /** Function that returns bulk actions */
  children: () => DataListAction[];
}

export interface DataListEmptyStateProps {
  /** Content to show when list is empty */
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const DataListContext = createContext<DataListContextType<DataListItem> | null>(null);

function useDataListContext<T extends DataListItem>(): DataListContextType<T> {
  const context = useContext(DataListContext);
  if (!context) {
    throw new Error('DataList compound components must be used within DataList');
  }
  return context as unknown as DataListContextType<T>;
}

// ============================================================================
// Gap Mapping
// ============================================================================

const gapClasses: Record<string, string> = {
  none: 'gap-0',
  small: 'gap-2',
  base: 'gap-3',
  large: 'gap-4',
};

// ============================================================================
// DataList Component
// ============================================================================

function DataListRoot<T extends DataListItem>({
  data,
  selectable = false,
  onSelectionChange,
  loading = false,
  className = '',
  children,
}: DataListProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Clear selections when data changes to avoid stale references
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  // Parse children to extract sub-components
  const { layout, itemActions, bulkActions, emptyState } = useMemo(() => {
    let layoutComponent: DataListLayoutProps<T>['children'] | undefined;
    let itemActionsComponent: DataListItemActionsProps<T>['children'] | undefined;
    let bulkActionsComponent: DataListBulkActionsProps['children'] | undefined;
    let emptyStateContent: ReactNode | undefined;
    let layoutGap: string = 'base';

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      // Check displayName or type name to identify sub-components
      const componentName =
        (child.type as { displayName?: string }).displayName ||
        (child.type as { name?: string }).name;

      if (componentName === 'DataListLayout') {
        layoutComponent = child.props.children;
        layoutGap = child.props.gap || 'base';
      } else if (componentName === 'DataListItemActions') {
        itemActionsComponent = child.props.children;
      } else if (componentName === 'DataListBulkActions') {
        bulkActionsComponent = child.props.children;
      } else if (componentName === 'DataListEmptyState') {
        emptyStateContent = child.props.children;
      }
    });

    return {
      layout: { render: layoutComponent, gap: layoutGap },
      itemActions: itemActionsComponent,
      bulkActions: bulkActionsComponent,
      emptyState: emptyStateContent,
    };
  }, [children]);

  const toggleSelection = useCallback(
    (id: string | number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange]
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = data.map((item) => item.id);
      if (prev.size === allIds.length) {
        onSelectionChange?.([]);
        return new Set();
      } else {
        onSelectionChange?.(allIds);
        return new Set(allIds);
      }
    });
  }, [data, onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < data.length;

  const contextValue: DataListContextType<T> = useMemo(
    () => ({
      data,
      selectedIds,
      toggleSelection,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      renderItem: layout.render,
      getItemActions: itemActions,
      getBulkActions: bulkActions,
      emptyState,
      selectable,
    }),
    [
      data,
      selectedIds,
      toggleSelection,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      layout.render,
      itemActions,
      bulkActions,
      emptyState,
      selectable,
    ]
  );

  // Handle empty state
  if (data.length === 0 && emptyState) {
    return (
      <div className={`${className}`}>
        {emptyState}
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-interactive)] border-t-transparent" />
      </div>
    );
  }

  return (
    <DataListContext.Provider value={contextValue as unknown as DataListContextType<DataListItem>}>
      <div className={className}>
        {/* Bulk Actions Bar */}
        {selectable && selectedIds.size > 0 && bulkActions && (
          <DataListBulkActionsBar />
        )}

        {/* Select All Header (when selectable) */}
        {selectable && data.length > 0 && (
          <div className="flex items-center gap-3 py-2 px-3 border-b border-[var(--color-border)] bg-[var(--color-surface-background)]">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={toggleSelectAll}
            />
            <Text size="small" variation="subdued">
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${data.length} selected`
                : `Select all (${data.length})`}
            </Text>
          </div>
        )}

        {/* List Items */}
        <div className={`flex flex-col ${gapClasses[layout.gap]}`}>
          {data.map((item, index) => (
            <DataListItemWrapper key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </DataListContext.Provider>
  );
}

// ============================================================================
// DataList Item Wrapper (internal)
// ============================================================================

interface DataListItemWrapperProps<T extends DataListItem> {
  item: T;
  index: number;
}

function DataListItemWrapper<T extends DataListItem>({
  item,
  index,
}: DataListItemWrapperProps<T>) {
  const { renderItem, getItemActions, selectedIds, toggleSelection, selectable } =
    useDataListContext<T>();
  const [showActions, setShowActions] = useState(false);

  const isSelected = selectedIds.has(item.id);
  const actions = getItemActions?.(item) || [];

  return (
    <div
      className={`
        relative flex items-start gap-3 p-3 rounded-lg border
        transition-colors duration-150
        ${isSelected ? 'bg-[var(--color-surface--background)] border-[var(--color-interactive)]' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-background)]'}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Checkbox (when selectable) */}
      {selectable && (
        <div className="flex-shrink-0 pt-0.5">
          <Checkbox
            checked={isSelected}
            onChange={() => toggleSelection(item.id)}
          />
        </div>
      )}

      {/* Item Content */}
      <div className="flex-1 min-w-0">
        {renderItem?.(item, index)}
      </div>

      {/* Item Actions */}
      {actions.length > 0 && (
        <div
          className={`
            flex-shrink-0 flex items-center gap-1
            ${showActions || isSelected ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-150
          `}
        >
          {actions.slice(0, 2).map((action, actionIndex) => (
            <Button
              key={actionIndex}
              type="tertiary"
              variation={action.destructive ? 'destructive' : 'subtle'}
              size="small"
              icon={action.icon}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              ariaLabel={action.label}
            />
          ))}
          {actions.length > 2 && (
            <Button
              type="tertiary"
              variation="subtle"
              size="small"
              icon="more"
              ariaLabel="More actions"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Bulk Actions Bar (internal)
// ============================================================================

function DataListBulkActionsBar() {
  const { selectedIds, clearSelection, getBulkActions } =
    useDataListContext<DataListItem>();

  const actions = getBulkActions?.() || [];

  return (
    <div className="flex items-center justify-between gap-4 p-3 mb-3 rounded-lg bg-[var(--color-surface--background)] border border-[var(--color-interactive)]">
      <div className="flex items-center gap-2">
        <Text size="small" className="font-medium">
          {selectedIds.size} selected
        </Text>
        <Button
          type="tertiary"
          variation="subtle"
          size="small"
          onClick={clearSelection}
        >
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            type={action.destructive ? 'primary' : 'secondary'}
            variation={action.destructive ? 'destructive' : 'subtle'}
            size="small"
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function DataListLayout<T extends DataListItem>(_props: DataListLayoutProps<T>) {
  // This is a configuration component - rendering is handled by DataListRoot
  return null;
}
DataListLayout.displayName = 'DataListLayout';

function DataListItemActions<T extends DataListItem>(_props: DataListItemActionsProps<T>) {
  // This is a configuration component - rendering is handled by DataListItemWrapper
  return null;
}
DataListItemActions.displayName = 'DataListItemActions';

function DataListBulkActions(_props: DataListBulkActionsProps) {
  // This is a configuration component - rendering is handled by DataListBulkActionsBar
  return null;
}
DataListBulkActions.displayName = 'DataListBulkActions';

function DataListEmptyState(_props: DataListEmptyStateProps) {
  // This is a configuration component - rendering is handled by DataListRoot
  return null;
}
DataListEmptyState.displayName = 'DataListEmptyState';

// ============================================================================
// Exports
// ============================================================================

export const DataList = Object.assign(DataListRoot, {
  Layout: DataListLayout,
  ItemActions: DataListItemActions,
  BulkActions: DataListBulkActions,
  EmptyState: DataListEmptyState,
});

// Types already exported with declarations above
