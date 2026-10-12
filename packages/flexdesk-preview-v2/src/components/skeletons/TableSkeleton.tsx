import { Glimmer } from '@/atlantis'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showAvatar?: boolean
  showSearch?: boolean
  showPagination?: boolean
}

const TableRowSkeleton = ({
  columns,
  showAvatar,
}: {
  columns: number
  showAvatar: boolean
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
)

export const TableSkeleton = ({
  rows = 10,
  columns = 5,
  showAvatar = true,
  showSearch = true,
  showPagination = true,
}: TableSkeletonProps) => (
  <div className="flex flex-col gap-4">
    {showSearch && (
      <div className="flex items-center justify-between">
        <Glimmer width="16rem" height={40} />
        <div className="flex items-center gap-4">
          <Glimmer width="7rem" height={32} />
          <Glimmer width={80} height={16} />
        </div>
      </div>
    )}

    <div className="rounded-md border">
      <div className="flex items-center gap-4 p-4 border-b bg-[var(--color-surface--hover)]">
        {showAvatar && <div className="w-8" />}
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Glimmer width={80} height={16} />
          </div>
        ))}
      </div>

      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton
          key={i}
          columns={columns}
          showAvatar={showAvatar}
        />
      ))}
    </div>

    {showPagination && (
      <div className="flex items-center justify-start gap-2 mt-2">
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer width={96} height={16} className="ml-4" />
      </div>
    )}
  </div>
)

/**
 * ClientListSkeleton - Matches the exact structure of ClientList.tsx
 */
export const ClientListSkeleton = () => {
  // Vary widths based on row index for visual interest
  const nameWidths = [140, 160, 120, 180, 150, 130, 170, 145, 155, 135]
  const emailWidths = [160, 140, 180, 150, 170, 145, 155, 175, 165, 148]
  const locationWidths = [100, 85, 110, 90, 105, 95, 115, 88, 108, 92]

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-6">
          <Glimmer width={95} height={20} />
          <Glimmer width={70} height={20} />
          <Glimmer width={65} height={20} />
          <Glimmer width={75} height={20} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Glimmer width={100} height={36} />
          <Glimmer width={36} height={36} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Glimmer width={80} height={32} />
        <Glimmer width={90} height={32} />
        <Glimmer width={85} height={32} />
        <div className="ml-auto">
          <Glimmer width={70} height={14} />
        </div>
      </div>

      {/* DataTable - matches DataTable structure */}
      <div className="flex flex-col gap-4">
        <div className="relative overflow-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full border-collapse text-sm">
            {/* Table Header */}
            <thead className="bg-[var(--color-surface--hover)] sticky top-0 z-10">
              <tr>
                {/* Selection column */}
                <th className="w-12 px-4 py-3 text-left">
                  <Glimmer width={16} height={16} />
                </th>
                {/* Name column */}
                <th className="px-4 py-3 text-left" style={{ width: 200, minWidth: 200 }}>
                  <Glimmer width={45} height={14} />
                </th>
                {/* Email column */}
                <th className="px-4 py-3 text-left" style={{ width: 200, minWidth: 200 }}>
                  <Glimmer width={40} height={14} />
                </th>
                {/* Phone column */}
                <th className="px-4 py-3 text-left" style={{ width: 140, minWidth: 140 }}>
                  <Glimmer width={45} height={14} />
                </th>
                {/* Status column */}
                <th className="px-4 py-3 text-left" style={{ width: 120, minWidth: 120 }}>
                  <Glimmer width={45} height={14} />
                </th>
                {/* Location column */}
                <th className="px-4 py-3 text-left" style={{ width: 150, minWidth: 150 }}>
                  <Glimmer width={55} height={14} />
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[var(--color-border)]">
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="bg-[var(--color-surface)]">
                  {/* Selection column */}
                  <td className="w-12 px-4 py-3">
                    <Glimmer width={16} height={16} />
                  </td>
                  {/* Name column */}
                  <td className="px-4 py-3" style={{ width: 200, minWidth: 200 }}>
                    <Glimmer width={nameWidths[i]} height={16} />
                  </td>
                  {/* Email column */}
                  <td className="px-4 py-3" style={{ width: 200, minWidth: 200 }}>
                    <Glimmer width={emailWidths[i]} height={16} />
                  </td>
                  {/* Phone column */}
                  <td className="px-4 py-3" style={{ width: 140, minWidth: 140 }}>
                    <Glimmer width={100} height={16} />
                  </td>
                  {/* Status column */}
                  <td className="px-4 py-3" style={{ width: 120, minWidth: 120 }}>
                    <Glimmer width={60} height={24} />
                  </td>
                  {/* Location column */}
                  <td className="px-4 py-3" style={{ width: 150, minWidth: 150 }}>
                    <Glimmer width={locationWidths[i]} height={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <Glimmer width={150} height={14} />
          <div className="flex items-center gap-2">
            <Glimmer width={32} height={32} />
            <Glimmer width={80} height={14} />
            <Glimmer width={32} height={32} />
          </div>
        </div>
      </div>
    </div>
  )
}

export const JobListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={5}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
)

export const InvoiceListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={5}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
)

export const RequestListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={4}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
)

export const TechnicianListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={6}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
)

export const EstimateListSkeleton = () => (
  <TableSkeleton
    rows={10}
    columns={6}
    showAvatar={false}
    showSearch={true}
    showPagination={true}
  />
)

export const FilteredListSkeleton = ({
  rows = 10,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) => (
  <div className="flex flex-col lg:flex-row gap-4">
    <div className="lg:w-64 space-y-4">
      <Glimmer height={40} />
      <Glimmer height={40} />
      <Glimmer height={40} />
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <Glimmer width="7rem" height={32} />
        <Glimmer width={80} height={16} />
      </div>

      <div className="rounded-md border">
        <div className="flex items-center gap-4 p-4 border-b bg-[var(--color-surface--hover)]">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <Glimmer width={80} height={16} />
            </div>
          ))}
        </div>

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

      <div className="flex items-center justify-start gap-2 mt-4">
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer shape="rectangle" width={32} height={32} />
        <Glimmer width={96} height={16} className="ml-4" />
      </div>
    </div>
  </div>
)

export default TableSkeleton
