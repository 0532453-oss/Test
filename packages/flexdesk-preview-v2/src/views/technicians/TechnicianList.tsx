import { useMemo, useState, useCallback, useEffect } from 'react'
import { useListContext, useListFilterContext, useGetList } from 'ra-core'
import { Link } from 'react-router'
import { List } from '@/components/admin'
import {
  Button,
  Text,
  InputText,
  StatusLabel,
  DataTable,
  createColumnHelper,
  Tabs,
  Tab,
  useBool,
} from '@/atlantis'
import { type TeamMember, TeamMemberRole } from '@/types'
import { SortDropdown, technicianSortOptions } from '@/components/SortDropdown'
import { EmptyTechnicianList, NoFilterResults } from '@/components/EmptyState'
import { TechnicianListSkeleton } from '@/components/skeletons'

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Team', filter: undefined },
  { id: 'active', label: 'Active', filter: true },
  { id: 'inactive', label: 'Inactive', filter: false },
] as const

// Helper to get tab label with count
const getTabLabel = (
  tab: (typeof statusTabs)[number],
  counts: { all: number; active: number; inactive: number },
) => {
  const count = tab.id === 'all' ? counts.all : counts[tab.id as keyof typeof counts]
  return `${tab.label} (${count})`
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
}

const roleSemantic: Record<string, 'informative' | 'warning' | 'success'> = {
  ADMIN: 'informative',
  DISPATCHER: 'warning',
  TECHNICIAN: 'success',
}

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<TeamMember>()

const TechnicianListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<TeamMember>()
  const { setFilters } = useListFilterContext()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const showSearch = useBool(false)
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 })

  // Fetch all team members to get accurate counts for tabs
  const { data: allMembers } = useGetList<TeamMember>('teamMembers', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'name', order: 'ASC' },
  })

  // Calculate status counts when allMembers changes
  useEffect(() => {
    if (allMembers) {
      const counts = {
        all: allMembers.length,
        active: allMembers.filter((m) => m.isActive).length,
        inactive: allMembers.filter((m) => !m.isActive).length,
      }
      setStatusCounts(counts)
    }
  }, [allMembers])

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key] != null)
  const showNoFilterResults = data && data.length === 0 && hasFilters

  // Handle status tab change
  const handleTabChange = useCallback(
    (tabIndex: number) => {
      setActiveTabIndex(tabIndex)
      const tab = statusTabs[tabIndex]
      setFilters(
        {
          ...filterValues,
          isActive: tab?.filter,
        },
        undefined,
      )
    },
    [filterValues, setFilters],
  )

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value)
      setFilters(
        {
          ...filterValues,
          q: value || undefined,
        },
        undefined,
      )
    },
    [filterValues, setFilters],
  )

  // Filter data client-side by search query (name match)
  const filteredData = useMemo(() => {
    if (!data) return []
    if (!searchQuery) return data
    const q = searchQuery.toLowerCase()
    return data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q)),
    )
  }, [data, searchQuery])

  // Column definitions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<any[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        size: 200,
        minSize: 200,
        cell: (info) => (
          <Link
            to={`/technicians/${info.row.original.id}`}
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive--hover)] hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        size: 140,
        minSize: 140,
        cell: (info) => (
          <Text element="span" variation="subdued">
            {info.getValue() || '\u2014'}
          </Text>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        size: 130,
        minSize: 130,
        cell: (info) => {
          const role = info.getValue()
          return (
            <StatusLabel
              label={roleLabels[role] || role}
              status={roleSemantic[role] || 'inactive'}
            />
          )
        },
      }),
      columnHelper.accessor('isActive', {
        header: 'Availability',
        size: 130,
        minSize: 130,
        cell: (info) => {
          const active = info.getValue()
          return (
            <StatusLabel
              label={active ? 'Available' : 'Unavailable'}
              status={active ? 'success' : 'inactive'}
            />
          )
        },
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 220,
        minSize: 200,
        cell: (info) => (
          <Text element="span" variation="subdued">
            {info.getValue() || '\u2014'}
          </Text>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Added',
        size: 120,
        minSize: 120,
        cell: (info) => {
          const date = info.getValue()
          if (!date) return <Text element="span" variation="subdued">{'\u2014'}</Text>
          return (
            <Text element="span" variation="subdued">
              {new Date(date).toLocaleDateString()}
            </Text>
          )
        },
      }),
    ],
    [],
  )

  // Show skeleton while loading
  if (isLoading) {
    return <TechnicianListSkeleton />
  }

  // Show empty state when no data at all
  if (!data || (data.length === 0 && !hasFilters)) {
    return <EmptyTechnicianList />
  }

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
              placeholder="Search by name, email, or phone..."
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

        {/* Sort Dropdown */}
        <SortDropdown options={technicianSortOptions} defaultField="name" />

        {/* Record Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'member' : 'members'}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <DataTable<TeamMember>
            data={filteredData}
            columns={columns}
            height="calc(100vh - 320px)"
            stickyHeader={true}
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <Tabs activeTab={activeTabIndex} onTabChange={handleTabChange}>
          {statusTabs.map((tab) => (
            <Tab key={tab.id} label={getTabLabel(tab, statusCounts)}>
              {/* Content is rendered below, outside the Tabs */}
            </Tab>
          ))}
        </Tabs>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}

export const TechnicianList = () => {
  return (
    <List resource="teamMembers" perPage={25} sort={{ field: 'name', order: 'ASC' }}>
      <TechnicianListContent />
    </List>
  )
}
