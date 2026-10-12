import { Glimmer } from '../atlantis/Glimmer';

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Whether to show avatar in first column */
  showAvatar?: boolean;
  /** Whether to show a search bar skeleton */
  showSearch?: boolean;
  /** Whether to show pagination skeleton */
  showPagination?: boolean;
}

/**
 * Table row skeleton with customizable columns
 * Uses Atlantis Glimmer for loading placeholders
 */
const TableRowSkeleton = ({
  columns,
  showAvatar,
}: {
  columns: number;
  showAvatar: boolean;
}) => (
  <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
    {showAvatar && (
      <Glimmer shape="circle" size="small" className="shrink-0" />
    )}
    {Array.from({ length: columns }).map((_, i) => (
      <div key={i} className="flex-1">
        <Glimmer
          height={16}
          width={i === 0 ? '75%' : i === columns - 1 ? 64 : '66%'}
        />
      </div>
    ))}
  </div>
);

/**
 * Skeleton loader for data tables (clients, jobs, invoices, etc.)
 * Matches the structure of DataTable components
 * Uses Atlantis Glimmer for all loading placeholders
 */
export const TableSkeleton = ({
  rows = 10,
  columns = 5,
  showAvatar = true,
  showSearch = true,
  showPagination = true,
}: TableSkeletonProps) => (
  <div className="flex flex-col gap-4">
    {/* Search and controls */}
    {showSearch && (
      <div className="flex items-center justify-between">
        <Glimmer width="16rem" height={40} />
        <div className="flex items-center gap-4">
          <Glimmer width="7rem" height={32} />
          <Glimmer width={80} height={16} />
        </div>
      </div>
    )}

    {/* Table */}
    <div className="rounded-md border">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4 border-b bg-[--color-surface--hover]">
        {showAvatar && <div className="w-8" />}
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Glimmer width={80} height={16} />
          </div>
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton
          key={i}
          columns={columns}
          showAvatar={showAvatar}
        />
      ))}
    </div>

    {/* Pagination */}
    {showPagination && (
      <div className="flex items-center justify-start gap-2 mt-2">
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer width={96} height={16} className="ml-4" />
      </div>
    )}
  </div>
);

/**
 * Preset for client list skeleton
 */
export const ClientListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={4}
    showAvatar={true}
    showSearch={true}
    showPagination={true}
  />
);

/**
 * Preset for job list skeleton
 */
export const JobListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={5}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
);

/**
 * Preset for invoice list skeleton
 */
export const InvoiceListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={5}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
);

/**
 * Preset for request list skeleton
 */
export const RequestListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={4}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
);

/**
 * Skeleton for list pages with sidebar filter (Jobs, Invoices, Requests)
 * Uses Atlantis Glimmer for all loading placeholders
 */
export const FilteredListSkeleton = ({
  rows = 10,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Filters Sidebar */}
    <div className="lg:w-64 space-y-4">
      <Glimmer height={40} />
      <Glimmer height={40} />
      <Glimmer height={40} />
    </div>

    {/* Table Content */}
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <Glimmer width="7rem" height={32} />
        <Glimmer width={80} height={16} />
      </div>

      <div className="rounded-md border">
        {/* Header row */}
        <div className="flex items-center gap-4 p-4 border-b bg-[--color-surface--hover]">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <Glimmer width={80} height={16} />
            </div>
          ))}
        </div>

        {/* Body rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="flex-1">
                <Glimmer
                  height={16}
                  width={j === 0 ? '75%' : j === columns - 1 ? 64 : '66%'}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-start gap-2 mt-4">
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer width={96} height={16} className="ml-4" />
      </div>
    </div>
  </div>
);

export default TableSkeleton;
