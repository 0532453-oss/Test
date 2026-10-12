import { useMemo, useState, useCallback } from 'react'
import { useListContext } from 'ra-core'
import { List } from '@/components/admin'
import {
  Heading,
  Text,
  StatusLabel,
  DataTable,
  createColumnHelper,
} from '@/atlantis'
import { RatingCell, LocationCell } from '@/atlantis/table-cells'
import {
  type ServiceProvider,
  type ServiceProviderStatus,
  serviceProviderStatusToSemantic,
  formatStatusLabel,
} from '@/types'

const columnHelper = createColumnHelper<ServiceProvider>()

const ServiceProviderListContent = () => {
  const { data, total, isLoading } = useListContext<ServiceProvider>()
  const [selectedRows, setSelectedRows] = useState<ServiceProvider[]>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Provider Name',
        size: 200,
        minSize: 200,
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('rating', {
        header: 'Rating',
        size: 100,
        minSize: 100,
        cell: (info) => {
          const value = info.getValue()
          return value != null ? <RatingCell value={value} /> : <Text variation="subdued">--</Text>
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 120,
        minSize: 120,
        cell: (info) => {
          const status = info.getValue()
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={serviceProviderStatusToSemantic[status as ServiceProviderStatus] || 'inactive'}
            />
          )
        },
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        minSize: 200,
        cell: (info) => (
          <Text variation="subdued">{info.getValue() || '--'}</Text>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        size: 140,
        minSize: 140,
        cell: (info) => (
          <Text variation="subdued">{info.getValue() || '--'}</Text>
        ),
      }),
      columnHelper.display({
        id: 'location',
        header: 'Location',
        size: 140,
        minSize: 140,
        cell: (info) => {
          const provider = info.row.original
          return (
            <LocationCell
              city={provider.city ?? undefined}
              state={provider.state ?? undefined}
            />
          )
        },
      }),
    ],
    []
  )

  const handleSelectionChange = useCallback((rows: ServiceProvider[]) => {
    setSelectedRows(rows)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} className="font-bold">
            Service Providers
          </Heading>
        </div>
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total ?? 0} {total === 1 ? 'provider' : 'providers'}
            {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        <DataTable<ServiceProvider>
          data={data || []}
          columns={columns as any}
          height="calc(100vh - 280px)"
          stickyHeader
          rowSelection="multiple"
          onSelectionChanged={handleSelectionChange}
          pagination={{
            manualPagination: false,
            itemsPerPage: [10, 25, 50],
          }}
          sorting={{
            manualSorting: false,
          }}
        />
      </div>
    </div>
  )
}

export const ServiceProviderList = () => {
  return (
    <List
      resource="service-providers"
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
    >
      <ServiceProviderListContent />
    </List>
  )
}
