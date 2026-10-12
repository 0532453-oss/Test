import { Separator } from '@/components/ui/separator'
import { type ClientStatus, clientStatusChoices } from '@/types'
import { Text, Icon, InputText, MultiSelect, Drawer, type SelectOption } from '@/atlantis'

interface ClientsSidebarProps {
  selectedStatuses?: ClientStatus[]
  onStatusesChange?: (statuses: ClientStatus[]) => void
  filterText?: string
  onFilterTextChange?: (text: string) => void
  selectedTags?: string[]
  onTagsChange?: (tags: string[]) => void
  open?: boolean
  onRequestClose?: () => void
  asDrawer?: boolean
}

// Mock tags - in production, this would come from an API
const mockTags = [
  { id: 'commercial', name: 'Commercial' },
  { id: 'residential', name: 'Residential' },
  { id: 'vip', name: 'VIP' },
  { id: 'recurring', name: 'Recurring' },
]

const STATUS_OPTIONS: SelectOption[] = clientStatusChoices.map((choice) => ({
  value: choice.id,
  label: choice.name,
}))

const TAG_OPTIONS: SelectOption[] = mockTags.map((tag) => ({
  value: tag.id,
  label: tag.name,
}))

const ClientsFilterContent = ({
  selectedStatuses = [],
  onStatusesChange,
  filterText = '',
  onFilterTextChange,
  selectedTags = [],
  onTagsChange,
}: Omit<ClientsSidebarProps, 'open' | 'onRequestClose' | 'asDrawer'>) => (
  <div className="flex h-full flex-col gap-4 p-4">
    <InputText
      placeholder="Filter clients..."
      value={filterText}
      onChange={(value) => onFilterTextChange?.(value)}
      prefix="search"
      size="small"
    />

    <Separator />

    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="filter" size="small" className="text-[var(--color-text--secondary)]" />
        <Text element="span" variation="subdued" size="small" className="font-medium">
          Status
        </Text>
      </div>
      <MultiSelect
        value={selectedStatuses}
        options={STATUS_OPTIONS}
        placeholder="All statuses"
        size="small"
        getLabel={(count) => count === 1 ? '1 status' : `${count} statuses`}
        onChange={(values) => onStatusesChange?.(values as ClientStatus[])}
      />
    </div>

    <Separator />

    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="tags" size="small" className="text-[var(--color-text--secondary)]" />
        <Text element="span" variation="subdued" size="small" className="font-medium">
          Tags
        </Text>
      </div>
      <MultiSelect
        value={selectedTags}
        options={TAG_OPTIONS}
        placeholder="All tags"
        size="small"
        getLabel={(count) => count === 1 ? '1 tag' : `${count} tags`}
        onChange={(values) => onTagsChange?.(values as string[])}
      />
    </div>

    <Separator />
    <div className="space-y-2">
      <Text element="span" variation="subdued" size="small" className="font-medium">
        Quick Stats
      </Text>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Text element="span" variation="subdued" size="small">Total Clients</Text>
          <Text element="span" size="small" className="font-medium">&mdash;</Text>
        </div>
        <div className="flex justify-between">
          <Text element="span" variation="subdued" size="small">Active</Text>
          <Text element="span" size="small" className="font-medium text-[var(--color-success--text)]">&mdash;</Text>
        </div>
        <div className="flex justify-between">
          <Text element="span" variation="subdued" size="small">Leads</Text>
          <Text element="span" size="small" className="font-medium text-[var(--color-informative--text)]">&mdash;</Text>
        </div>
      </div>
    </div>
  </div>
)

export const ClientsSidebar = ({
  selectedStatuses = [],
  onStatusesChange,
  filterText = '',
  onFilterTextChange,
  selectedTags = [],
  onTagsChange,
  open = false,
  onRequestClose,
  asDrawer = false,
}: ClientsSidebarProps) => {
  if (asDrawer) {
    return (
      <Drawer
        open={open}
        title="Filter Clients"
        onRequestClose={onRequestClose || (() => {})}
        side="left"
        width="280px"
      >
        <ClientsFilterContent
          selectedStatuses={selectedStatuses}
          onStatusesChange={onStatusesChange}
          filterText={filterText}
          onFilterTextChange={onFilterTextChange}
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
        />
      </Drawer>
    )
  }

  return (
    <aside className="w-64 shrink-0 border-r bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/60">
      <ClientsFilterContent
        selectedStatuses={selectedStatuses}
        onStatusesChange={onStatusesChange}
        filterText={filterText}
        onFilterTextChange={onFilterTextChange}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
      />
    </aside>
  )
}
