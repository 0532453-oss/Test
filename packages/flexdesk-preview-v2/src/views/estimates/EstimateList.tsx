import { useMemo, useState, useRef, useCallback } from 'react'
import { useListContext, useListFilterContext, useDeleteMany, useRefresh, useNotify } from 'ra-core'
import { useNavigate } from 'react-router'
import { CCard, CCardBody } from '@coreui/react'
import { List, CreateButton, ExportButton } from '@/components/admin'
import {
  Button,
  Text,
  InputText,
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
import { estimateStatusToSemantic, formatStatusLabel, type Estimate, EstimateStatus } from '@/types'
import { EmptyEstimateList, NoFilterResults } from '@/components/EmptyState'
import { EstimateListSkeleton } from '@/components/skeletons'

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Estimates', filter: undefined },
  { id: 'draft', label: 'Draft', filter: 'DRAFT' },
  { id: 'sent', label: 'Sent', filter: 'SENT' },
  { id: 'viewed', label: 'Viewed', filter: 'VIEWED' },
  { id: 'accepted', label: 'Accepted', filter: 'ACCEPTED' },
  { id: 'rejected', label: 'Rejected', filter: 'REJECTED' },
  { id: 'expired', label: 'Expired', filter: 'EXPIRED' },
] as const

// Column helper for type-safe column definitions
const columnHelper = createColumnHelper<Estimate>()

const EstimateListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<Estimate>()
  const { setFilters } = useListFilterContext()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const showSearch = useBool(false)
  const [selectedRows, setSelectedRows] = useState<Estimate[]>([])
  const displayPopover = useBool(false)
  const displayButtonRef = useRef<HTMLButtonElement>(null)

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [estimatesToDelete, setEstimatesToDelete] = useState<Estimate[]>([])

  // React Admin hooks
  const [deleteMany] = useDeleteMany()
  const refresh = useRefresh()
  const notify = useNotify()
  const navigate = useNavigate()

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key])
  const showNoFilterResults = data && data.length === 0 && hasFilters

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

  // Handle delete action - only allow DRAFT estimates
  const handleDelete = (estimates: Estimate[]) => {
    const draftEstimates = estimates.filter(e => e.status === EstimateStatus.DRAFT)
    if (draftEstimates.length === 0) {
      notify('Only draft estimates can be deleted', { type: 'warning' })
      return
    }
    if (draftEstimates.length !== estimates.length) {
      notify(`Only ${draftEstimates.length} draft estimate(s) will be deleted. Non-draft estimates cannot be deleted.`, { type: 'info' })
    }
    setEstimatesToDelete(draftEstimates)
    setConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (estimatesToDelete.length === 0) return

    try {
      await deleteMany(
        'estimates',
        { ids: estimatesToDelete.map((e) => e.id) },
        { mutationMode: 'pessimistic' }
      )

      const estimateText = estimatesToDelete.length === 1 ? 'Estimate' : `${estimatesToDelete.length} estimates`
      toast.success(`${estimateText} deleted`, {
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
    } catch (_error) {
      notify('Failed to delete. Please try again.', { type: 'error' })
    } finally {
      setConfirmDelete(false)
      setEstimatesToDelete([])
    }
  }

  // Check if any selected rows are deletable (DRAFT only)
  const deletableSelectedRows = selectedRows.filter(e => e.status === EstimateStatus.DRAFT)

  // Column definitions for Atlantis DataTable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<any[]>(
    () => [
      columnHelper.accessor('estimateNumber', {
        header: 'Estimate #',
        cell: (info) => (
          <Text element="span" className="font-medium">
            {info.getValue()}
          </Text>
        ),
        minSize: 120,
      }),
      columnHelper.accessor('customerId', {
        header: 'Customer',
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
        header: 'Title',
        cell: (info) => (
          <Text element="span">
            {info.getValue()}
          </Text>
        ),
        minSize: 180,
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: (info) => (
          <CurrencyCell value={info.getValue()} currency="USD" />
        ),
        minSize: 120,
      }),
      columnHelper.display({
        id: 'validUntil',
        header: 'Valid Until',
        minSize: 130,
        cell: (info) => {
          const estimate = info.row.original
          const validUntil = estimate.validUntil
          const isExpired =
            estimate.status === EstimateStatus.EXPIRED ||
            (estimate.status !== EstimateStatus.ACCEPTED &&
              estimate.status !== EstimateStatus.REJECTED &&
              estimate.status !== EstimateStatus.CONVERTED &&
              validUntil && new Date(validUntil) < new Date())

          return (
            <DateCell
              date={validUntil ?? undefined}
              showYear
              className={isExpired ? 'text-[var(--color-critical--text)] font-medium' : undefined}
            />
          )
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={estimateStatusToSemantic[status]}
            />
          )
        },
        minSize: 120,
      }),
    ],
    []
  )

  if (isLoading) {
    return <EstimateListSkeleton />
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
              placeholder="Search by estimate #, customer, or title..."
              prefix="search"
              size="small"
            />
            <Button
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
          <Button
            type="tertiary"
            variation="subtle"
            size="small"
            icon="search"
            onClick={showSearch.setTrue}
          >
            Search
          </Button>
        )}

        {/* Display Options */}
        <Button
          ref={displayButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="sliders"
          onClick={displayPopover.toggle}
        >
          Display
        </Button>
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

        {/* Estimate Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'estimate' : 'estimates'}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <DataTable<Estimate>
            data={data || []}
            columns={columns}
            height="calc(100vh - 320px)"
            stickyHeader
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
    <Page
      title={false}
      primaryAction={{
        label: 'Add Estimate',
        icon: 'add',
        onClick: () => navigate('/estimates/create'),
      }}
    >
      {/* Header Actions - Override with admin buttons */}
      <div className="flex items-center justify-between -mt-2 mb-4">
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
          <CreateButton label="Add Estimate" resource="estimates" />
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
                {selectedRows.length} {selectedRows.length === 1 ? 'estimate' : 'estimates'} selected
              </span>
              <Button
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
            <Button
              type="primary"
              variation="destructive"
              size="small"
              icon="trash"
              onClick={() => handleDelete(selectedRows)}
              disabled={deletableSelectedRows.length === 0}
            >
              Delete{deletableSelectedRows.length > 0 && deletableSelectedRows.length !== selectedRows.length
                ? ` (${deletableSelectedRows.length} draft)`
                : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmDelete}
        title="Delete Estimates"
        message={
          estimatesToDelete.length === 1
            ? `Are you sure you want to delete estimate #${estimatesToDelete[0]?.estimateNumber}? This action cannot be undone.`
            : `Are you sure you want to delete ${estimatesToDelete.length} estimates? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDelete(false)
          setEstimatesToDelete([])
        }}
        onRequestClose={() => {
          setConfirmDelete(false)
          setEstimatesToDelete([])
        }}
      />
    </Page>
  )
}

export const EstimateList = () => {
  return (
    <CCard className="border-0 shadow-none">
      <CCardBody>
        <List
          resource="estimates"
          perPage={25}
          sort={{ field: 'createdAt', order: 'DESC' }}
          empty={<EmptyEstimateList />}
        >
          <EstimateListContent />
        </List>
      </CCardBody>
    </CCard>
  )
}
