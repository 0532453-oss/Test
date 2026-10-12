/**
 * Atlantis Table Component
 *
 * A simple table component for static tabular data display.
 * Use DataTable for paginated/sortable data lists.
 *
 * @example
 * ```tsx
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.HeaderCell>Name</Table.HeaderCell>
 *       <Table.HeaderCell align="right">Amount</Table.HeaderCell>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Item 1</Table.Cell>
 *       <Table.Cell align="right">$100.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 *   <Table.Footer>
 *     <Table.Row>
 *       <Table.Cell>Total</Table.Cell>
 *       <Table.Cell align="right">$100.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Footer>
 * </Table>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Table Root
// =============================================================================

export interface TableProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to show borders between cells */
  bordered?: boolean;
  /** Whether to stripe alternate rows */
  striped?: boolean;
  /** Whether the table header should be sticky */
  stickyHeader?: boolean;
  /** Whether to use compact cell padding */
  compact?: boolean;
}

function TableRoot({
  children,
  className,
  bordered = false,
  striped = false,
  stickyHeader = false,
  compact = false,
}: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn(
          'w-full caption-bottom text-sm',
          bordered && 'border border-[--color-border]',
          className
        )}
        data-striped={striped}
        data-sticky-header={stickyHeader}
        data-compact={compact}
      >
        {children}
      </table>
    </div>
  );
}

// =============================================================================
// Table Header
// =============================================================================

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn('[&_tr]:border-b [&_tr]:border-[--color-border]', className)}>
      {children}
    </thead>
  );
}

// =============================================================================
// Table Body
// =============================================================================

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

// =============================================================================
// Table Footer
// =============================================================================

export interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

function TableFooter({ children, className }: TableFooterProps) {
  return (
    <tfoot className={cn('border-t border-[--color-border] bg-[--color-surface--hover] font-medium [&>tr]:last:border-b-0', className)}>
      {children}
    </tfoot>
  );
}

// =============================================================================
// Table Row
// =============================================================================

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  /** Whether this row is selected */
  selected?: boolean;
  /** Whether to highlight on hover */
  hoverable?: boolean;
  onClick?: () => void;
}

function TableRow({
  children,
  className,
  selected = false,
  hoverable = false,
  onClick,
}: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-[--color-border] transition-colors',
        hoverable && 'hover:bg-[--color-surface--hover] cursor-pointer',
        selected && 'bg-[--color-surface--hover]',
        '[table[data-striped="true"]_&:nth-child(even)]:bg-[--color-surface--hover]/30',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// =============================================================================
// Table Header Cell
// =============================================================================

export type TableCellAlign = 'left' | 'center' | 'right';

export interface TableHeaderCellProps {
  children?: React.ReactNode;
  className?: string;
  /** Text alignment */
  align?: TableCellAlign;
  /** Column width (CSS value) */
  width?: string;
  /** Column span */
  colSpan?: number;
  /** Row span */
  rowSpan?: number;
}

function TableHeaderCell({
  children,
  className,
  align = 'left',
  width,
  colSpan,
  rowSpan,
}: TableHeaderCellProps) {
  return (
    <th
      className={cn(
        'h-10 px-4 font-medium text-[--color-text--secondary]',
        '[table[data-compact="true"]_&]:h-8 [table[data-compact="true"]_&]:px-2',
        '[table[data-sticky-header="true"]_&]:sticky [table[data-sticky-header="true"]_&]:top-0 [table[data-sticky-header="true"]_&]:bg-[--color-surface] [table[data-sticky-header="true"]_&]:z-10',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      style={{ width }}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </th>
  );
}

// =============================================================================
// Table Cell
// =============================================================================

export interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  /** Text alignment */
  align?: TableCellAlign;
  /** Column span */
  colSpan?: number;
  /** Row span */
  rowSpan?: number;
}

function TableCell({
  children,
  className,
  align = 'left',
  colSpan,
  rowSpan,
}: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4',
        '[table[data-compact="true"]_&]:p-2',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}

// =============================================================================
// Table Caption
// =============================================================================

export interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

function TableCaption({ children, className }: TableCaptionProps) {
  return (
    <caption className={cn('mt-4 text-sm text-[--color-text--secondary]', className)}>
      {children}
    </caption>
  );
}

// =============================================================================
// Compound Component Export
// =============================================================================

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Caption: TableCaption,
});

export default Table;
