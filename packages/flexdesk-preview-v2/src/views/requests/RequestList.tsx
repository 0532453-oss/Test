import { useMemo, useState, useRef, useCallback } from 'react'
import { useListContext, useListFilterContext, useDeleteMany, useRefresh, useNotify } from 'ra-core'
import {
  List,
  CreateButton,
  ExportButton,
} from '@/components/admin'
import {
  Button as AtlantisButton,
  Text,
  InputText,
  Checkbox,
  StatusLabel,
  DataTable,
  createColumnHelper,
  Popover,
  Page,
  Tabs,
  Tab,
  useBool,
  ConfirmationModal,
  toast,
} from '@/atlantis'
import { ReferenceCell, DateCell, CurrencyCell } from '@/atlantis/table-cells'
import { Separator } from '@/components/ui/separator'
import { requestStatusToSemantic, formatStatusLabel, type Request } from '@/types'
import { EmptyRequestList, NoFilterResults } from '@/components/EmptyState'
import { FilteredListSkeleton } from '@/components/skeletons/TableSkeleton'
import { cn } from '@/lib/utils'

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Requests', filter: undefined },
  { id: 'new', label: 'New', filter: 'NEW' },
  { id: 'contacted', label: 'Contacted', filter: 'CONTACTED' },
  { id: 'quoted', label: 'Quoted', filter: 'QUOTED' },
  { id: 'converted', label: 'Converted', filter: 'CONVERTED' },
  { id: 'closed', label: 'Closed', filter: 'CLOSED' },
] as const

// Source options for filter
const sourceOptions = [
  { id: 'WEBSITE', label: 'Website' },
  { id: 'PHONE', label: 'Phone' },
  { id: 'REFERRAL', label: 'Referral' },
  { id: 'WALK_IN', label: 'Walk-in' },
  { id: 'OTHER', label: 'Other' },
]

export const RequestList = () => {
  return (
    <List
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
      pagination={false}
      actions={false}
      empty={<EmptyRequestList />}
    >
      <RequestListContent />
    </List>
  )
}

const RequestListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<Request>()
  const { setFilters } = useListFilterContext()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const showSearch = useBool(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<Request[]>([])
  const filterPopover = useBool(false)
  const displayPopover = useBool(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const displayButtonRef = useRef<HTMLButtonElement>(null)

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [requestsToDelete, setRequestsToDelete] = useState<Request[]>([])

  // React Admin hooks
  const [deleteMany] = useDeleteMany()
  const refresh = useRefresh()
  const notify = useNotify()

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key])
  const showNoFilterResults = data && data.length === 0 && hasFilters
  const activeFilterCount = (filterValues?.source ? 1 : 0) + (filterValues?.q ? 1 : 0)

  // Handle status tab change
  const handleTabChange = useCallback((tabIndex: number) => {
    setActiveTabIndex(tabIndex)
    const tab = statusTabs[tabIndex]
    setFilters({
      ...filterValues,
      status: tab?.filter,
    }, undefined)
  }, [filterValues, setFilters])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setFilters({
      ...filterValues,
      q: value || undefined,
    }, undefined)
  }, [filterValues, setFilters])

  // Handle source filter
  const handleSourceToggle = (sourceId: string) => {
    const newSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(s => s !== sourceId)
      : [...selectedSources, sourceId]

    setSelectedSources(newSources)
    setFilters({
      ...filterValues,
      source: newSources.length > 0 ? newSources : undefined,
    }, undefined)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedSources([])
    setSearchQuery('')
    setFilters({
      status: filterValues?.status, // Keep status tab
    }, undefined)
  }

  // Handle delete action
  const handleDelete = (requests: Request[]) => {
    setRequestsToDelete(requests)
    setConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (requestsToDelete.length === 0) return

    try {
      await deleteMany(
        'requests',
        { ids: requestsToDelete.map((r) => r.id) },
        { mutationMode: 'pessimistic' }
      )

      const requestText = requestsToDelete.length === 1 ? 'Request' : `${requestsToDelete.length} requests`
      toast.success(`${requestText} deleted`, {
        action: {
          label: 'Undo',
          onClick: () => {
            notify('Undo is not available for this action', { type: 'info' })
          },
        },
        duration: 5000,
      })

      refresh()
      setSelectedRows([])
    } catch {
      notify('Failed to delete. Please try again.', { type: 'error' })
    } finally {
      setConfirmDelete(false)
      setRequestsToDelete([])
    }
  }

  // Column helper for type-safe column definitions
  const columnHelper = createColumnHelper<Request>()

  // Column definitions for Atlantis DataTable
  const columns: any[] = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        header: 'Request Date',
        cell: (info) => (
          <DateCell date={info.getValue()} showYear />
        ),
        minSize: 130,
      }),
      columnHelper.accessor('clientId', {
        header: 'Client',
        cell: (info) => (
          <ReferenceCell
            id={info.getValue()}
            reference="clients"
            displayField="name"
            link="show"
          />
        ),
        minSize: 150,
      }),
      columnHelper.accessor('title', {
        header: 'Job',
        cell: (info) => (
          <Text element="span" className="font-medium">
            {info.getValue() || '—'}
          </Text>
        ),
        minSize: 200,
      }),
      columnHelper.accessor('source', {
        header: 'Source',
        cell: (info) => {
          const source = info.getValue()
          // Format source for display (e.g., "WALK_IN" -> "Walk-in")
          const formatted = source
            ? source.charAt(0) + source.slice(1).toLowerCase().replace('_', '-')
            : '—'
          return <Text element="span">{formatted}</Text>
        },
        minSize: 120,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={requestStatusToSemantic[status]}
            />
          )
        },
        minSize: 120,
      }),
      columnHelper.accessor('estimatedValue', {
        header: 'Est. Value',
        cell: (info) => (
          <CurrencyCell value={info.getValue()} currency="USD" />
        ),
        minSize: 120,
      }),
    ],
    [columnHelper]
  )

  // Show skeleton while loading
  if (isLoading) {
    return <FilteredListSkeleton rows={10} columns={6} />
  }

  // Render content for each tab (shared across all tabs)
  const renderTabContent = () => (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {/* Search - Click-to-expand */}
        {showSearch.value ? (
          <div className="flex items-center gap-2 w-80">
            <InputText
              autoFocus
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by customer, title, or request ID..."
              prefix="search"
              size="small"
            />
            <AtlantisButton
              type="tertiary"
              variation="subtle"
              size="small"
              icon="cross"
              ariaLabel="Close search"
              onClick={() => {
                showSearch.setFalse()
                handleSearch('')
              }}
            />
          </div>
        ) : (
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="search"
            onClick={showSearch.setTrue}
          >
            Search
          </AtlantisButton>
        )}

        {/* Filter Button */}
        <AtlantisButton
          ref={filterButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="filter"
          className={cn(
            'h-8 gap-1.5',
            activeFilterCount > 0 ? 'text-[var(--color-interactive)]' : 'text-[var(--color-text--secondary)]'
          )}
          onClick={filterPopover.toggle}
        >
          Filter
          {activeFilterCount > 0 && (
            <Text element="span" size="small" className="ml-1 rounded-full bg-[var(--color-interactive--subtle)] px-1.5 py-0.5 font-medium text-[var(--color-interactive)]">
              {activeFilterCount}
            </Text>
          )}
        </AtlantisButton>
        <Popover
          open={filterPopover.value}
          onRequestClose={filterPopover.setFalse}
          attachTo={filterButtonRef}
          preferredPlacement="below-start"
          width={224}
        >
          <Popover.Content>
            <div className="space-y-4">
              <div className="space-y-2">
                <Text element="span" size="small" className="font-medium text-[var(--color-text--secondary)] uppercase tracking-wider">
                  Source
                </Text>
                <div className="space-y-2">
                  {sourceOptions.map((source) => (
                    <Checkbox
                      key={source.id}
                      id={source.id}
                      checked={selectedSources.includes(source.id)}
                      onChange={() => handleSourceToggle(source.id)}
                      label={source.label}
                    />
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <>
                  <Separator />
                  <AtlantisButton
                    type="tertiary"
                    variation="subtle"
                    size="small"
                    className="w-full justify-center text-[var(--color-text--secondary)]"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </AtlantisButton>
                </>
              )}
            </div>
          </Popover.Content>
        </Popover>

        {/* Display Options */}
        <AtlantisButton
          ref={displayButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="sliders"
          onClick={displayPopover.toggle}
        >
          Display
        </AtlantisButton>
        <Popover
          open={displayPopover.value}
          onRequestClose={displayPopover.setFalse}
          attachTo={displayButtonRef}
          preferredPlacement="below-end"
          width={224}
        >
          <Popover.Content>
            <div className="space-y-2">
              <Text element="span" size="small" variation="subdued" className="font-medium uppercase tracking-wider">
                View Options
              </Text>
              <Text variation="subdued" size="small">
                Column visibility and grouping options coming soon.
              </Text>
            </div>
          </Popover.Content>
        </Popover>

        {/* Request Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'request' : 'requests'}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <DataTable<Request>
            data={data || []}
            columns={columns}
            height="calc(100vh - 320px)"
            stickyHeader={true}
            rowSelection="multiple"
            onSelectionChanged={setSelectedRows}
            columnReordering
            pagination={{
              manualPagination: false,
              itemsPerPage: [25, 50, 100],
            }}
            sorting={{
              manualSorting: false,
            }}
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        {/* Status Tabs */}
        <Tabs activeTab={activeTabIndex} onTabChange={handleTabChange}>
          {statusTabs.map((tab) => (
            <Tab key={tab.id} label={tab.label}>
              {/* Content is rendered below, outside the Tabs */}
            </Tab>
          ))}
        </Tabs>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <CreateButton label="Add Request" resource="requests" />
          <ExportButton />
        </div>
      </div>

      {/* Tab Content (shared across all tabs - filtering handled by API) */}
      {renderTabContent()}

      {/* Action Bar - appears when rows are selected */}
      {selectedRows.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-border rounded-lg shadow-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedRows.length} {selectedRows.length === 1 ? 'request' : 'requests'} selected
              </span>
              <AtlantisButton
                type="tertiary"
                variation="subtle"
                size="small"
                icon="cross"
                ariaLabel="Clear selection"
                className="h-6 w-6"
                onClick={() => setSelectedRows([])}
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <AtlantisButton
              type="primary"
              variation="destructive"
              size="small"
              icon="trash"
              onClick={() => handleDelete(selectedRows)}
            >
              Delete
            </AtlantisButton>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmDelete}
        title="Delete Requests"
        message={
          requestsToDelete.length === 1
            ? `Are you sure you want to delete this request? This action cannot be undone.`
            : `Are you sure you want to delete ${requestsToDelete.length} requests? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDelete(false)
          setRequestsToDelete([])
        }}
        onRequestClose={() => {
          setConfirmDelete(false)
          setRequestsToDelete([])
        }}
      />
    </div>
  )
}
